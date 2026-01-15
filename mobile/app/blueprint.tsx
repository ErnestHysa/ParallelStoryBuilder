/**
 * Relationship Blueprint Quiz Screen
 *
 * Onboarding quiz that personalizes the app experience
 * Protected - requires email confirmation
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { BlueprintQuiz } from '@/components/BlueprintQuiz';

export default function BlueprintScreen() {
  const { user, isEmailConfirmed, isLoading } = useAuthStore();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !user) {
      router.replace('/(auth)/login');
      return;
    }

    // Redirect to verify email if email is not confirmed
    if (!isLoading && user && !isEmailConfirmed) {
      router.replace('/(auth)/verify-email');
      return;
    }
  }, [user, isEmailConfirmed, isLoading]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  // Don't render if not authenticated or email not confirmed
  if (!user || !isEmailConfirmed) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      <BlueprintQuiz standalone />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
});
