import React, { useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const COLORS = {
  text: '#212121',
  textSecondary: '#757575',
  error: '#F44336',
  primary: '#E91E63',
  success: '#4CAF50',
  background: '#FAFAFA',
};

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const signUp = useAuthStore((state) => state.signUp);
  const initializeDemo = useDemoStore((state) => state.initializeDemo);

  // Check if user is already onboarded
  React.useEffect(() => {
    const checkOnboardingStatus = async () => {
      // This would typically check if user has completed onboarding before
      // For now, we'll skip this step
    };
    checkOnboardingStatus();
  }, []);

  const validateStep1 = () => {
    const newErrors: typeof errors = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (displayName.length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: typeof errors = {};

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

    if (!agreedToTerms) {
      newErrors.general = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else {
      if (validateStep2()) {
        handleRegister();
      }
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      await signUp(email, password, displayName);

      // Show welcome message
      setShowWelcome(true);

      // After a short delay, navigate to home
      setTimeout(() => {
        router.replace('/(app)');
      }, 2000);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setErrors({ general: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoMode = () => {
    initializeDemo();
    router.replace('/(app)');
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Welcome to Parallel Story Builder</Text>
      <Text style={styles.stepSubtitle}>
        Let's get started with your profile
      </Text>

      <Input
        label="Display Name"
        placeholder="How should we call you?"
        value={displayName}
        onChangeText={setDisplayName}
        error={errors.displayName}
        autoComplete="name"
        style={styles.inputSpacing}
      />

      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>✨</Text>
          <Text style={styles.featureText}>Collaborative storytelling</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🤖</Text>
          <Text style={styles.featureText}>AI-powered suggestions</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>💕</Text>
          <Text style={styles.featureText}>Build stories together</Text>
        </View>
      </View>

      {errors.general && (
        <Text style={styles.errorText}>{errors.general}</Text>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Create Your Account</Text>
      <Text style={styles.stepSubtitle}>
        Secure your account and start creating
      </Text>

      <Input
        label="Email"
        placeholder="Enter your email address"
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
        placeholder="Choose a strong password"
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

      <View style={styles.termsContainer}>
        <TouchableOpacity
          style={styles.termsCheckbox}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
        >
          <Text style={styles.termsCheck}>
            {agreedToTerms ? '✓' : ''}
          </Text>
        </TouchableOpacity>
        <Text style={styles.termsText}>
          I agree to the{' '}
          <Text style={styles.termsLink} onPress={() => {}}>
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text style={styles.termsLink} onPress={() => {}}>
            Privacy Policy
          </Text>
        </Text>
      </View>

      {errors.general && (
        <Text style={styles.errorText}>{errors.general}</Text>
      )}
    </View>
  );

  if (showWelcome) {
    return (
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeIcon}>🎉</Text>
          <Text style={styles.welcomeTitle}>Welcome, {displayName}!</Text>
          <Text style={styles.welcomeSubtitle}>
            Your account has been created successfully. Let's start your storytelling journey!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Step {step} of 2
          </Text>
        </View>

        <Card variant="elevated" style={styles.card}>
          {step === 1 ? renderStep1() : renderStep2()}

          <View style={styles.buttonContainer}>
            {step === 2 && (
              <Button
                variant="ghost"
                onPress={handlePreviousStep}
                style={styles.backButton}
              >
                Back
              </Button>
            )}

            <Button
              onPress={handleNextStep}
              isLoading={isLoading}
              disabled={step === 2 && !agreedToTerms}
              style={styles.nextButton}
            >
              {step === 1 ? 'Next' : 'Create Account'}
            </Button>
          </View>
        </Card>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <Card variant="outlined" style={styles.demoCard}>
          <Text style={styles.demoTitle}>Try Demo Mode</Text>
          <Text style={styles.demoSubtitle}>
            Explore the app without creating an account
          </Text>
          <Button
            variant="secondary"
            onPress={handleDemoMode}
            style={styles.demoButton}
          >
            Start Demo
          </Button>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  card: {
    padding: 20,
    marginBottom: 24,
  },
  stepContent: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  inputSpacing: {
    marginTop: 16,
  },
  featureList: {
    marginTop: 24,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: COLORS.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  demoCard: {
    padding: 20,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  demoSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  demoButton: {
    width: '100%',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    marginBottom: 8,
  },
  termsCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  termsCheck: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginTop: 12,
    marginBottom: 8,
  },
  welcomeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  welcomeIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
