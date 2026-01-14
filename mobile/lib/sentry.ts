import React from 'react';
import * as Sentry from '@sentry/react-native';

// Configuration for Sentry
const SENTRY_DSN = 'YOUR_SENTRY_DSN_HERE';
const ENVIRONMENT = process.env.EXPO_PUBLIC_ENVIRONMENT || 'development';

export interface SentryConfig {
  dsn: string;
  environment: string;
  debug?: boolean;
  tracesSampleRate?: number;
  enableAutoSessionTracking?: boolean;
  maxBreadcrumbs?: number;
  beforeSend?: (event: Sentry.Event) => Sentry.Event | null;
}

export class SentryService {
  private static instance: SentryService;

  static getInstance(): SentryService {
    if (!SentryService.instance) {
      SentryService.instance = new SentryService();
    }
    return SentryService.instance;
  }

  /**
   * Initialize Sentry with the given configuration
   */
  initialize(config: SentryConfig): void {
    if (!config.dsn || config.dsn === 'YOUR_SENTRY_DSN_HERE') {
      console.warn('Sentry DSN not configured. Error reporting will be disabled.');
      return;
    }

    try {
      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        debug: config.debug || __DEV__,
        tracesSampleRate: config.tracesSampleRate ?? 0.2,
        enableAutoSessionTracking: config.enableAutoSessionTracking ?? true,
        maxBreadcrumbs: config.maxBreadcrumbs ?? 100,
        beforeSend: config.beforeSend || this.defaultBeforeSend,
        integrations: [
          new Sentry.ReactNativeTracing({
            // Performance monitoring
          }),
        ],
      });

      console.log(`Sentry initialized in ${config.environment} mode`);
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Default beforeSend hook to filter out certain errors
   */
  private defaultBeforeSend(event: Sentry.Event): Sentry.Event | null {
    // Don't send development errors to Sentry
    if (event.environment === 'development') {
      return null;
    }

    // Filter out certain errors by message
    const ignoredMessages = [
      'Network request failed',
      'Network Error',
      'Failed to fetch',
      'Could not connect',
    ];

    if (event.message && ignoredMessages.some(msg => event.message!.includes(msg))) {
      return null;
    }

    // Filter out React warnings
    if (event.exception?.values?.[0]?.type === 'Warning') {
      return null;
    }

    return event;
  }

  /**
   * Capture an exception
   */
  captureException(
    error: Error | string,
    context?: {
      tags?: Record<string, string>;
      extra?: Record<string, any>;
      level?: Sentry.SeverityLevel;
    }
  ): void {
    if (!this.isConfigured()) {
      console.error('Sentry not configured:', error);
      return;
    }

    try {
      Sentry.withScope((scope) => {
        // Set tags
        if (context?.tags) {
          Object.entries(context.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }

        // Set extra context
        if (context?.extra) {
          Object.entries(context.extra).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }

        // Set severity
        if (context?.level) {
          scope.setLevel(context.level);
        }

        // Capture the exception
        Sentry.captureException(error);
      });
    } catch (captureError) {
      console.error('Failed to capture exception:', captureError);
    }
  }

  /**
   * Capture a message
   */
  captureMessage(
    message: string,
    level: Sentry.SeverityLevel = Sentry.Severity.Info,
    context?: {
      tags?: Record<string, string>;
      extra?: Record<string, any>;
    }
  ): void {
    if (!this.isConfigured()) {
      console.log('Sentry not configured, logging message:', message);
      return;
    }

    try {
      Sentry.withScope((scope) => {
        // Set tags
        if (context?.tags) {
          Object.entries(context.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }

        // Set extra context
        if (context?.extra) {
          Object.entries(context.extra).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }

        // Set severity
        scope.setLevel(level);

        // Capture the message
        Sentry.captureMessage(message, level);
      });
    } catch (captureError) {
      console.error('Failed to capture message:', captureError);
    }
  }

  /**
   * Add a breadcrumb for logging
   */
  addBreadcrumb(
    breadcrumb: Sentry.Breadcrumb,
    maxBreadcrumbs = 100
  ): void {
    if (!this.isConfigured()) {
      return;
    }

    try {
      Sentry.addBreadcrumb(breadcrumb, maxBreadcrumbs);
    } catch (error) {
      console.error('Failed to add breadcrumb:', error);
    }
  }

  /**
   * Set user context
   */
  setUser(user: Sentry.User | null): void {
    if (!this.isConfigured()) {
      return;
    }

    try {
      Sentry.setUser(user);
    } catch (error) {
      console.error('Failed to set user:', error);
    }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (!this.isConfigured()) {
      return;
    }

    try {
      Sentry.setUser(null);
    } catch (error) {
      console.error('Failed to clear user:', error);
    }
  }

  /**
   * Set context for errors
   */
  setContext(
    key: string,
    context: Record<string, any>
  ): void {
    if (!this.isConfigured()) {
      return;
    }

    try {
      Sentry.setContext(key, context);
    } catch (error) {
      console.error('Failed to set context:', error);
    }
  }

  /**
   * Start a transaction for performance monitoring
   */
  startTransaction(
    name: string,
    context?: {
      tags?: Record<string, string>;
      extra?: Record<string, any>;
    }
  ): Sentry.Span | null {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const transaction = Sentry.startTransaction({
        name,
        ...context,
      });

      return transaction;
    } catch (error) {
      console.error('Failed to start transaction:', error);
      return null;
    }
  }

  /**
   * Wrap a function with Sentry performance monitoring
   */
  withPerformanceMonitoring<T>(
    name: string,
    fn: () => Promise<T>,
    context?: {
      tags?: Record<string, string>;
      extra?: Record<string, any>;
    }
  ): Promise<T> {
    const transaction = this.startTransaction(name, context);

    return fn()
      .finally(() => {
        transaction?.finish();
      });
  }

  /**
   * Check if Sentry is configured
   */
  private isConfigured(): boolean {
    return !!Sentry.getCurrentHub().getClient();
  }

  /**
   * Capture a custom event
   */
  captureEvent(event: Sentry.Event): string | null {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      return Sentry.captureEvent(event);
    } catch (error) {
      console.error('Failed to capture event:', error);
      return null;
    }
  }

