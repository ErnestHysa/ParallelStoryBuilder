// Analytics wrapper for tracking
import { Platform } from 'react-native';

// Analytics provider types
export enum AnalyticsProvider {
  AMPLITUDE = 'amplitude',
  MIXPANEL = 'mixpanel',
  FIREBASE = 'firebase',
  NONE = 'none',
}

// Event properties interface
export interface EventProperties {
  [key: string]: any;
}

// User properties interface
export interface UserProperties {
  [key: string]: any;
}

// Screen tracking options
export interface ScreenTrackingOptions {
  name: string;
  properties?: EventProperties;
  clearPreviousScreen?: boolean;
}

// Analytics configuration
export interface AnalyticsConfig {
  provider: AnalyticsProvider;
  apiKey?: string;
  enableDebugMode?: boolean;
  trackScreens?: boolean;
  trackEvents?: boolean;
  trackSessions?: boolean;
}

// Default configuration
const DEFAULT_CONFIG: AnalyticsConfig = {
  provider: AnalyticsProvider.NONE,
  enableDebugMode: __DEV__,
  trackScreens: true,
  trackEvents: true,
  trackSessions: true,
};

class Analytics {
  private config: AnalyticsConfig;
  private initialized = false;
  private userId: string | null = null;
  private sessionId: string | null = null;
  private sessionStartTime: number | null = null;
  private lastScreen: string | null = null;

  constructor(config: AnalyticsConfig = DEFAULT_CONFIG) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Initialize analytics
  async initialize(userId?: string): Promise<void> {
    if (this.initialized) return;

    this.userId = userId || null;

    if (this.userId) {
      this.setUserId(this.userId);
    }

    if (this.config.trackSessions) {
      this.startSession();
    }

    if (this.config.enableDebugMode) {
      console.log('[Analytics] Initialized with config:', this.config);
    }

    this.initialized = true;
  }

  // Set user ID
  setUserId(userId: string): void {
    this.userId = userId;

    if (this.config.enableDebugMode) {
      console.log('[Analytics] Set user ID:', userId);
    }

    // Provider-specific implementations would go here
    // when the actual packages are installed
  }

  // Set user properties
  setUserProperties(properties: UserProperties): void {
    if (!this.initialized || !this.config.trackEvents) return;

    if (this.config.enableDebugMode) {
      console.log('[Analytics] Setting user properties:', properties);
    }

    // Provider-specific implementations would go here
  }

  // Increment user property
  incrementUserProperty(property: string, value: number = 1): void {
    if (!this.initialized || !this.config.trackEvents) return;

    if (this.config.enableDebugMode) {
      console.log('[Analytics] Incrementing property:', property, value);
    }

    // Provider-specific implementations would go here
  }

  // Track custom event
  track(eventName: string, properties?: EventProperties): void {
    if (!this.initialized || !this.config.trackEvents) return;

    const eventProperties = {
      ...properties,
      platform: Platform.OS,
      timestamp: Date.now(),
    };

    if (this.config.enableDebugMode) {
      console.log('[Analytics] Track event:', eventName, eventProperties);
    }

    // Provider-specific implementations would go here
  }

  // Track screen view
  trackScreen(options: ScreenTrackingOptions): void {
    if (!this.initialized || !this.config.trackScreens) return;

    const { name, properties, clearPreviousScreen } = options;

    if (this.config.enableDebugMode) {
      console.log('[Analytics] Track screen:', name, properties);
    }

    this.lastScreen = name;

    // Provider-specific implementations would go here
  }

  // Session management
  startSession(): void {
    this.sessionId = crypto.randomUUID();
    this.sessionStartTime = Date.now();

    if (this.config.enableDebugMode) {
      console.log('[Analytics] Session started:', this.sessionId);
    }

    this.track('session_started', {
      session_id: this.sessionId,
      platform: Platform.OS,
    });
  }

  endSession(): void {
    if (!this.sessionId || !this.sessionStartTime) return;

    const duration = Date.now() - this.sessionStartTime;

    this.track('session_ended', {
      session_id: this.sessionId,
      duration_ms: duration,
      platform: Platform.OS,
    });

    if (this.config.enableDebugMode) {
      console.log('[Analytics] Session ended:', this.sessionId, 'Duration:', duration);
    }

    this.sessionId = null;
    this.sessionStartTime = null;
  }

  // Get session info
  getSessionInfo(): { sessionId: string | null; duration: number | null } {
    if (!this.sessionId || !this.sessionStartTime) {
      return { sessionId: null, duration: null };
    }

    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.sessionStartTime,
    };
  }

  // Reset analytics
  reset(): void {
    this.userId = null;
    this.sessionId = null;
    this.sessionStartTime = null;
    this.lastScreen = null;

    if (this.config.enableDebugMode) {
      console.log('[Analytics] Reset');
    }

    // Provider-specific implementations would go here
  }

  // Enable/disable tracking
  setTrackingEnabled(enabled: boolean): void {
    this.config.trackEvents = enabled;
    this.config.trackScreens = enabled;

    if (this.config.enableDebugMode) {
      console.log('[Analytics] Tracking enabled:', enabled);
    }
  }

  // Check if tracking is enabled
  isTrackingEnabled(): boolean {
    return !!(this.config.trackEvents || this.config.trackScreens);
  }
}

// Singleton instance
let analyticsInstance: Analytics | null = null;

export const initializeAnalytics = (config?: AnalyticsConfig): Analytics => {
  if (!analyticsInstance) {
    analyticsInstance = new Analytics(config);
  }
  return analyticsInstance;
};

export const getAnalytics = (): Analytics => {
  if (!analyticsInstance) {
    analyticsInstance = new Analytics();
  }
  return analyticsInstance;
};

// Convenience functions
export const trackEvent = (eventName: string, properties?: EventProperties): void => {
  getAnalytics().track(eventName, properties);
};

export const trackScreen = (name: string, properties?: EventProperties): void => {
  getAnalytics().trackScreen({ name, properties });
};

export const setAnalyticsUserId = (userId: string): void => {
  getAnalytics().setUserId(userId);
};

export const setAnalyticsUserProperties = (properties: UserProperties): void => {
  getAnalytics().setUserProperties(properties);
};

export const startSession = (): void => {
  getAnalytics().startSession();
};

export const endSession = (): void => {
  getAnalytics().endSession();
};

export default Analytics;
