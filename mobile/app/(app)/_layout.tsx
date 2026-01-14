import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { networkListener } from '@/lib/networkListener';
import { OfflineBanner } from '@/components/OfflineBanner';
import { DefaultErrorBoundary } from '@/components/ErrorBoundary';
import { useOfflineStore } from '@/stores/offlineStore';
import i18n from '@/lib/i18n';
import { useAuthStore } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';
import { Button } from '@/components/Button';

// Initialize i18n on app start
i18n.init();

// Start network listener on app start
networkListener.startListening();

export default function AppLayout() {
  const { isConnected } = useOfflineStore();
  const { isConfigured } = useAuthStore();
  const [showBiometricLock, setShowBiometricLock] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Biometric lock functionality
  useEffect(() => {
    const checkBiometricLock = async () => {
      if (isConfigured && !isConnected) {
        setShowBiometricLock(true);
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    };

    checkBiometricLock();
  }, [isConfigured, isConnected]);

  const handleUnlock = () => {
    // In a real app, this would use biometric authentication
    // For demo purposes, we'll just unlock after a delay
    setTimeout(() => {
      setIsLocked(false);
      setShowBiometricLock(false);
    }, 1000);
  };

  const handleLockApp = () => {
    Alert.alert(
      'Lock App',
      'Lock the app for security?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Lock',
          onPress: () => {
            setIsLocked(true);
            setShowBiometricLock(true);
          },
        },
      ]
    );
  };

  if (isLocked) {
    return (
      <View style={styles.lockScreen}>
        <View style={styles.lockContent}>
          <View style={styles.lockIcon}>
            <Text style={styles.lockText}>🔒</Text>
          </View>
          <Text style={styles.lockTitle}>App Locked</Text>
          <Text style={styles.lockSubtitle}>
            {isConnected ? 'App is offline for security' : 'Network connection required'}
          </Text>
          <Button
            onPress={handleUnlock}
            style={styles.unlockButton}
          >
            {isConnected ? 'Unlock' : 'Retry Connection'}
          </Button>
        </View>
      </View>
    );
  }

  return (
    <DefaultErrorBoundary>
      <View style={styles.container}>
        <OfflineBanner />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#E91E63',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: '600',
            },
            headerBackTitle: 'Back',
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: 'My Stories',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="create-story"
            options={{
              title: 'Create Story',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="join-story"
            options={{
              title: 'Join Story',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="story/[id]"
            options={{
              title: 'Story',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="write/[id]"
            options={{
              title: 'Write Chapter',
              headerShown: false,
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="inspirations/[id]"
            options={{
              title: 'Inspirations',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="achievements"
            options={{
              title: 'Achievements',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="wallet"
            options={{
              title: 'Wallet',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: 'Settings',
              headerShown: false,
              // Add lock button in settings header
              headerRight: () => (
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={handleLockApp}
                  style={styles.lockButton}
                >
                  🔒
                </Button>
              ),
            }}
          />
          <Stack.Screen
            name="relationship/[id]"
            options={{
              title: 'Relationship',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="relationship/[id]/questions"
            options={{
              title: 'Questions',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="relationship/[id]/milestones"
            options={{
              title: 'Milestones',
              headerShown: false,
            }}
          />
        </Stack>
      </View>
    </DefaultErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  lockScreen: {
    flex: 1,
    backgroundColor: '#212121',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#424242',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  lockText: {
    fontSize: 48,
  },
  lockTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  lockSubtitle: {
    fontSize: 16,
    color: '#BDBDBD',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  unlockButton: {
    minWidth: 200,
  },
  lockButton: {
    marginRight: 16,
  },
});
