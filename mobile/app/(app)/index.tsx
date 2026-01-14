import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';
import { useTokenStore } from '@/stores/tokenStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useOfflineStore } from '@/stores/offlineStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import StreakDisplay from '@/components/StreakDisplay';
import AchievementBadge from '@/components/AchievementBadge';
import { ProgressRing } from '@/components/ProgressRing';
import { Theme } from '@/lib/types';

const THEME_INFO: Record<Theme, { label: string; emoji: string; color: string }> = {
  romance: { label: 'Romance', emoji: '💕', color: '#E91E63' },
  fantasy: { label: 'Fantasy', emoji: '🐉', color: '#9C27B0' },
  our_future: { label: 'Our Future', emoji: '🌟', color: '#2196F3' },
};

const COLORS = {
  primary: '#E91E63',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  background: '#FAFAFA',
  accent: '#9C27B0',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
};

export default function HomeScreen() {
  const { isConfigured, initialize } = useAuthStore();
  const { stories, getStories, deleteStory } = useDemoStore();
  const { balance } = useTokenStore();
  const { streak, achievements } = useGamificationStore();
  const { isConnected: isOnline } = useOfflineStore();
  const [loading, setLoading] = React.useState(true);
  const [dailyCheckIn, setDailyCheckIn] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  const userStories = getStories();

  useEffect(() => {
    initialize().finally(() => setLoading(false));

    // Pulse animation for achievements
    if (achievements.length > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [initialize, achievements, pulseAnim]);

  const handleDailyCheckIn = async () => {
    // Placeholder for daily check-in
    setDailyCheckIn(true);
  };

  const handleDeleteStory = (id: string, title: string) => {
    Alert.alert(
      'Delete Story',
      `Are you sure you want to delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteStory(id),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Daily Check-in Banner */}
      {!dailyCheckIn && (
        <Card variant="elevated" style={styles.checkInCard}>
          <View style={styles.checkInContent}>
            <Text style={styles.checkInTitle}>Daily Check-in</Text>
            <Text style={styles.checkInSubtitle}>Set your writing intention for today!</Text>
            <Button
              onPress={handleDailyCheckIn}
              disabled={!isOnline}
              style={styles.checkInButton}
            >
              {isOnline ? 'Set Intention' : 'Offline'}
            </Button>
          </View>
        </Card>
      )}

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <StreakDisplay streak={typeof streak === 'object' ? streak.current : streak} />
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.tokenContainer}>
            <Text style={styles.tokenIcon}>💎</Text>
            <Text style={styles.tokenAmount}>{balance}</Text>
          </View>
          <Text style={styles.statLabel}>Tokens</Text>
        </View>
        <View style={styles.statCard}>
          <ProgressRing
            size={60}
            progress={userStories.length * 10}
            strokeWidth={8}
            color={COLORS.primary}
            backgroundColor="#E3F2FD"
          />
          <Text style={styles.statLabel}>{userStories.length} Stories</Text>
        </View>
      </View>

      {/* Achievements */}
      {achievements.length > 0 && (
        <Card variant="outlined" style={styles.achievementsContainer}>
          <View style={styles.achievementsHeader}>
            <View style={styles.achievementsTitleContainer}>
              <Text style={styles.sectionTitle}>Achievements</Text>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Text style={styles.achievementCount}>{achievements.length}</Text>
              </Animated.View>
            </View>
            <Button
              variant="ghost"
              onPress={() => setShowAchievements(!showAchievements)}
            >
              {showAchievements ? 'Hide' : 'Show'}
            </Button>
          </View>
          {showAchievements && (
            <View style={styles.achievementsList}>
              {achievements.slice(0, 3).map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  size="small"
                />
              ))}
              {achievements.length > 3 && (
                <View style={styles.moreAchievements}>
                  <Text style={styles.moreAchievementsText}>
                    +{achievements.length - 3} more
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Stories</Text>
          {!isConfigured && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>Demo Mode</Text>
            </View>
          )}
        </View>

        {userStories.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No stories yet</Text>
            <Text style={styles.emptyText}>
              Start your creative journey by creating your first story or joining one with a partner.
            </Text>
          </Card>
        ) : (
          userStories.map((story) => {
            const theme = THEME_INFO[story.theme];
            return (
              <TouchableOpacity
                key={story.id}
                onPress={() => router.push(`/story/${story.id}`)}
                activeOpacity={0.7}
              >
                <Card style={styles.storyCard}>
                  <View style={styles.storyHeader}>
                    <View style={[styles.themeIcon, { backgroundColor: theme.color + '20' }]}>
                      <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                    </View>
                    <View style={styles.storyInfo}>
                      <Text style={styles.storyTitle} numberOfLines={1}>{story.title}</Text>
                      <Text style={styles.storyMeta}>{theme.label} • Code: {story.pairing_code}</Text>
                    </View>
                  </View>
                  <View style={styles.storyFooter}>
                    <Text style={styles.chapterCount}>
                      {story.id === 'demo-story-1' ? '2 chapters' : '1 chapter'}
                    </Text>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteStory(story.id, story.title);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}

        <View style={styles.actions}>
          <Button
            variant="primary"
            onPress={() => router.push('/create-story')}
            style={styles.actionButton}
          >
            Create New Story
          </Button>
          <Button
            variant="ghost"
            onPress={() => router.push('/join-story')}
            style={styles.actionButton}
          >
            Join with Code
          </Button>
        </View>

        {!isConfigured && (
          <Card variant="outlined" style={styles.infoCard}>
            <Text style={styles.infoTitle}>About Demo Mode</Text>
            <Text style={styles.infoText}>
              You're running in demo mode. To use the full app with real-time collaboration, set up Supabase.
            </Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  checkInCard: {
    marginBottom: 16,
  },
  checkInContent: {
    padding: 16,
    alignItems: 'center',
  },
  checkInTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  checkInSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  checkInButton: {
    marginTop: 8,
    width: '100%',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  tokenContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  tokenIcon: {
    fontSize: 24,
  },
  tokenAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  achievementsContainer: {
    marginBottom: 16,
  },
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  achievementsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  achievementCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moreAchievements: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  moreAchievementsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  demoBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  demoBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  storyCard: {
    marginBottom: 12,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  themeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  themeEmoji: {
    fontSize: 24,
  },
  storyInfo: {
    flex: 1,
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  storyMeta: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  storyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  chapterCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  deleteText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '500',
  },
  actions: {
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
  infoCard: {
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
});