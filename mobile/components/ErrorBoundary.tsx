import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Using console.error instead of sentry for now since @sentry/react-native may not be installed
// import { sentryService } from '@/lib/sentry';
import { ErrorHandler, ErrorBoundaryUtils, ErrorSeverity, ErrorCategory } from '@/lib/errorHandling';
import type { AppError } from '@/lib/errorHandling';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: AppError;
  errorInfo?: {
    componentStack?: string;
  };
  isRetrying: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: AppError; retry: () => void; resetError: () => void }>;
  onError?: (error: AppError, errorInfo: { componentStack?: string }) => void;
  showDetails?: boolean;
  className?: string;
}

// Simple theme colors
const colors = {
  background: '#FFFFFF',
  error: '#FF3B30',
  primary: '#007AFF',
  grey1: '#000000',
  grey2: '#8E8E93',
  grey3: '#C7C7CC',
  warning: '#FFCC00',
};

export class ErrorBoundaryComponent extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeout?: NodeJS.Timeout;
  private errorRetryCount = 0;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState['hasError'] {
    ErrorBoundaryUtils.logError(error);
    return true;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const appError = ErrorHandler.getInstance().createError(
      error.message,
      ErrorSeverity.HIGH,
      ErrorCategory.UNKNOWN,
      undefined,
      { errorInfo }
    );

    this.setState({
      error: appError,
      errorInfo: {
        componentStack: errorInfo.componentStack || undefined,
      },
    });

    // Log to console (would use Sentry in production)
    console.error('ErrorBoundary caught error:', {
      error,
      componentStack: errorInfo.componentStack,
    });
    // sentryService?.captureException?.(error, {
    //   tags: { component: 'ErrorBoundary' },
    //   extra: { componentStack: errorInfo.componentStack },
    // });

    // Call custom error handler
    this.props.onError?.(appError, { componentStack: errorInfo.componentStack || '' });
  }

  handleRetry = (): void => {
    if (this.errorRetryCount >= this.maxRetries) {
      this.resetError();
      return;
    }

    this.errorRetryCount++;
    this.setState({ isRetrying: true });

    // Add retry delay to prevent rapid retries
    this.retryTimeout = setTimeout(() => {
      this.setState({ isRetrying: false });
    }, 1000 * this.errorRetryCount);
  };

  resetError = (): void => {
    this.errorRetryCount = 0;
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      isRetrying: false,
    });
  };

  componentWillUnmount(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return (
          <this.props.fallback
            error={this.state.error!}
            retry={this.handleRetry}
            resetError={this.resetError}
          />
        );
      }

      return this.renderFallbackUI();
    }

    return this.props.children;
  }

  private renderFallbackUI = (): ReactNode => {
    const { showDetails = __DEV__ } = this.props;

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons
              name="alert-circle"
              size={48}
              color={colors.error}
              style={styles.icon}
            />
            <Text style={[styles.title, { color: colors.error }]}>
              Oops! Something went wrong
            </Text>
            <Text style={[styles.subtitle, { color: colors.grey2 }]}>
              We're sorry, but an unexpected error has occurred.
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={this.handleRetry}
              disabled={this.state.isRetrying}
            >
              <Ionicons
                name="refresh"
                size={16}
                color="white"
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>
                {this.state.isRetrying ? 'Retrying...' : 'Try Again'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.resetButton, { backgroundColor: colors.grey3 }]}
              onPress={this.resetError}
            >
              <Ionicons
                name="home"
                size={16}
                color={colors.grey1}
                style={styles.buttonIcon}
              />
              <Text style={[styles.buttonText, { color: colors.grey1 }]}>
                Go Home
              </Text>
            </TouchableOpacity>
          </View>

          {showDetails && this.state.error && (
            <View style={styles.details}>
              <TouchableOpacity
                style={styles.detailsToggle}
                onPress={() => {
                  console.log('Error details:', this.state.error);
                }}
              >
                <Text style={[styles.detailsText, { color: colors.primary }]}>
                  Show Details
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.primary} />
              </TouchableOpacity>

              {__DEV__ && (
                <ScrollView style={styles.errorDetails}>
                  <Text style={[styles.errorCode, { color: colors.error }]}>
                    Error: {this.state.error.message}
                  </Text>
                  {this.state.error.details && (
                    <Text style={[styles.errorInfo, { color: colors.grey2 }]}>
                      Details: {JSON.stringify(this.state.error.details, null, 2)}
                    </Text>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <Text style={[styles.stackTrace, { color: colors.grey2 }]}>
                      Stack Trace:
{this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </ScrollView>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };
}

// Error Fallback Component
export const ErrorFallback: React.FC<{
  error: AppError;
  retry: () => void;
  resetError: () => void;
}> = ({ error, retry, resetError }) => {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons
            name="alert-circle"
            size={48}
            color={colors.error}
            style={styles.icon}
          />
          <Text style={[styles.title, { color: colors.error }]}>
            {error.isCritical() ? 'Critical Error' : 'Something Went Wrong'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.grey2 }]}>
            {error.isCritical()
              ? 'A critical error has occurred. Please try again later.'
              : 'We encountered an issue. Please try again.'}
          </Text>
        </View>

        <View style={styles.actions}>
          {!error.isCritical() && (
            <TouchableOpacity
              style={[styles.button, styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={retry}
            >
              <Ionicons
                name="refresh"
                size={16}
                color="white"
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.resetButton, { backgroundColor: colors.grey3 }]}
            onPress={resetError}
          >
            <Ionicons
              name="home"
              size={16}
              color={colors.grey1}
              style={styles.buttonIcon}
            />
            <Text style={[styles.buttonText, { color: colors.grey1 }]}>
              Back to Home
            </Text>
          </TouchableOpacity>
        </View>

        {error.category === 'auth' && (
          <View style={styles.authMessage}>
            <Text style={[styles.authText, { color: colors.warning }]}>
              This appears to be an authentication issue. Please try signing out and back in.
            </Text>
          </View>
        )}

        {error.category === 'network' && (
          <View style={styles.networkMessage}>
            <Text style={[styles.networkText, { color: colors.warning }]}>
              Check your internet connection and try again.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Hook for error boundary in functional components
export function useErrorHandler() {
  return {
    error: React.useState<Error | null>(null),
    resetError: () => {
      // Reset error state
    },
  };
}

// Higher-order component for error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Partial<ErrorBoundaryProps>
): React.FC<P> {
  return (props: P) => (
    <ErrorBoundaryComponent {...options}>
      <Component {...props} />
    </ErrorBoundaryComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    maxWidth: Dimensions.get('window').width - 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  retryButton: {
    backgroundColor: '#007AFF',
  },
  resetButton: {
    backgroundColor: '#8E8E93',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  details: {
    width: '100%',
    marginTop: 16,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorDetails: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F2F2F7',
  },
  errorCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  errorInfo: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  stackTrace: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  authMessage: {
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF9C4',
    borderRadius: 8,
  },
  authText: {
    fontSize: 14,
    textAlign: 'center',
  },
  networkMessage: {
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  networkText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

// Default error boundary component
export const DefaultErrorBoundary: React.FC<ErrorBoundaryProps> = (props) => (
  <ErrorBoundaryComponent {...props} />
);

export default DefaultErrorBoundary;
