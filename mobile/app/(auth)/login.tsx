import React, { useState } from 'react';
import {
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  Switch,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const COLORS = {
  primary: '#E91E63',
  text: '#212121',
  textSecondary: '#757575',
  background: '#FAFAFA',
  error: '#F44336',
  success: '#4CAF50',
  border: '#E0E0E0',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0);
  const [resetEmail, setResetEmail] = useState('');

  const signIn = useAuthStore((state) => state.signIn);
  const initializeDemo = useDemoStore((state) => state.initializeDemo);

  // Check for biometric support on component mount
  React.useEffect(() => {
    const checkBiometricSupport = async () => {
      try {
        // In a real app, this would check for TouchID/FaceID/Android Biometrics
        // For demo purposes, we'll assume biometric support
        setBiometricSupported(true);
      } catch (error) {
        console.log('Biometric not supported:', error);
      }
    };
    checkBiometricSupport();
  }, []);

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would use biometric authentication
      // For demo purposes, we'll simulate a successful login
      // with a demo user
      await signIn('demo@example.com', 'demo123');
      router.replace('/(app)');
    } catch (err) {
      Alert.alert('Error', 'Biometric authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      // Store remember me preference
      if (rememberMe) {
        // In a real app, this would store credentials securely
        console.log('Remember me enabled for:', email);
      }
      router.replace('/(app)');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (forgotPasswordStep === 0) {
      // First step - send reset email
      try {
        // In a real app, this would call a password reset API
        Alert.alert(
          'Check Your Email',
          'We\'ve sent a password reset link to ' + resetEmail,
          [
            {
              text: 'OK',
              onPress: () => setForgotPasswordStep(1),
            },
          ]
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to send reset email');
      }
    } else if (forgotPasswordStep === 1) {
      // Second step - check for new password
      Alert.alert(
        'Reset Complete',
        'Your password has been reset successfully. Please sign in with your new password.',
        [
          {
            text: 'Sign In',
            onPress: () => {
              setForgotPasswordStep(0);
              router.push('/(auth)/login');
            },
          },
        ]
      );
    }
  };

  const handleDemoLogin = () => {
    initializeDemo();
    router.replace('/(app)');
  };

  if (showBiometricPrompt && biometricSupported) {
    return (
      <View style={styles.biometricContainer}>
        <View style={styles.biometricContent}>
          <Text style={styles.biometricTitle}>Use Biometric Login?</Text>
          <Text style={styles.biometricSubtitle}>
            Quick access using your device's biometrics
          </Text>

          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.biometricButtonText}>
                  👤 Use Biometrics
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.biometricCancelButton}
            onPress={() => setShowBiometricPrompt(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (forgotPasswordStep > 0) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {forgotPasswordStep === 0 ? 'Enter your email address' : 'Check your email for instructions'}
          </Text>

          <Card variant="elevated" style={styles.card}>
            {forgotPasswordStep === 0 && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
                <Button
                  onPress={handleForgotPassword}
                  style={styles.buttonSpacing}
                >
                  Send Reset Link
                </Button>
              </>
            )}

            {forgotPasswordStep === 1 && (
              <View style={styles.resetSuccess}>
                <Text style={styles.resetIcon}>📧</Text>
                <Text style={styles.resetTitle}>Email Sent!</Text>
                <Text style={styles.resetText}>
                  We've sent instructions to reset your password to {resetEmail}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setForgotPasswordStep(0)}
            >
              <Text style={styles.linkText}>Back to Login</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue your stories</Text>

        <Card variant="elevated" style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.passwordToggleText}>
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rememberMeContainer}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: '#E0E0E0', true: COLORS.primary + '40' }}
              thumbColor={rememberMe ? COLORS.primary : '#f4f3f4'}
            />
            <Text style={styles.rememberMeText}>Remember me</Text>
          </View>

          <Button
            onPress={handleLogin}
            isLoading={isLoading}
            style={styles.buttonSpacing}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <View style={styles.linksContainer}>
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => {
                setResetEmail(email);
                setForgotPasswordStep(0);
              }}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.createAccountText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <Card variant="outlined" style={styles.card}>
          {biometricSupported && (
            <Button
              variant="secondary"
              onPress={() => setShowBiometricPrompt(true)}
              style={styles.buttonSpacing}
            >
              🔐 Quick Biometric Login
            </Button>
          )}

          <View style={styles.demoContainer}>
            <Text style={styles.demoTitle}>Try Demo Mode</Text>
            <Text style={styles.demoSubtitle}>
              Explore the app without signing in
            </Text>
            <Button
              variant="ghost"
              onPress={handleDemoLogin}
              style={styles.demoButton}
            >
              Start Demo
            </Button>
          </View>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: 4,
  },
  passwordToggleText: {
    fontSize: 20,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rememberMeText: {
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  buttonSpacing: {
    marginTop: 16,
    marginBottom: 16,
  },
  linksContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotPasswordButton: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  createAccountButton: {
    paddingVertical: 8,
  },
  createAccountText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  biometricContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '90%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  biometricTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  biometricSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  biometricButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  biometricButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  biometricCancelButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  resetSuccess: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  resetIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  resetTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  resetText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  demoContainer: {
    alignItems: 'center',
    marginBottom: 16,
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
  linkButton: {
    marginTop: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});
