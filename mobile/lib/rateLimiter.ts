import { securityManager } from './security';
import { Platform } from 'react-native';

export interface RateLimitConfig {
  enabled: boolean;
  defaultWindowMs: number;
  defaultMaxRequests: number;
  endpoints: Record<string, {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (request: RateLimitRequest) => string;
  }>;
  skipMethods: string[];
  skipPaths: string[];
  trustProxy: boolean;
  onLimitReached: (limit: RateLimitInfo) => void;
  database: {
    type: 'memory' | 'redis' | 'securestore';
    options?: any;
  };
}

export interface RateLimitRequest {
  ip?: string;
  userId?: string;
  endpoint: string;
  method: string;
  path: string;
  headers?: Record<string, string>;
  timestamp: number;
}

export interface RateLimitInfo {
  key: string;
  current: number;
  max: number;
  remaining: number;
  resetTime: number;
  retryAfter: number;
  endpoint: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit?: RateLimitInfo;
  reason?: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  enabled: true,
  defaultWindowMs: 15 * 60 * 1000, // 15 minutes
  defaultMaxRequests: 100,
  endpoints: {
    '/api/auth/login': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      skipSuccessfulRequests: false
    },
    '/api/auth/register': {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      skipSuccessfulRequests: false
    },
    '/api/story/generate': {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
      skipSuccessfulRequests: false
    },
    '/api/story/save': {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 50,
      skipSuccessfulRequests: true
    }
  },
  skipMethods: ['GET', 'HEAD', 'OPTIONS'],
  skipPaths: ['/health', '/metrics'],
  trustProxy: false,
  onLimitReached: (limit) => {
    console.warn('Rate limit reached:', limit);
  },
  database: {
    type: 'securestore'
  }
};

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    firstRequest: number;
  };
}

export class RateLimiter {
  private static instance: RateLimiter;
  private config: RateLimitConfig;
  private store: RateLimitStore = {};
  private cleanupInterval?: NodeJS.Timeout;

  private constructor() {
    this.config = DEFAULT_CONFIG;
    this.initialize();
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  private async initialize() {
    try {
      // Load configuration from secure storage
      const savedConfig = await securityManager.decryptAndRetrieve<RateLimitConfig>('rate_limiter_config');
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }

      // Initialize based on database type
      if (this.config.database.type === 'securestore') {
        await this.loadFromSecureStore();
      }

      // Start cleanup interval
      this.startCleanupInterval();

      await securityManager.logAudit({
        action: 'RATE_LIMITER_INIT',
        resource: 'api_security',
        result: 'success',
        metadata: {
          enabled: this.config.enabled,
          databaseType: this.config.database.type
        }
      });
    } catch (error) {
      await securityManager.logAudit({
        action: 'RATE_LIMITER_INIT_ERROR',
        resource: 'api_security',
        result: 'failure',
        metadata: { error: error.message }
      });
      this.config.enabled = false;
    }
  }

  private startCleanupInterval(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(async () => {
      await this.cleanup();
    }, 5 * 60 * 1000);
  }

  private async cleanup(): Promise<void> {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (const [key, data] of Object.entries(this.store)) {
      if (data.resetTime < now) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      delete this.store[key];
    }

    if (this.config.database.type === 'securestore' && keysToRemove.length > 0) {
      await this.saveToSecureStore();
    }

    if (keysToRemove.length > 0) {
      await securityManager.logAudit({
        action: 'RATE_LIMITER_CLEANUP',
        resource: 'api_security',
        result: 'success',
        metadata: { cleanedEntries: keysToRemove.length }
      });
    }
  }

