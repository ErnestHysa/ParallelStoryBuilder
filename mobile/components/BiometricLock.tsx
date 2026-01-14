import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { biometricAuthService, promptForBiometricAuth } from '../lib/biometricAuth';
// import { securityManager } from '../lib/security'; // Commented out - may not exist
import * as LocalAuthentication from 'expo-local-authentication';
import { useFocusEffect } from '@react-navigation/native';

interface BiometricLockProps {
  onUnlock: () => void;
  enabled?: boolean;
  fallbackToPin?: boolean;
  title?: string;
  subtitle?: string;
  maxAttempts?: number;
}

const BiometricLock: React.FC<BiometricLockProps> = ({
  onUnlock,
  enabled = true,
  fallbackToPin = true,
  title = 'Unlock with Biometrics',
  subtitle = 'Use your fingerprint, face, or PIN to access',
  maxAttempts
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [biometricType, setBiometricType] = useState<string | undefined>();
  const [isAvailable, setIsAvailable] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(maxAttempts || 3);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Check biometric availability on mount
  useFocusEffect(
    useCallback(() => {
      checkBiometricAvailability();
    }, [])
  );

  const checkBiometricAvailability = async () => {
    try {
      const available = await biometricAuthService.isAvailable();
      const type = biometricAuthService.getBiometricType();

      setIsAvailable(available);
      setBiometricType(type);

      if (maxAttempts) {
        setRemainingAttempts(maxAttempts);
      }
    } catch (error) {
      console.error('Failed to check biometric availability:', error);
      setIsAvailable(false);
    }
  };

  const handleBiometricAuth = async () => {
    if (!enabled || isLockedOut) return;

    setIsLoading(true);

    try {
      const result = await promptForBiometricAuth(
        'Authenticate to access Parallel Story Builder',
        {
          fallbackToPin,
          maxAttempts: remainingAttempts
        }
      );

      if (result.success) {
        // Authentication successful
        // await securityManager?.recordSuccess?.('biometric_auth') ?? Promise.resolve();
        onUnlock();
      } else {
        // Authentication failed
        const newRemainingAttempts = remainingAttempts - 1;
        setRemainingAttempts(newRemainingAttempts);

        // await securityManager?.recordFailedAttempt?.('biometric_auth') ?? Promise.resolve();

        if (result.requiresFallback) {
          // Show fallback option
          Alert.alert(
            'Authentication Failed',
            'Would you like to use your PIN instead?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Use PIN', onPress: handleFallback }
            ]
          );
        } else if (newRemainingAttempts <= 0) {
          // Account locked out
          handleLockout();
        } else {
          // Show error message
          Alert.alert(
            'Authentication Failed',
            `${result.error}\n\nAttempts remaining: ${newRemainingAttempts}`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      Alert.alert('Error', 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFallback = () => {
    // In a real implementation, this would open a PIN entry screen
    Alert.alert(
      'PIN Entry',
      'Please enter your PIN to continue',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Enter PIN', onPress: () => console.log('PIN entry not implemented') }
      ]
    );
  };

  const handleLockout = useCallback(() => {
    setIsLockedOut(true);

    // Calculate lockout time
    const lockoutDuration = 5 * 60 * 1000; // 5 minutes
    const endTime = Date.now() + lockoutDuration;
    setLockoutTime(endTime);

    Alert.alert(
      'Account Locked',
      'Too many failed attempts. Please try again later.',
      [{ text: 'OK' }]
    );

    // Set up countdown
    const interval = setInterval(() => {
      const remaining = endTime - Date.now();
      if (remaining <= 0) {
        clearInterval(interval);
        setIsLockedOut(false);
        setRemainingAttempts(maxAttempts || 3);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [maxAttempts]);

  // Format time for display
  const formatTime = (milliseconds: number): string => {
    const seconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return remainingSeconds.toString();
  };

  // Get biometric icon
  const getBiometricIcon = () => {
    if (!biometricType) return '🔒';

    switch (biometricType.toLowerCase()) {
      case 'fingerprint':
        return '👆';
      case 'face':
        return '👤';
      case 'iris':
        return '👁️';
      default:
        return '🔐';
    }
  };

  // Get biometric text
  const getBiometricText = () => {
    if (!biometricType) return 'Biometric Authentication';

    switch (biometricType.toLowerCase()) {
      case 'fingerprint':
        return 'Use Touch ID';
      case 'face':
        return 'Use Face ID';
      case 'iris':
        return 'Use Iris Scan';
      default:
        return 'Use Biometrics';
    }
  };

  if (!enabled) {
    return (
      <View style={styles.disabledContainer}>
        <Text style={styles.disabledText}>Security disabled</Text>
      </View>
    );
  }

  if (isLockedOut) {
    const timeRemaining = Math.max(0, lockoutTime - Date.now());

    return (
      <View style={[styles.container, styles.lockoutBackground]}>
        <View style={styles.lockoutContainer}>
          <View style={styles.lockoutIcon}>
            <Text style={styles.lockoutIconText}>🔒</Text>
          </View>

          <Text style={styles.lockoutTitle}>Account Locked</Text>
          <Text style={styles.lockoutSubtitle}>
            Too many failed attempts. Try again in:
          </Text>

          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              {formatTime(timeRemaining)}
            </Text>
          </View>

          <Text style={styles.lockoutMessage}>
            Please wait before trying again.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.gradientBackground]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>
            {getBiometricIcon()}
          </Text>
        </View>

        <Text style={styles.title}>
          {title}
        </Text>

        <Text style={styles.subtitle}>
          {subtitle}
        </Text>

        {isAvailable ? (
          <TouchableOpacity
            style={[styles.button, remainingAttempts <= 1 && styles.dangerButton]}
            onPress={handleBiometricAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.buttonText}>{getBiometricText()}</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.notAvailableContainer}>
            <Text style={styles.notAvailableText}>
              Biometric authentication not available
            </Text>
            {fallbackToPin && (
              <TouchableOpacity
                style={styles.fallbackButton}
                onPress={handleFallback}
              >
                <Text style={styles.fallbackButtonText}>Use PIN</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {remainingAttempts < (maxAttempts || 3) && (
          <Text style={styles.attemptsText}>
            Attempts remaining: {remainingAttempts}
          </Text>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Your biometric data is never stored or shared.
          </Text>
          <Text style={styles.infoText}>
            Authentication happens locally on your device.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  gradientBackground: {
    backgroundColor: '#2a5298',
  },
  lockoutBackground: {
    backgroundColor: '#1e3c72',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center'
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30
  },
  iconText: {
    fontSize: 60
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    marginBottom: 20
  },
  dangerButton: {
    backgroundColor: '#ff6b6b'
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2a5298',
    marginRight: 10
  },
  buttonArrow: {
    fontSize: 20,
    color: '#2a5298'
  },
  attemptsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 10
  },
  infoContainer: {
    marginTop: 30,
    alignItems: 'center'
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 5
  },
  notAvailableContainer: {
    alignItems: 'center'
  },
  notAvailableText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20
  },
  fallbackButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20
  },
  fallbackButtonText: {
    fontSize: 16,
    color: 'white'
  },
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  disabledText: {
    fontSize: 18,
    color: 'gray'
  },
  // Lockout styles
  lockoutContainer: {
    alignItems: 'center',
    width: '100%'
  },
  lockoutIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30
  },
  lockoutIconText: {
    fontSize: 50
  },
  lockoutTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10
  },
  lockoutSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
    textAlign: 'center'
  },
  timerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontVariant: ['tabular-nums']
  },
  lockoutMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center'
  }
});

// Named export for BiometricLock component
export { BiometricLock as BiometricLockComponent };
export default BiometricLock;

// Higher-order component for adding biometric protection
export const withBiometricLock = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    enabled?: boolean;
    fallbackToPin?: boolean;
    requireAuth?: boolean;
  } = {}
) => {
  return (props: P) => {
    const [isUnlocked, setIsUnlocked] = useState(!options.requireAuth);
    const [showLockScreen, setShowLockScreen] = useState(options.requireAuth);

    const handleUnlock = () => {
      setIsUnlocked(true);
      setShowLockScreen(false);
    };

    if (showLockScreen && options.enabled !== false) {
      return (
        <BiometricLock
          onUnlock={handleUnlock}
          enabled={options.enabled}
          fallbackToPin={options.fallbackToPin}
        />
      );
    }

    if (isUnlocked) {
      return <WrappedComponent {...props} />;
    }

    return null;
  };
};

// Hook for biometric authentication
export const useBiometricAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const authenticate = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await promptForBiometricAuth('Authenticate to continue');
      if (result.success) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isAuthenticated,
    isLoading,
    authenticate,
    reset: () => setIsAuthenticated(false)
  };
};
