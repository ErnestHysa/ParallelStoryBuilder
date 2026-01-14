import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';
import { z } from 'zod';

export interface SecurityConfig {
  encryptionKey: string;
  biometricEnabled: boolean;
  sessionTimeout: number;
  maxFailedAttempts: number;
  lockoutDuration: number;
  auditLogLevel: 'minimal' | 'standard' | 'verbose';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  action: string;
  resource: string;
  metadata?: Record<string, any>;
  result: 'success' | 'failure' | 'warning';
  ip?: string;
  userAgent?: string;
}

// Default security configuration
const DEFAULT_CONFIG: SecurityConfig = {
  encryptionKey: '', // Will be set at runtime
  biometricEnabled: true,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  maxFailedAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  auditLogLevel: 'standard'
};

export class SecurityManager {
  private static instance: SecurityManager;
  private config: SecurityConfig;
  private auditLogs: AuditLogEntry[] = [];
  private failedAttempts = 0;
  private lastFailedAttempt = 0;
  private sessionStart = Date.now();

  private constructor() {
    this.config = DEFAULT_CONFIG;
    this.initialize();
  }

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  private async initialize() {
    try {
      // Generate or retrieve encryption key
      const existingKey = await SecureStore.getItemAsync('security_encryption_key');
      if (existingKey) {
        this.config.encryptionKey = existingKey;
      } else {
        const newKey = CryptoJS.lib.WordArray.random(256/8).toString();
        await SecureStore.setItemAsync('security_encryption_key', newKey);
        this.config.encryptionKey = newKey;
      }
    } catch (error) {
      this.logAudit({
        action: 'INIT_FAILURE',
        resource: 'SecurityManager',
        result: 'failure',
        metadata: { error: error.message }
      });
      throw error;
    }
  }

  // Audit logging
  async logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    const auditEntry: AuditLogEntry = {
      id: this.generateSecureId(),
      timestamp: new Date().toISOString(),
      ...entry
    };

    this.auditLogs.push(auditEntry);

    // Only persist recent logs based on log level
    const maxLogs = this.config.auditLogLevel === 'minimal' ? 10 :
                    this.config.auditLogLevel === 'standard' ? 50 : 100;

    if (this.auditLogs.length > maxLogs) {
      this.auditLogs = this.auditLogs.slice(-maxLogs);
    }

    // Store audit logs securely
    await this.encryptAndStore('audit_logs', this.auditLogs);

