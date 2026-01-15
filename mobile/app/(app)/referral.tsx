/**
 * Referral Screen
 *
 * Allows users to invite other couples and earn sparks for successful referrals.
 * Both the referrer and the new couple receive bonus sparks when the referral
 * is completed.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useTokenStore } from '@/stores/tokenStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/theme';

// ============================================================================
// Constants
// ============================================================================

const REFERRAL_BONUS = 50; // Sparks for both referrer and referee
const REFERRAL_BONUS_MAX = 500; // Max sparks from referrals

const REFERRAL_MESSAGE = `Join me on Parallel Story Builder - the app for long-distance couples to write stories together!\n\nUse my referral code to get ${REFERRAL_BONUS} free sparks!`;

// ============================================================================
// Types
// ============================================================================

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalEarned: number;
  referralCode: string | null;
}

// ============================================================================
// Component
// ============================================================================

export default function ReferralScreen() {
  const { user } = useAuthStore();
  const { balance, addTokens } = useTokenStore();

  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    totalEarned: 0,
    referralCode: null,
  });
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    loadReferralStats();
  }, [user]);

  const loadReferralStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get or generate referral code
      let { data: profile } = await supabase
        .from('profiles')
        .select('referral_code, referred_by')
        .eq('id', user.id)
        .single();

      let referralCode = (profile as any)?.referral_code;

      // Generate code if doesn't exist
      if (!referralCode) {
        referralCode = await generateReferralCode();
      }

      // Get referral stats
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id);

      if (!error && referrals) {
        const completed = referrals.filter((r: any) => r.status === 'completed').length;
        const pending = referrals.filter((r: any) => r.status === 'pending').length;

        setStats({
          totalReferrals: referrals.length,
          pendingReferrals: pending,
          completedReferrals: completed,
          totalEarned: completed * REFERRAL_BONUS,
          referralCode,
        });
      } else {
        setStats({
          totalReferrals: 0,
          pendingReferrals: 0,
          completedReferrals: 0,
          totalEarned: 0,
          referralCode,
        });
      }
    } catch (error) {
      console.error('Failed to load referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async (): Promise<string> => {
    setGeneratingCode(true);
    try {
      if (!user?.id) throw new Error('User not authenticated');

      // Generate a unique 8-character code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();

      const { error } = await ((supabase as any)
        .from('profiles')
        .update({ referral_code: code })
        .eq('id', user.id));

      if (error) throw error;

      return code;
    } catch (error) {
      console.error('Failed to generate referral code:', error);
      return '';
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleShareReferral = async () => {
    if (!stats.referralCode) return;

    setSharing(true);
    try {
      const referralLink = `https://parallelstorybuilder.app/join?ref=${stats.referralCode}`;

      await Share.share({
        message: `${REFERRAL_MESSAGE}\n\nReferral Code: ${stats.referralCode}\n\nLink: ${referralLink}`,
        url: referralLink,
      });

      // Track referral share
      await (supabase.from('analytics_events') as any).insert({
        user_id: user?.id,
        event_name: 'referral_shared',
        event_properties: {
          referral_code: stats.referralCode,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to share referral:', error);
    } finally {
      setSharing(false);
    }
  };

  const handleCopyCode = async () => {
    if (!stats.referralCode) return;

    try {
      await Share.share({
        message: `My Parallel Story Builder referral code: ${stats.referralCode}`,
      });
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleApplyReferralCode = async () => {
    // This would open a dialog to enter a referral code
    router.push('/referral/redeem');
  };

  const shareOptions = [
    {
      id: 'partner',
      icon: 'favorite' as const,
      title: 'Invite a Partner',
      description: 'Send an invitation to your partner to join your story',
      color: '#E91E63',
      action: () => router.push('/invite-partner' as any),
    },
    {
      id: 'couple',
      icon: 'people' as const,
      title: 'Refer Another Couple',
      description: `Earn ${REFERRAL_BONUS} sparks when they sign up`,
      color: '#9C27B0',
      action: handleShareReferral,
    },
    {
      id: 'social',
      icon: 'share' as const,
      title: 'Share on Social Media',
      description: 'Spread the word on your favorite platforms',
      color: '#FFC107',
      action: handleShareReferral,
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Invite & Earn Sparks</Text>
        <Text style={styles.subtitle}>
          Share the love and earn sparks for every couple that joins
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Referral Code Card */}
        <Card variant="elevated" style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          {generatingCode ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <TouchableOpacity style={styles.codeContainer} onPress={handleCopyCode}>
              <Text style={styles.codeText}>{stats.referralCode || 'Generate Code'}</Text>
              <MaterialIcons name="content-copy" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          <Text style={styles.codeHint}>
            Share this code with friends or use your unique link below
          </Text>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <MaterialIcons name="people-outline" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{stats.completedReferrals}</Text>
            <Text style={styles.statLabel}>Successful</Text>
          </Card>
          <Card style={styles.statCard}>
            <MaterialIcons name="pending" size={24} color={COLORS.warning} />
            <Text style={styles.statValue}>{stats.pendingReferrals}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Card>
          <Card style={styles.statCard}>
            <MaterialIcons name="local-fire-department" size={24} color={COLORS.accent} />
            <Text style={styles.statValue}>{stats.totalEarned}</Text>
            <Text style={styles.statLabel}>Sparks Earned</Text>
          </Card>
        </View>

        {/* Reward Info */}
        <Card variant="outlined" style={styles.rewardCard}>
          <View style={styles.rewardHeader}>
            <MaterialIcons name="card-giftcard" size={24} color={COLORS.primary} />
            <Text style={styles.rewardTitle}>Reward Structure</Text>
          </View>
          <View style={styles.rewardList}>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardAmount}>+{REFERRAL_BONUS} Sparks</Text>
              <Text style={styles.rewardDescription}>For you when a couple signs up with your code</Text>
            </View>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardAmount}>+{REFERRAL_BONUS} Sparks</Text>
              <Text style={styles.rewardDescription}>For the new couple as a welcome bonus</Text>
            </View>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardAmount}>Max {REFERRAL_BONUS_MAX} Sparks</Text>
              <Text style={styles.rewardDescription}>Total you can earn from referrals</Text>
            </View>
          </View>
        </Card>

        {/* Share Options */}
        <Text style={styles.sectionTitle}>Share Options</Text>
        {shareOptions.map((option) => (
          <Card
            key={option.id}
            variant="outlined"
            style={styles.shareOption}
            onPress={option.action}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: option.color + '20' }]}>
              <MaterialIcons name={option.icon} size={24} color={option.color} />
            </View>
            <View style={styles.shareContent}>
              <Text style={styles.shareTitle}>{option.title}</Text>
              <Text style={styles.shareDescription}>{option.description}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
          </Card>
        ))}

        {/* Redeem Code Section */}
        <Card variant="outlined" style={styles.redeemCard}>
          <Text style={styles.redeemTitle}>Have a referral code?</Text>
          <Text style={styles.redeemDescription}>
            Enter a code from a friend to earn your bonus sparks
          </Text>
          <Button
            variant="ghost"
            onPress={handleApplyReferralCode}
            style={styles.redeemButton}
          >
            Redeem Code
          </Button>
        </Card>

        {/* Referral History */}
        {stats.totalReferrals > 0 && (
          <>
            <Text style={styles.sectionTitle}>Referral History</Text>
            <Card variant="outlined" style={styles.historyCard}>
              <Text style={styles.historyText}>
                You've referred {stats.totalReferrals} couple{stats.totalReferrals !== 1 ? 's' : ''}
              </Text>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  codeCard: {
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 4,
    marginRight: 12,
  },
  codeHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  rewardCard: {
    padding: 20,
    marginBottom: 20,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 12,
  },
  rewardList: {
    gap: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    width: 120,
  },
  rewardDescription: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  shareIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  shareContent: {
    flex: 1,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  shareDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  redeemCard: {
    padding: 20,
    marginTop: 12,
    alignItems: 'center',
  },
  redeemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  redeemDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  redeemButton: {
    width: '100%',
  },
  historyCard: {
    padding: 16,
    alignItems: 'center',
  },
  historyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
