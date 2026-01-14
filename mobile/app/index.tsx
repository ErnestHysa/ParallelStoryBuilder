import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

// Safety timeout to prevent infinite loading (5 seconds)
const INIT_TIMEOUT = 5000;

export default function Index() {
  const user = useAuthStore((state) => state.user);
  const isConfigured = useAuthStore((state) => state.isConfigured);
  const initialize = useAuthStore((state) => state.initialize);
  const [isReady, setIsReady] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Always set ready after timeout, even if init hangs
    timeoutRef.current = setTimeout(() => {
      setIsReady(true);
    }, INIT_TIMEOUT);

    // Run initialization
    initialize()
      .then(() => {
        // Clear the timeout since init completed successfully
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setIsReady(true);
      })
      .catch((err) => {
        // Log error but still set ready to prevent hang
        console.error('Init error (continuing anyway):', err);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setIsReady(true);
      });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  if (!isConfigured || user) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
});