  /**
   * Get the current Sentry session
   */
  getSession(): Sentry.Session | null {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      return Sentry.getCurrentHub().getSession();
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Update session status
   */
  updateSession(session: Partial<Sentry.Session>): void {
    if (!this.isConfigured()) {
      return;
    }

    try {
      Sentry.getCurrentHub().captureSession(session);
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  }

  /**
   * Track a navigation event
   */
  trackNavigation(name: string, context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }): void {
    this.addBreadcrumb({
      category: 'navigation',
      message: `Navigated to ${name}`,
      level: Sentry.Severity.Info,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  /**
   * Track an API call
   */
  trackApiCall(
    method: string,
    url: string,
    status?: number,
    duration?: number,
    error?: Error
  ): void {
    this.addBreadcrumb({
      category: 'api',
      message: `${method} ${url} ${status || 'pending'}`,
      level: error ? Sentry.Severity.Error : Sentry.Severity.Info,
      timestamp: new Date().toISOString(),
      data: {
        method,
        url,
        status,
        duration,
        error: error?.message,
      },
    });

    if (error) {
      this.captureException(error, {
        extra: {
          method,
          url,
          status,
        },
        tags: {
          api_method: method,
          api_url: url,
        },
      });
    }
  }
}

// Create singleton instance
export const sentryService = SentryService.getInstance();

// React hook for using Sentry
export function useSentry() {
  return {
    captureException: sentryService.captureException.bind(sentryService),
    captureMessage: sentryService.captureMessage.bind(sentryService),
    addBreadcrumb: sentryService.addBreadcrumb.bind(sentryService),
    setUser: sentryService.setUser.bind(sentryService),
    clearUser: sentryService.clearUser.bind(sentryService),
    startTransaction: sentryService.startTransaction.bind(sentryService),
  };
}

// Initialize Sentry with default config
export function initializeSentry() {
  sentryService.initialize({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    debug: __DEV__,
    tracesSampleRate: 0.2,
    enableAutoSessionTracking: true,
    beforeSend: (event) => {
      // Don't send development errors
      if (event.environment === 'development') {
        return null;
      }

      // Filter out React warnings
      if (event.exception?.values?.[0]?.type === 'Warning') {
        return null;
      }

      return event;
    },
  });
}

// HOC for adding Sentry to components
export function withSentry<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    breadcrumbCategory?: string;
    tags?: Record<string, string>;
  }
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => {
    const { addBreadcrumb } = useSentry();

    React.useEffect(() => {
      if (options?.breadcrumbCategory) {
        addBreadcrumb({
          category: options.breadcrumbCategory,
          message: `Component rendered: ${Component.name}`,
          level: 'info',
          timestamp: new Date().toISOString(),
          data: {
            tags: options.tags,
          },
        });
      }
    }, []);

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withSentry(${Component.displayName || Component.name})`;
  return WrappedComponent;
}