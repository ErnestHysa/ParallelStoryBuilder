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
  TextInput,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';
import { useTokenStore } from '@/stores/tokenStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useOfflineStore } from '@/stores/offlineStore';
import { useRelationshipStore } from '@/stores/relationshipStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import StreakDisplay from '@/components/StreakDisplay';
import AchievementBadge from '@/components/AchievementBadge';
import { ProgressRing } from '@/components/ProgressRing';
import { Theme } from '@/lib/types';
import { MaterialIcons } from '@expo/vector-icons';

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
  const { dailyIntention, setDailyIntention, completeDailyIntention, fetchDailyIntention, relationshipStats } = useRelationshipStore();
  const [loading, setLoading] = React.useState(true);
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  const [intentionText, setIntentionText] = useState('');
  const [showAchievements, setShowAchievements] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  const userStories = getStories();

  useEffect(() => {
    initialize().finally(() => setLoading(false));
    fetchDailyIntention();

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
  }, [initialize, achievements, pulseAnim, fetchDailyIntention]);

  const handleSetIntention = async () => {
    if (!intentionText.trim()) {
      Alert.alert('Error', 'Please enter an intention');
      return;
    }

    try {
      await setDailyIntention(intentionText);
      setShowIntentionModal(false);
      setIntentionText('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to set intention');
    }
  };

  const handleCompleteIntention = async () => {
    try {
      await completeDailyIntention();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete intention');
    }
  };

  const getStreakCount = (): number => {
    if (typeof streak === 'object' && streak !== null) {
      return streak.current ?? 0;
    }
    return typeof streak === 'number' ? streak : 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStreakColor = (streakCount: number) => {
    if (streakCount >= 30) return '#FF6B6B';
    if (streakCount >= 14) return '#FFA94D';
    if (streakCount >= 7) return '#4CAF50';
    return '#2196F3';
  };

  const getStreakLabel = (streakCount: number) => {
    if (streakCount >= 30) return '🔥 On Fire!';
    if (streakCount >= 14) return '⭐ Amazing!';
    if (streakCount >= 7) return '💪 Keep it up!';
    if (streakCount > 0) return '🌱 Growing';
    return 'Start your streak';
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
      {/* Daily Intention Card */}
      <ScrollView style={styles.topScroll} contentContainerStyle={styles.topScrollContent}>
        {!dailyIntention && (
          <Card variant="elevated" style={styles.checkInCard}>
            <View style={styles.checkInContent}>
              <View style={styles.checkInHeader}>
                <MaterialIcons name="wb-sunny" size={28} color={COLORS.primary} />
                <Text style={styles.checkInTitle}>Daily Intention</Text>
              </View>
              <Text style={styles.checkInSubtitle}>What do you want to create together today?</Text>
              <Button
                onPress={() => setShowIntentionModal(true)}
                disabled={!isOnline}
                style={styles.checkInButton}
              >
                {isOnline ? 'Set Intention' : 'Offline'}
              </Button>
            </View>
          </Card>
        )}

        {dailyIntention && (
          <Card variant="elevated" style={styles.intentionCard}>
            <View style={styles.intentionHeader}>
              <View style={styles.streakContainer}>
                <View style={[
                  styles.streakIndicator,
                  { backgroundColor: getStreakColor(getStreakCount()) }
                ]}>
                  <MaterialIcons name="local-fire-department" size={20} color="#fff" />
                </View>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakCount}>{getStreakCount()}</Text>
                  <Text style={styles.streakLabel}>{getStreakLabel(getStreakCount())}</Text>
                </View>
              </View>
              <Text style={styles.date}>
                {dailyIntention.created_at ? formatDate(dailyIntention.created_at) : 'Today'}
              </Text>
            </View>

            <View style={styles.intentionSection}>
              <View style={styles.intentionLabelContainer}>
                <MaterialIcons name="favorite" size={16} color={COLORS.primary} />
                <Text style={styles.intentionLabel}>My Intention</Text>
              </View>
              <Text style={styles.intentionText}>{dailyIntention.intention}</Text>
            </View>

            {!dailyIntention.completed && (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={handleCompleteIntention}
              >
                <MaterialIcons name="check" size={20} color="#fff" />
                <Text style={styles.completeButtonText}>Mark Complete</Text>
              </TouchableOpacity>
            )}

            {dailyIntention.completed && (
              <View style={styles.completedButton}>
                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.completedButtonText}>Completed!</Text>
              </View>
            )}

            {dailyIntention.partner_intention && (
              <View style={styles.partnerSection}>
                <View style={styles.partnerLabelContainer}>
                  <MaterialIcons name="favorite" size={16} color="#2196F3" />
                  <Text style={styles.partnerLabel}>Partner's Intention</Text>
                </View>
                <Text style={styles.partnerText}>{dailyIntention.partner_intention}</Text>
              </View>
            )}
          </Card>
        )}
      </ScrollView>

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

      {/* Daily Intention Modal */}
      <Modal
        visible={showIntentionModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowIntentionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="wb-sunny" size={28} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Set Your Daily Intention</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              What do you want to create or share with your partner today?
            </Text>
            <TextInput
              style={styles.intentionInput}
              placeholder="e.g., Write a chapter about our first date..."
              placeholderTextColor="#999"
              value={intentionText}
              onChangeText={setIntentionText}
              multiline
              maxLength={200}
            />
            <View style={styles.modalActions}>
              <Button
                variant="ghost"
                onPress={() => {
                  setShowIntentionModal(false);
                  setIntentionText('');
                }}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={handleSetIntention}
                disabled={!intentionText.trim()}
                style={styles.modalButton}
              >
                Set Intention
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
  // Daily Intention Styles
  topScroll: {
    maxHeight: 280,
  },
  topScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  checkInHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  intentionCard: {
    marginBottom: 16,
  },
  intentionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakInfo: {
    gap: 2,
  },
  streakCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  streakLabel: {
    fontSize: 12,
    color: '#666',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  intentionSection: {
    marginBottom: 16,
  },
  intentionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  intentionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  intentionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginTop: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  completedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginTop: 8,
  },
  completedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 8,
  },
  partnerSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  partnerLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  partnerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  partnerText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  intentionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modalButton: {
    flex: 1,
  },
});