/**
 * Referral Redeem Screen
 *
 * Allows users to redeem a referral code from a friend.
 * Both parties earn bonus sparks when the code is successfully redeemed.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useTokenStore } from '@/stores/tokenStore';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/theme';

const REFERRAL_BONUS = 50;

export default function RedeemReferralScreen() {
  const { user } = useAuthStore();
  const { addTokens } = useTokenStore();

  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const validateCode = (code: string): boolean => {
    // Code should be 8 characters, alphanumeric
    return /^[A-Z0-9]{8}$/i.test(code.trim().toUpperCase());
  };

  const handleRedeem = async () => {
    const trimmedCode = referralCode.trim().toUpperCase();

    if (!user?.id) {
      setError('You must be logged in to redeem a referral code');
      return;
    }

    if (!trimmedCode) {
      setError('Please enter a referral code');
      return;
    }

    if (!validateCode(trimmedCode)) {
      setError('Invalid referral code format');
      return;
    }

    // Check if user is trying to use their own code
    const { data: ownProfile } = await (supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single() as any);

    if ((ownProfile as any)?.referral_code === trimmedCode) {
      setError('You cannot use your own referral code');
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      // Find the referrer by code
      const { data: referrer, error: referrerError } = await (supabase
        .from('profiles')
        .select('id, display_name, referral_count')
        .eq('referral_code', trimmedCode)
        .single() as any);

      if (referrerError || !referrer) {
        setError('Referral code not found');
        setLoading(false);
        return;
      }

      // Check if user has already used a referral code
      const { data: existingReferral } = await (supabase
        .from('referrals')
        .select('*')
        .eq('referred_user_id', user.id)
        .single() as any);

      if (existingReferral) {
        setError('You have already used a referral code');
        setLoading(false);
        return;
      }

      // Check if this specific referral already exists
      const { data: duplicateReferral } = await (supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', referrer.id)
        .eq('referred_user_id', user.id)
        .single() as any);

      if (duplicateReferral) {
        setError('This referral has already been processed');
        setLoading(false);
        return;
      }

      // Create referral record
      const { error: insertError } = await (supabase.from('referrals') as any).insert({
        referrer_id: referrer.id,
        referred_user_id: user.id,
        referral_code: trimmedCode,
        status: 'completed',
        completed_at: new Date().toISOString(),
        reward_amount: REFERRAL_BONUS,
      });

      if (insertError) {
        setError('Failed to process referral. Please try again.');
        setLoading(false);
        return;
      }

      // Award sparks to the new user
      await addTokens(REFERRAL_BONUS, 'bonus', 'referral');

      // Award sparks to the referrer (this happens server-side in production)
      const { error: updateError } = await (supabase.rpc as any)(
        'award_referral_bonus',
        {
          referrer_id: referrer.id,
          bonus_amount: REFERRAL_BONUS,
        }
      );

      if (updateError) {
        console.error('Failed to award referrer bonus:', updateError);
      }

      // Show success alert
      Alert.alert(
        'Referral Redeemed!',
        `You earned ${REFERRAL_BONUS} sparks! Thank you for joining.`,
        [
          {
            text: 'Awesome!',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err) {
      console.error('Failed to redeem referral:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Redeem Referral Code</Text>
        <View style={styles.backButton} /> {/* Spacer for center alignment */}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <MaterialIcons name="card-giftcard" size={64} color={COLORS.primary} />
        </View>

        <Text style={styles.heading}>Have a referral code?</Text>
        <Text style={styles.description}>
          Enter a code from a friend to earn {REFERRAL_BONUS} bonus sparks. They'll earn sparks
          too!
        </Text>

        {/* Input */}
        <View style={styles.inputContainer}>
          <Input
            placeholder="ENTER CODE"
            value={referralCode}
            onChangeText={setReferralCode}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            inputStyle={styles.input}
            error={error}
          />
          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Referral codes are 8 characters long and can only be used once per account.
          </Text>
        </View>

        {/* Redeem Button */}
        <Button
          onPress={handleRedeem}
          isLoading={loading}
          disabled={!referralCode || loading}
          style={styles.redeemButton}
        >
          Redeem Code
        </Button>

        {/* Bonus Info */}
        <View style={styles.bonusContainer}>
          <Text style={styles.bonusAmount}>+{REFERRAL_BONUS}</Text>
          <Text style={styles.bonusLabel}>Sparks Bonus</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'center',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginLeft: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
  redeemButton: {
    width: '100%',
    minHeight: 52,
  },
  bonusContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  bonusAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bonusLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