  // Main rate limiting method
  async checkLimit(request: RateLimitRequest): Promise<RateLimitResult> {
    if (!this.config.enabled) {
      return { allowed: true };
    }

    // Check if rate limiting should be skipped for this request
    if (this.shouldSkipRateLimit(request)) {
      return { allowed: true };
    }

    // Generate rate limit key
    const key = await this.generateKey(request);

    // Get endpoint-specific configuration
    const endpointConfig = this.getEndpointConfig(request.endpoint);
    const { windowMs, maxRequests, skipSuccessfulRequests, skipFailedRequests } = endpointConfig;

    // Get current limit info
    const limitInfo = await this.getLimitInfo(key, windowMs, maxRequests);

    // Check if limit is exceeded
    if (limitInfo.current >= limitInfo.max) {
      const retryAfter = Math.ceil((limitInfo.resetTime - Date.now()) / 1000);

      // Notify about limit reached
      this.config.onLimitReached(limitInfo);

      await securityManager.logAudit({
        action: 'RATE_LIMIT_EXCEEDED',
        resource: 'api_endpoint',
        result: 'warning',
        metadata: {
          key,
          endpoint: request.endpoint,
          current: limitInfo.current,
          max: limitInfo.max,
          retryAfter,
          userId: request.userId
        }
      });

      return {
        allowed: false,
        limit: limitInfo,
        reason: `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      };
    }

    // Increment counter
    await this.incrementCounter(key, windowMs);

    return {
      allowed: true,
      limit: {
        ...limitInfo,
        remaining: limitInfo.max - (limitInfo.current + 1)
      }
    };
  }

  private shouldSkipRateLimit(request: RateLimitRequest): boolean {
    // Skip by method
    if (this.config.skipMethods.includes(request.method.toUpperCase())) {
      return true;
    }

    // Skip by path
    for (const path of this.config.skipPaths) {
      if (request.path.startsWith(path)) {
        return true;
      }
    }

    return false;
  }

  private async generateKey(request: RateLimitRequest): Promise<string> {
    // Check if endpoint has custom key generator
    const endpointConfig = this.getEndpointConfig(request.endpoint);
    if (endpointConfig.keyGenerator) {
      return endpointConfig.keyGenerator(request);
    }

    // Default key generation: use IP or user ID + endpoint + method
    const baseKey = request.userId || request.ip || 'anonymous';
    return `${baseKey}:${request.endpoint}:${request.method}`;
  }

  private getEndpointConfig(endpoint: string): {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (request: RateLimitRequest) => string;
  } {
    // Find exact match
    if (this.config.endpoints[endpoint]) {
      return this.config.endpoints[endpoint];
    }

    // Find wildcard match
    for (const [key, config] of Object.entries(this.config.endpoints)) {
      if (key.includes('*')) {
        const pattern = key.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(endpoint)) {
          return config;
        }
      }
    }

    // Return default configuration
    return {
      windowMs: this.config.defaultWindowMs,
      maxRequests: this.config.defaultMaxRequests
    };
  }

  private async getLimitInfo(key: string, windowMs: number, maxRequests: number): Promise<RateLimitInfo> {
    const now = Date.now();
    const resetTime = now + windowMs;

    // Get from store
    let entry = this.store[key];

    if (!entry || entry.resetTime < now) {
      // New or expired entry
      entry = {
        count: 0,
        resetTime,
        firstRequest: now
      };
    }

    return {
      key,
      current: entry.count,
      max: maxRequests,
      remaining: Math.max(0, maxRequests - entry.count),
      resetTime,
      retryAfter: Math.ceil((resetTime - now) / 1000),
      endpoint: key.split(':')[1] || 'unknown'
    };
  }

  private async incrementCounter(key: string, windowMs: number): Promise<void> {
    const now = Date.now();
    const resetTime = now + windowMs;

    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = {
        count: 1,
        resetTime,
        firstRequest: now
      };
    } else {
      this.store[key].count++;
    }

    // Save to persistent storage if using SecureStore
    if (this.config.database.type === 'securestore') {
      await this.saveToSecureStore();
    }
  }

  // SecureStore persistence
  private async loadFromSecureStore(): Promise<void> {
    try {
      const data = await securityManager.decryptAndRetrieve<RateLimitStore>('rate_limiter_store');
      if (data) {
        this.store = data;
      }
    } catch (error) {
      console.warn('Failed to load rate limiter store:', error);
      this.store = {};
    }
  }

  private async saveToSecureStore(): Promise<void> {
    try {
      await securityManager.encryptAndStore('rate_limiter_store', this.store);
    } catch (error) {
      console.warn('Failed to save rate limiter store:', error);
    }
  }

  // Record successful request (for endpoint-specific config)
  async recordSuccess(request: RateLimitRequest): Promise<void> {
    const endpointConfig = this.getEndpointConfig(request.endpoint);
    if (endpointConfig.skipSuccessfulRequests) {
      return;
    }

    const key = await this.generateKey(request);
    await this.incrementCounter(key, endpointConfig.windowMs);
  }

  // Record failed request (for endpoint-specific config)
  async recordFailure(request: RateLimitRequest): Promise<void> {
    const endpointConfig = this.getEndpointConfig(request.endpoint);
    if (endpointConfig.skipFailedRequests) {
      return;
    }

    const key = await this.generateKey(request);
    await this.incrementCounter(key, endpointConfig.windowMs);
  }

  // Reset limits for a specific key
  async resetLimit(key: string): Promise<boolean> {
    if (this.store[key]) {
      delete this.store[key];

      if (this.config.database.type === 'securestore') {
        await this.saveToSecureStore();
      }

      await securityManager.logAudit({
        action: 'RATE_LIMIT_RESET',
        resource: 'api_security',
        result: 'success',
        metadata: { key }
      });

      return true;
    }
    return false;
  }

  // Reset all limits
  async resetAllLimits(): Promise<void> {
    this.store = {};

    if (this.config.database.type === 'securestore') {
      await securityManager.encryptAndStore('rate_limiter_store', {});
    }

    await securityManager.logAudit({
      action: 'ALL_RATE_LIMITS_RESET',
      resource: 'api_security',
      result: 'success'
    });
  }

  // Get current limits for debugging
  async getCurrentLimits(): Promise<RateLimitInfo[]> {
    const limits: RateLimitInfo[] = [];

    for (const [key, entry] of Object.entries(this.store)) {
      const parts = key.split(':');
      const endpoint = parts[1] || 'unknown';
      const endpointConfig = this.getEndpointConfig(endpoint);

      limits.push({
        key,
        current: entry.count,
        max: endpointConfig.maxRequests,
        remaining: Math.max(0, endpointConfig.maxRequests - entry.count),
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - Date.now()) / 1000),
        endpoint
      });
    }

    return limits;
  }

  // Configuration management
  async updateConfig(newConfig: Partial<RateLimitConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };

    // Update existing store entries with new defaults if needed
    if (newConfig.defaultWindowMs || newConfig.defaultMaxRequests) {
      await this.migrateStoreEntries();
    }

    // Save configuration
    await securityManager.encryptAndStore('rate_limiter_config', this.config);

    await securityManager.logAudit({
      action: 'RATE_LIMITER_CONFIG_UPDATED',
      resource: 'api_security',
      result: 'success'
    });
  }

  private async migrateStoreEntries(): Promise<void> {
    // In a real implementation, migrate existing entries to new configuration
    // For now, just save the updated store
    await this.saveToSecureStore();
  }

  getConfig(): RateLimitConfig {
    return { ...this.config };
  }

  // Get statistics
  getStats(): {
    totalKeys: number;
    averageRequestsPerKey: number;
    keysNearLimit: number;
    nextCleanup: number;
  } {
    const keys = Object.keys(this.store);
    const totalKeys = keys.length;
    const now = Date.now();

    let totalRequests = 0;
    let keysNearLimit = 0;

    for (const entry of Object.values(this.store)) {
      totalRequests += entry.count;

      // Consider keys within 10% of limit as "near limit"
      if (entry.count >= entry.resetTime * 0.9) {
        keysNearLimit++;
      }
    }

    return {
      totalKeys,
      averageRequestsPerKey: totalKeys > 0 ? totalRequests / totalKeys : 0,
      keysNearLimit,
      nextCleanup: this.cleanupInterval ?
        Math.max(0, 5 * 60 * 1000 - (now % (5 * 60 * 1000))) / 1000 : 0
    };
  }

  // Cleanup on destroy
  async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    if (this.config.database.type === 'securestore') {
      await securityManager.decryptAndRetrieve('rate_limiter_store');
    }

    await securityManager.logAudit({
      action: 'RATE_LIMITER_DESTROYED',
      resource: 'api_security',
      result: 'success'
    });
  }
}

// Export singleton instance
export const rateLimiter = RateLimiter.getInstance();

// Helper functions for common use cases
export const createSupabaseRateLimitMiddleware = () => {
  return async (request: RateLimitRequest): Promise<RateLimitResult> => {
    return await rateLimiter.checkLimit(request);
  };
};

export const createAuthRateLimitMiddleware = () => {
  return async (request: RateLimitRequest): Promise<RateLimitResult> => {
    // Special handling for authentication endpoints
    if (request.endpoint.includes('/auth/')) {
      // Shorter window, lower limit for auth
      const authRequest = {
        ...request,
        endpoint: '/api/auth/login' // Map all auth to login endpoint
      };
      return await rateLimiter.checkLimit(authRequest);
    }
    return await rateLimiter.checkLimit(request);
  };
};

export const createStoryRateLimitMiddleware = () => {
  return async (request: RateLimitRequest): Promise<RateLimitResult> => {
    // Special handling for story endpoints
    if (request.endpoint.includes('/story/')) {
      // Different limits based on operation
      if (request.endpoint.includes('/generate')) {
        const genRequest = {
          ...request,
          endpoint: '/api/story/generate'
        };
        return await rateLimiter.checkLimit(genRequest);
      } else if (request.endpoint.includes('/save')) {
        const saveRequest = {
          ...request,
          endpoint: '/api/story/save'
        };
        return await rateLimiter.checkLimit(saveRequest);
      }
    }
    return await rateLimiter.checkLimit(request);
  };
};

// Decorator for rate limiting functions
export const rateLimit = (options: {
  endpoint?: string;
  windowMs?: number;
  maxRequests?: number;
}) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Extract request information from arguments
      const request: RateLimitRequest = {
        endpoint: options.endpoint || propertyKey,
        method: 'POST', // Default to POST
        path: options.endpoint || propertyKey,
        timestamp: Date.now(),
        userId: args.find(arg => arg?.userId)?.userId,
        ip: args.find(arg => arg?.ip)?.ip
      };

      // Check rate limit
      const result = await rateLimiter.checkLimit(request);

      if (!result.allowed) {
        throw new Error(result.reason || 'Rate limit exceeded');
      }

      // Execute original method
      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
};