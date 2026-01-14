import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
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

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{password?: string; confirmPassword?: string}>({});

  const { resetPassword } = useAuthStore();

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      return false;
    }
    if (password.length < 8) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, password: undefined }));
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string): boolean => {
    if (!confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      return false;
    }
    if (confirmPassword !== password) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return false;
    }
    setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    return true;
  };

  const handleSubmit = async () => {
    let isValid = true;
    if (!validatePassword(password)) isValid = false;
    if (!validateConfirmPassword(confirmPassword)) isValid = false;

    if (!isValid) return;

    setLoading(true);
    try {
      await resetPassword('', password);
      Alert.alert(
        'Password Updated',
        'Your password has been successfully updated.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(app)/join-story'),
          },
        ]
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update password';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; score: number } => {
    if (!password) return { strength: 'weak', score: 0 };

    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    if (score <= 2) return { strength: 'weak', score };
    if (score <= 4) return { strength: 'medium', score };
    return { strength: 'strong', score };
  };

  const passwordStrength = getPasswordStrength(password);

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
          <View style={styles.resetIcon}>
            <Text style={styles.resetText}>🔒</Text>
          </View>
          <Text style={styles.title}>Set New Password</Text>
          <Text style={styles.subtitle}>
            Choose a strong password to protect your account.
          </Text>
        </View>

        <Card style={styles.formCard}>
          <Text style={styles.formLabel}>New Password</Text>
          <TextInput
            style={errors.password ? [styles.input, styles.inputError] : styles.input}
            placeholder="Enter new password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              validatePassword(text);
            }}
            secureTextEntry
            autoComplete="new-password"
            accessibilityLabel="New password"
            accessibilityHint="Enter your new password"
          />
          {password && (
            <View style={styles.passwordStrengthContainer}>
              <View style={[
                styles.passwordStrengthBar,
                {
                  width: `${(passwordStrength.score / 6) * 100}%`,
                  backgroundColor: passwordStrength.strength === 'weak' ? '#F44336' :
                                  passwordStrength.strength === 'medium' ? '#FF9800' : '#4CAF50'
                }
              ]} />
            </View>
          )}
          {passwordStrength.strength !== 'weak' && password && (
            <Text style={[
              styles.passwordStrengthText,
              {
                color: passwordStrength.strength === 'medium' ? '#FF9800' : '#4CAF50'
              }
            ]}>
              Strength: {passwordStrength.strength}
            </Text>
          )}
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.formLabel}>Confirm Password</Text>
          <TextInput
            style={errors.confirmPassword ? [styles.input, styles.inputError] : styles.input}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              validateConfirmPassword(text);
            }}
            secureTextEntry
            autoComplete="new-password"
            accessibilityLabel="Confirm password"
            accessibilityHint="Confirm your new password"
          />
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}
        </Card>

        <View style={styles.actions}>
          <Button
            variant="primary"
            onPress={handleSubmit}
            isLoading={loading}
            style={styles.actionButton}
            accessibilityLabel="Update password"
            disabled={loading || !password || !confirmPassword}
          >
            Update Password
          </Button>

          <Button
            variant="ghost"
            onPress={() => router.replace('/(app)/join-story')}
            style={styles.actionButton}
            accessibilityLabel="Back to sign in"
          >
            Back to Sign In
          </Button>
        </View>

        <Card variant="outlined" style={styles.passwordRules}>
          <Text style={styles.rulesTitle}>Password Requirements</Text>
          <View style={styles.rulesList}>
            <View style={styles.ruleItem}>
              <View style={[
                styles.ruleIcon,
                password.length >= 8 ? styles.ruleIconValid : styles.ruleIconInvalid
              ]}>
                <Text style={styles.ruleIconText}>
                  {password.length >= 8 ? '✓' : '✗'}
                </Text>
              </View>
              <Text style={[
                styles.ruleText,
                password.length >= 8 ? styles.ruleTextValid : styles.ruleTextInvalid
              ]}>
                At least 8 characters
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <View style={[
                styles.ruleIcon,
                /[A-Z]/.test(password) ? styles.ruleIconValid : styles.ruleIconInvalid
              ]}>
                <Text style={styles.ruleIconText}>
                  {/[A-Z]/.test(password) ? '✓' : '✗'}
                </Text>
              </View>
              <Text style={[
                styles.ruleText,
                /[A-Z]/.test(password) ? styles.ruleTextValid : styles.ruleTextInvalid
              ]}>
                Contains uppercase letter
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <View style={[
                styles.ruleIcon,
                /[a-z]/.test(password) ? styles.ruleIconValid : styles.ruleIconInvalid
              ]}>
                <Text style={styles.ruleIconText}>
                  {/[a-z]/.test(password) ? '✓' : '✗'}
                </Text>
              </View>
              <Text style={[
                styles.ruleText,
                /[a-z]/.test(password) ? styles.ruleTextValid : styles.ruleTextInvalid
              ]}>
                Contains lowercase letter
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <View style={[
                styles.ruleIcon,
                /[0-9]/.test(password) ? styles.ruleIconValid : styles.ruleIconInvalid
              ]}>
                <Text style={styles.ruleIconText}>
                  {/[0-9]/.test(password) ? '✓' : '✗'}
                </Text>
              </View>
              <Text style={[
                styles.ruleText,
                /[0-9]/.test(password) ? styles.ruleTextValid : styles.ruleTextInvalid
              ]}>
                Contains number
              </Text>
            </View>
          </View>
        </Card>

        <Card variant="outlined" style={styles.securityCard}>
          <Text style={styles.securityTitle}>Security Tips</Text>
          <Text style={styles.securityText}>
            • Use a unique password you haven't used before
          </Text>
          <Text style={styles.securityText}>
            • Avoid common words or personal information
          </Text>
          <Text style={styles.securityText}>
            • Consider using a password manager
          </Text>
          <Text style={styles.securityText}>
            • Change your password if you suspect it's been compromised
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
  resetIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#9C27B010',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resetText: {
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
    lineHeight: 24,
    marginBottom: 24,
  },
  formCard: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    minHeight: 44,
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 4,
  },
  passwordStrengthContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  passwordStrengthBar: {
    height: '100%',
    backgroundColor: '#F44336',
  },
  passwordStrengthText: {
    fontSize: 14,
    marginTop: 4,
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    width: '100%',
  },
  passwordRules: {
    marginBottom: 16,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  rulesList: {
    gap: 8,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#F5F5F5',
  },
  ruleIconValid: {
    backgroundColor: '#4CAF20',
  },
  ruleIconInvalid: {
    backgroundColor: '#F44336',
  },
  ruleIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ruleText: {
    fontSize: 14,
    color: '#757575',
    flex: 1,
  },
  ruleTextValid: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  ruleTextInvalid: {
    color: '#F44336',
  },
  securityCard: {
    marginTop: 16,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
    marginBottom: 4,
  },
});