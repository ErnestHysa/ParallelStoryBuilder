import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function VerifyEmailScreen() {
  const {
    user,
    resendVerificationEmail,
    refreshProfile,
    signOut
  } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    if (!user) return;

    setIsResending(true);
    try {
      await resendVerificationEmail();
      Alert.alert(
        'Email Sent',
        'We\'ve sent another verification email to your inbox.',
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send verification email';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckAgain = async () => {
    setLoading(true);
    try {
      await refreshProfile();
      if (user?.email_confirmed_at) {
        router.replace('/');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check verification status';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(app)/join-story');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      Alert.alert('Error', errorMessage);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.emailSentIcon}>
            <Text style={styles.emailSentText}>✉️</Text>
          </View>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification email to:
          </Text>
          <Card variant="outlined" style={styles.emailCard}>
            <Text style={styles.emailText}>
              {user?.email}
            </Text>
          </Card>
        </View>

        <Card style={styles.messageCard}>
          <Text style={styles.messageTitle}>Get Started Faster</Text>
          <Text style={styles.messageText}>
            Verify your email to:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>
                Enable real-time collaboration
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>
                Save your stories securely
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>
                Access all premium features
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            variant="primary"
            onPress={handleCheckAgain}
            isLoading={loading}
            style={styles.actionButton}
          >
            I've Verified My Email
          </Button>

          <Button
            variant="ghost"
            onPress={handleResendEmail}
            isLoading={isResending}
            style={styles.actionButton}
            accessibilityHint="Sends another verification email"
          >
            Resend Email
          </Button>

          <TouchableOpacity
            onPress={handleSignOut}
            style={styles.signOutButton}
            accessibilityLabel="Sign out"
            accessibilityHint="Return to sign in screen"
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Card variant="outlined" style={styles.tipCard}>
          <Text style={styles.tipTitle}>Didn't receive the email?</Text>
          <Text style={styles.tipText}>
            Please check your spam folder. The email might take a few minutes to arrive.
            If you still don't see it, tap "Resend Email" above.
          </Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emailSentIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E91E6310',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emailSentText: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 12,
  },
  emailCard: {
    width: '100%',
    alignItems: 'center',
    padding: 16,
  },
  emailText: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '500',
  },
  messageCard: {
    marginBottom: 24,
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  messageText: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 16,
  },
  bulletList: {
    gap: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E91E63',
    marginTop: 8,
    marginRight: 12,
    minWidth: 8,
  },
  bulletText: {
    fontSize: 16,
    color: '#212121',
    flex: 1,
    lineHeight: 24,
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    width: '100%',
  },
  signOutButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    color: '#757575',
    fontWeight: '500',
  },
  tipCard: {
    marginTop: 24,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
});