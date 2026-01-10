import React, { useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  Text,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';

const COLORS = {
  text: '#212121',
  textSecondary: '#757575',
  error: '#F44336',
};

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const signUp = useAuthStore((state) => state.signUp);

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!displayName) {
      newErrors.displayName = 'Display name is required';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await signUp(email, password, displayName);
      router.replace('/(app)');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setErrors({ general: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start your collaborative storytelling journey</Text>

        <Card variant="elevated" style={styles.card}>
          <Input
            label="Display Name"
            placeholder="Enter your display name"
            value={displayName}
            onChangeText={setDisplayName}
            error={errors.displayName}
            autoComplete="name"
          />

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={styles.inputSpacing}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry
            autoComplete="password-new"
            style={styles.inputSpacing}
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
            secureTextEntry
            autoComplete="password-new"
            style={styles.inputSpacing}
          />

          {errors.general && (
            <Text style={styles.errorText}>{errors.general}</Text>
          )}

          <Button
            onPress={handleRegister}
            isLoading={isLoading}
            accessibilityLabel="Create account"
            accessibilityHint="Creates a new account and signs you in"
            style={styles.buttonSpacing}
          >
            Create Account
          </Button>

          <Button
            variant="ghost"
            onPress={() => router.push('/(auth)/login')}
            accessibilityLabel="Go to login"
            accessibilityHint="Navigate to login screen"
          >
            Already have an account?
          </Button>
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
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    padding: 16,
  },
  inputSpacing: {
    marginTop: 12,
  },
  buttonSpacing: {
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginTop: 12,
    marginBottom: 8,
  },
});