    // In production, send to secure logging service
    if (Platform.OS === 'web' || __DEV__) {
      console.log('[AUDIT LOG]', auditEntry);
    }
  }

  // Session management
  checkSessionValidity(): boolean {
    const now = Date.now();
    const elapsed = now - this.sessionStart;

    if (elapsed > this.config.sessionTimeout) {
      this.logAudit({
        action: 'SESSION_EXPIRED',
        resource: 'user_session',
        result: 'warning'
      });
      return false;
    }

    return true;
  }

  refreshSession() {
    this.sessionStart = Date.now();
    this.logAudit({
      action: 'SESSION_REFRESHED',
      resource: 'user_session',
      result: 'success'
    });
  }

  // Rate limiting
  checkRateLimit(action: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();

    // Check if in lockout period
    if (this.failedAttempts >= this.config.maxFailedAttempts) {
      const lockoutTime = this.lastFailedAttempt + this.config.lockoutDuration;
      if (now < lockoutTime) {
        return {
          allowed: false,
          retryAfter: Math.ceil((lockoutTime - now) / 1000)
        };
      }
      // Reset lockout after duration
      this.failedAttempts = 0;
    }

    return { allowed: true };
  }

  recordFailedAttempt(action: string) {
    this.failedAttempts++;
    this.lastFailedAttempt = Date.now();

    this.logAudit({
      action: 'FAILED_ATTEMPT',
      resource: action,
      result: 'failure',
      metadata: {
        attempts: this.failedAttempts,
        maxAttempts: this.config.maxFailedAttempts
      }
    });

    if (this.failedAttempts >= this.config.maxFailedAttempts) {
      this.logAudit({
        action: 'ACCOUNT_LOCKOUT',
        resource: 'authentication',
        result: 'warning'
      });
    }
  }

  recordSuccess(action: string) {
    if (this.failedAttempts > 0) {
      this.failedAttempts = Math.max(0, this.failedAttempts - 1);
    }

    this.logAudit({
      action: 'SUCCESS',
      resource: action,
      result: 'success'
    });
  }

  // Data encryption
  encryptData(data: any): string {
    try {
      const jsonData = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(
        jsonData,
        this.config.encryptionKey
      ).toString();

      this.logAudit({
        action: 'DATA_ENCRYPTED',
        resource: 'sensitive_data',
        result: 'success'
      });

      return encrypted;
    } catch (error) {
      this.logAudit({
        action: 'ENCRYPTION_FAILED',
        resource: 'sensitive_data',
        result: 'failure',
        metadata: { error: error.message }
      });
      throw error;
    }
  }

  decryptData(encryptedData: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.config.encryptionKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      const data = JSON.parse(decrypted);

      this.logAudit({
        action: 'DATA_DECRYPTED',
        resource: 'sensitive_data',
        result: 'success'
      });

      return data;
    } catch (error) {
      this.logAudit({
        action: 'DECRYPTION_FAILED',
        resource: 'sensitive_data',
        result: 'failure',
        metadata: { error: error.message }
      });
      throw new Error('Decryption failed');
    }
  }

  async encryptAndStore(key: string, data: any): Promise<void> {
    const encrypted = this.encryptData(data);
    await SecureStore.setItemAsync(`secure_${key}`, encrypted);
  }

  async decryptAndRetrieve<T>(key: string): Promise<T | null> {
    try {
      const encrypted = await SecureStore.getItemAsync(`secure_${key}`);
      if (!encrypted) return null;
      return this.decryptData(encrypted) as T;
    } catch {
      return null;
    }
  }

  // Utility functions
  private generateSecureId(): string {
    return CryptoJS.lib.WordArray.random(128/8).toString();
  }

  async clearAllSecureData(): Promise<void> {
    const keys = await SecureStore.getAllKeys();
    for (const key of keys) {
      if (key.startsWith('secure_') || key === 'security_encryption_key') {
        await SecureStore.deleteItemAsync(key);
      }
    }

    this.auditLogs = [];
    this.failedAttempts = 0;
    this.sessionStart = Date.now();

    this.logAudit({
      action: 'SECURE_DATA_CLEARED',
      resource: 'all_data',
      result: 'success'
    });
  }

  getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs];
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logAudit({
      action: 'CONFIG_UPDATED',
      resource: 'security_settings',
      result: 'success'
    });
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance();

// Security helper functions
export const sanitizeInput = (input: unknown): string => {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

export const validateAgainstXSS = (input: string): boolean => {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /<input/i,
    /<button/i,
    /<img/i,
    /<link/i,
    /<meta/i,
    /<style/i,
    /<textarea/i,
    /<select/i,
    /<option/i,
    /<svg/i,
    /<math/i,
    /<applet/i,
    /<body/i,
    /<head/i,
    /<html/i,
    /<title/i,
    /<frame/i,
    /<frameset/i,
    /<layer/i,
    /<ilayer/i
  ];

  return !xssPatterns.some(pattern => pattern.test(input));
};

export const generateSecureToken = (length: number = 32): string => {
  return CryptoJS.lib.WordArray.random(length * 8).toString();
};

export const hashPassword = (password: string, salt?: string): { hash: string; salt: string } => {
  const generatedSalt = salt || generateSecureToken(16);
  const hash = CryptoJS.PBKDF2(password, generatedSalt, {
    keySize: 256/32,
    iterations: 10000
  }).toString();

  return { hash, salt: generatedSalt };
};

export const verifyPassword = (password: string, hash: string, salt: string): boolean => {
  const { hash: computedHash } = hashPassword(password, salt);
  return computedHash === hash;
};