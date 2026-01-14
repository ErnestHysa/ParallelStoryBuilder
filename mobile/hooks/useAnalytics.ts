import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { EventNames } from '../lib/trackingEvents';

interface EventProperties {
  [key: string]: string | number | boolean | undefined | null;
}

interface UserProperties {
  [key: string]: string | number | boolean | undefined | null;
}

interface ScreenTrackingOptions {
  screenName: string;
  screenClass?: string;
}

interface UseAnalyticsReturn {
  // State
  isInitialized: boolean;
  userId: string | null;
  sessionId: string | null;

  // Actions
  initialize: (userId?: string) => Promise<void>;
  setUserId: (userId: string) => void;
  setUserProperties: (properties: UserProperties) => void;
  incrementUserProperty: (property: string, value?: number) => void;
  track: (eventName: string, properties?: EventProperties) => void;
  trackScreen: (name: string, properties?: EventProperties) => void;
  trackScreenView: (options: ScreenTrackingOptions) => void;
  identify: (userId: string, userProperties?: UserProperties) => void;
  group: (groupType: string, groupName: string, groupProperties?: EventProperties) => void;
  flush: () => Promise<void>;
  reset: () => void;

  // Events
  trackUserEvent: (eventName: keyof typeof EventNames, properties?: EventProperties) => void;
  trackStoryEvent: (
    eventName: keyof typeof EventNames,
    storyId?: string,
    additionalProperties?: EventProperties
  ) => void;
  trackScreenEvent: (screenName: string, properties?: EventProperties) => void;
  trackError: (error: Error, screen?: string, action?: string) => void;
  trackPerformance: (eventName: string, duration: number, properties?: EventProperties) => void;

  // Session tracking
  startSession: () => void;
  endSession: () => void;
  getSessionDuration: () => number;
}

// Simple in-memory analytics store
class SimpleAnalytics {
  private static instance: SimpleAnalytics;
  private events: Array<{ name: string; properties?: EventProperties; timestamp: number }> = [];
  private userId: string | null = null;
  private sessionId: string | null = null;
  private sessionStartTime: number | null = null;

  static getInstance(): SimpleAnalytics {
    if (!SimpleAnalytics.instance) {
      SimpleAnalytics.instance = new SimpleAnalytics();
    }
    return SimpleAnalytics.instance;
  }

  initialize(userId?: string): Promise<void> {
    this.userId = userId || null;
    this.startSession();
    return Promise.resolve();
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  setUserProperties(properties: UserProperties): void {
    console.log('[Analytics] Set user properties:', properties);
  }

  track(eventName: string, properties?: EventProperties): void {
    const event = {
      name: eventName,
      properties: {
        ...properties,
        platform: Platform.OS,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };
    this.events.push(event);
    if (__DEV__) {
      console.log('[Analytics] Track:', event);
    }
  }

  identify(userId: string, userProperties?: UserProperties): void {
    this.userId = userId;
    if (__DEV__) {
      console.log('[Analytics] Identify:', userId, userProperties);
    }
  }

  flush(): Promise<void> {
    if (__DEV__) {
      console.log('[Analytics] Flushing', this.events.length, 'events');
    }
    this.events = [];
    return Promise.resolve();
  }

  reset(): void {
    this.userId = null;
    this.events = [];
    this.endSession();
  }

  startSession(): void {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.sessionStartTime = Date.now();
  }

  endSession(): void {
    this.sessionId = null;
    this.sessionStartTime = null;
  }

  getSessionDuration(): number {
    return this.sessionStartTime ? Date.now() - this.sessionStartTime : 0;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}

export const useAnalytics = (): UseAnalyticsReturn => {
  const analyticsRef = useRef(SimpleAnalytics.getInstance());
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const initialize = useCallback(async (userId?: string): Promise<void> => {
    await analyticsRef.current.initialize(userId);
    setCurrentUserId(userId || null);
    setCurrentSessionId(analyticsRef.current.getSessionId());
    setIsInitialized(true);
  }, []);

  const setUserId = useCallback((userId: string) => {
    analyticsRef.current.setUserId(userId);
    setCurrentUserId(userId);
  }, []);

  const setUserProperties = useCallback((properties: UserProperties) => {
    analyticsRef.current.setUserProperties(properties);
  }, []);

  const incrementUserProperty = useCallback((property: string, value = 1) => {
    console.log('[Analytics] Increment', property, 'by', value);
  }, []);

  const track = useCallback((eventName: string, properties?: EventProperties) => {
    analyticsRef.current.track(eventName, properties);
  }, []);

  const trackScreen = useCallback((name: string, properties?: EventProperties) => {
    analyticsRef.current.track('screen_view', { screen_name: name, ...properties });
  }, []);

  const trackScreenView = useCallback((options: ScreenTrackingOptions) => {
    analyticsRef.current.track('screen_view', {
      screen_name: options.screenName,
      screen_class: options.screenClass,
    });
  }, []);

  const identify = useCallback((userId: string, userProperties?: UserProperties) => {
    analyticsRef.current.identify(userId, userProperties);
    setCurrentUserId(userId);
  }, []);

  const group = useCallback((groupType: string, groupName: string, groupProperties?: EventProperties) => {
    analyticsRef.current.track('group_identify', {
      group_type: groupType,
      group_name: groupName,
      ...groupProperties,
    });
  }, []);

  const flush = useCallback(async (): Promise<void> => {
    return analyticsRef.current.flush();
  }, []);

  const reset = useCallback(() => {
    analyticsRef.current.reset();
    setCurrentUserId(null);
    setCurrentSessionId(null);
  }, []);

  const trackUserEvent = useCallback((eventName: keyof typeof EventNames, properties?: EventProperties) => {
    analyticsRef.current.track(eventName, properties);
  }, []);

  const trackStoryEvent = useCallback(
    (eventName: keyof typeof EventNames, storyId?: string, additionalProperties?: EventProperties) => {
      analyticsRef.current.track(eventName, {
        story_id: storyId,
        ...additionalProperties,
      });
    },
    []
  );

  const trackScreenEvent = useCallback((screenName: string, properties?: EventProperties) => {
    analyticsRef.current.track('screen_view', { screen_name: screenName, ...properties });
  }, []);

  const trackError = useCallback((error: Error, screen?: string, action?: string) => {
    analyticsRef.current.track('error', {
      error_message: error.message,
      error_stack: error.stack,
      screen,
      action,
    });
  }, []);

  const trackPerformance = useCallback((eventName: string, duration: number, properties?: EventProperties) => {
    analyticsRef.current.track('performance', {
      event_name: eventName,
      duration_ms: duration,
      ...properties,
    });
  }, []);

  const startSession = useCallback(() => {
    analyticsRef.current.startSession();
    setCurrentSessionId(analyticsRef.current.getSessionId());
  }, []);

  const endSession = useCallback(() => {
    analyticsRef.current.endSession();
    setCurrentSessionId(null);
  }, []);

  const getSessionDuration = useCallback(() => {
    return analyticsRef.current.getSessionDuration();
  }, []);

  return {
    isInitialized,
    userId: currentUserId,
    sessionId: currentSessionId,
    initialize,
    setUserId,
    setUserProperties,
    incrementUserProperty,
    track,
    trackScreen,
    trackScreenView,
    identify,
    group,
    flush,
    reset,
    trackUserEvent,
    trackStoryEvent,
    trackScreenEvent,
    trackError,
    trackPerformance,
    startSession,
    endSession,
    getSessionDuration,
  };
};
