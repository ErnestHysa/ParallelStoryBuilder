export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  NETWORK = 'network',
  AUTH = 'auth',
  VALIDATION = 'validation',
  STORAGE = 'storage',
  UNKNOWN = 'unknown',
}

export interface AppErrorData {
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  code?: string | number;
  details?: Record<string, any>;
  timestamp: number;
  userId?: string;
  stack?: string;
}

export class AppError extends Error {
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly code?: string | number;
  public readonly details?: Record<string, any>;
  public readonly timestamp: number;
  public readonly userId?: string;
  public readonly stack?: string;

  constructor(
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    code?: string | number,
    details?: Record<string, any>,
    userId?: string,
    stack?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.severity = severity;
    this.category = category;
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();
    this.userId = userId;
    this.stack = stack || this.stack;

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON(): AppErrorData {
    return {
      severity: this.severity,
      category: this.category,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      userId: this.userId,
      stack: this.stack,
    };
  }

  isCritical(): boolean {
    return this.severity === ErrorSeverity.CRITICAL;
  }

  isNetworkError(): boolean {
    return this.category === ErrorCategory.NETWORK;
  }

  isAuthError(): boolean {
    return this.category === ErrorCategory.AUTH;
  }

  static fromError(error: any, context?: Partial<AppErrorData>): AppError {
    let severity = ErrorSeverity.MEDIUM;
    let category = ErrorCategory.UNKNOWN;

    // Classify error
    if (error instanceof AppError) {
      return error;
    }

    if (error?.code === 'NETWORK_ERROR' || error?.code === 'ECONNREFUSED') {
      category = ErrorCategory.NETWORK;
    } else if (error?.code === 'UNAUTHORIZED' || error?.code === '401') {
      category = ErrorCategory.AUTH;
      severity = ErrorSeverity.HIGH;
    } else if (error?.code === 'VALIDATION_ERROR') {
      category = ErrorCategory.VALIDATION;
      severity = ErrorSeverity.LOW;
    }

    return new AppError(
      error?.message || 'An unknown error occurred',
      severity,
      category,
      error?.code,
      {
        originalError: error,
        ...context?.details,
      },
      context?.userId,
      error?.stack
    );
  }
}

// Global error handlers
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCallbacks: Array<(error: AppError) => void> = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  initialize() {
    // React Native doesn't have window event listeners like the web
    // Error handling is typically done through ErrorBoundary components
    // and React Native's global error handlers
    if (typeof ErrorUtils !== 'undefined' && ErrorUtils.setGlobalHandler) {
      // React Native global error handler
      ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
        const appError = AppError.fromError(error);
        this.handleError(appError, { isFatal });
      });
    }
  }

  cleanup() {
    // React Native doesn't need cleanup like web
  }

  handleError(error: AppError, additionalContext?: Record<string, any>) {
    // Notify all callbacks
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });

    // Log error based on severity
    if (error.isCritical()) {
      console.error('CRITICAL ERROR:', error);
    } else if (error.severity === ErrorSeverity.HIGH) {
      console.warn('HIGH SEVERITY ERROR:', error);
    } else {
      console.error('Error:', error);
    }

    // You could also send error reporting here
    this.reportError(error, additionalContext);
  }

  onError(callback: (error: AppError) => void): void {
    this.errorCallbacks.push(callback);
  }

  offError(callback: (error: AppError) => void): void {
    const index = this.errorCallbacks.indexOf(callback);
    if (index > -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }

  private async reportError(error: AppError, context?: Record<string, any>): Promise<void> {
    // This would typically send error data to a monitoring service
    // For now, we'll just log it
    console.log('Error reported:', {
      ...error.toJSON(),
      context,
    });
  }

  // Create method for use in ErrorBoundary
  createError(
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    code?: string | number,
    details?: Record<string, any>
  ): AppError {
    return new AppError(message, severity, category, code, details);
  }
}

// Error utility functions
export const errorUtils = {
  isNetworkError: (error: any): boolean => {
    return (
      error?.code === 'NETWORK_ERROR' ||
      error?.code === 'ECONNREFUSED' ||
      error?.message?.includes('Network') ||
      error?.message?.includes('Failed to fetch') ||
      error?.name === 'NetworkError'
    );
  },

  isAuthError: (error: any): boolean => {
    return (
      error?.code === 'UNAUTHORIZED' ||
      error?.code === '401' ||
      error?.message?.includes('unauthorized') ||
      error?.message?.includes('authentication') ||
      error?.message?.includes('token')
    );
  },

  isStorageError: (error: any): boolean => {
    return (
      error?.code === 'STORAGE_ERROR' ||
      error?.message?.includes('AsyncStorage') ||
      error?.message?.includes('storage')
    );
  },

  createError: (
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    code?: string | number,
    details?: Record<string, any>,
    userId?: string,
    stack?: string
  ): AppError => {
    return new AppError(message, severity, category, code, details, userId, stack);
  },

  withContext: (error: AppError, context: Record<string, any>): AppError => {
    return new AppError(
      error.message,
      error.severity,
      error.category,
      error.code,
      { ...error.details, ...context },
      error.userId,
      error.stack
    );
  },
};

// Retry mechanism for failed operations
export class RetryHandler {
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      delay?: number;
      backoff?: boolean;
      onRetry?: (error: any, retryCount: number) => void;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      delay = 1000,
      backoff = true,
      onRetry,
    } = options;

    let retryCount = 0;

    while (true) {
      try {
        return await fn();
      } catch (error: any) {
        retryCount++;

        if (retryCount >= maxRetries) {
          throw AppError.fromError(error, {
            details: { retryCount, maxRetries },
          });
        }

        onRetry?.(error, retryCount);

        const retryDelay = backoff ? delay * Math.pow(2, retryCount - 1) : delay;

        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
}

// Error boundary utilities for React components
export const ErrorBoundaryUtils = {
  getDerivedStateFromError(error: any): { hasError: boolean; error?: AppError } {
    const appError = AppError.fromError(error);
    return {
      hasError: true,
      error: appError,
    };
  },

  logError(error: any, errorInfo?: { componentStack?: string }) {
    const appError = AppError.fromError(error);
    console.error('React Error Boundary:', {
      error: appError,
      componentStack: errorInfo?.componentStack,
    });
  },
};

// Initialize global error handler
export const errorHandler = ErrorHandler.getInstance();
