import React, { useState, useEffect } from 'react';
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
    checkEmailConfirmation,
    resendVerificationEmail,
    signOut
  } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [checkCount, setCheckCount] = useState(0);

  // Auto-check email confirmation every 5 seconds, max 12 times (1 minute)
  useEffect(() => {
    if (checkCount < 12) {
      const interval = setInterval(async () => {
        const isConfirmed = await checkEmailConfirmation();
        if (isConfirmed) {
          Alert.alert('Email Confirmed!', 'Redirecting to onboarding...', [
            { text: 'OK', onPress: () => router.replace('/blueprint') }
          ]);
        }
        setCheckCount(prev => prev + 1);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [checkCount, checkEmailConfirmation]);

  const handleResendEmail = async () => {
    if (!user) return;

    setIsResending(true);
    try {
      await resendVerificationEmail();
      Alert.alert(
        'Email Sent',
        'We\'ve sent another verification email to your inbox.',
      );
      setCheckCount(0); // Reset check counter to allow more auto-checks
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
      const isConfirmed = await checkEmailConfirmation();
      if (isConfirmed) {
        Alert.alert('Email Confirmed!', 'Redirecting to onboarding...', [
          { text: 'OK', onPress: () => router.replace('/blueprint') }
        ]);
      } else {
        Alert.alert('Not Confirmed Yet', 'Please check your email and click the confirmation link.');
        setCheckCount(prev => prev + 1);
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
      router.replace('/(auth)/login');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      Alert.alert('Error', errorMessage);
    }
  };

  if (loading && !user) {
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
              {user?.email || 'your email'}
            </Text>
          </Card>
        </View>

        <Card style={styles.messageCard}>
          <Text style={styles.messageTitle}>Before You Start</Text>
          <Text style={styles.messageText}>
            You must verify your email to continue. This prevents account creation under wrong users.
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>
                Keeps your account secure
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>
                Ensures stories belong to the right person
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>
                Required for onboarding
              </Text>
            </View>
          </View>
        </Card>

        {/* Auto-check indicator */}
        {checkCount < 12 && (
          <Card variant="outlined" style={styles.autoCheckCard}>
            <View style={styles.autoCheckContent}>
              <ActivityIndicator size="small" color="#E91E63" />
              <Text style={styles.autoCheckText}>
                Checking for confirmation... ({checkCount}/12)
              </Text>
            </View>
          </Card>
        )}

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
            <Text style={styles.signOutText}>Back to Sign In</Text>
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
    marginBottom: 16,
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
  autoCheckCard: {
    marginBottom: 16,
    padding: 16,
  },
  autoCheckContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  autoCheckText: {
    fontSize: 14,
    color: '#757575',
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