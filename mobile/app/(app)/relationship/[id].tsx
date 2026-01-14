import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useRelationshipStore } from '@/stores/relationshipStore';
import { useStoriesStore } from '@/stores/storiesStore';
import { theme } from '@/lib/theme';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';

export default function RelationshipDashboard() {
  const { id: relationshipId } = useLocalSearchParams();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  const {
    relationship,
    fetchRelationship,
    dailyIntention,
    markIntentionComplete,
    sharedMilestones,
    relationshipQuestions,
    isConnected
  } = useRelationshipStore();

  const { currentStory, fetchStory } = useStoriesStore();

  useEffect(() => {
    if (relationshipId && typeof relationshipId === 'string') {
      fetchRelationship();
    }
  }, [relationshipId, fetchRelationship]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (relationshipId && typeof relationshipId === 'string') {
      await fetchRelationship();
    }
    setRefreshing(false);
  };

  const handleMarkIntentionComplete = async () => {
    if (dailyIntention) {
      await markIntentionComplete();
    }
  };

  const navigateToQuestions = () => {
    router.push(`/relationship/${relationshipId}/questions` as any);
  };

  const navigateToMilestones = () => {
    router.push(`/relationship/${relationshipId}/milestones` as any);
  };

  const navigateToWrite = () => {
    if (relationshipId) {
      router.push(`/write/${relationshipId}`);
    }
  };

  const calculateConnectionScore = () => {
    if (!relationship) return 0;

    let score = 50; // Base score

    // Add points for milestones
    if (sharedMilestones && sharedMilestones.length > 0) {
      score += Math.min(20, sharedMilestones.length * 2);
    }

    // Add points for streak
    if (streakCount > 0) {
      score += Math.min(15, streakCount);
    }

    return Math.min(100, score);
  };

  const connectionScore = calculateConnectionScore();
  const scoreLabel = connectionScore >= 80 ? 'Exceptional' :
                    connectionScore >= 60 ? 'Strong' :
                    connectionScore >= 40 ? 'Growing' : 'Developing';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Relationship Dashboard',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Connection Score */}
        <Card style={styles.card}>
          <View style={styles.scoreContainer}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{connectionScore}</Text>
              <Text style={styles.scoreLabel}>{scoreLabel}</Text>
            </View>
          </View>
        </Card>

        {/* Daily Intention */}
        {dailyIntention && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Daily Intention</Text>
            <Text style={styles.intentionText}>{dailyIntention.intention}</Text>
            {!dailyIntention.completed && (
              <Button
                variant="primary"
                onPress={handleMarkIntentionComplete}
                style={styles.intentionButton}
              >
                Mark Complete
              </Button>
            )}
            {dailyIntention.completed && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>✓ Completed</Text>
              </View>
            )}
          </Card>
        )}

        {/* Writing Streak */}
        <Card style={styles.card}>
          <View style={styles.streakContainer}>
            <View style={styles.streakContent}>
              <MaterialIcons name="auto-graph" size={28} color={theme.colors.primary} />
              <View style={styles.streakInfo}>
                <Text style={styles.streakCount}>{streakCount}</Text>
                <Text style={styles.streakLabel}>Day Streak</Text>
              </View>
            </View>
            <Button
              variant="primary"
              onPress={navigateToWrite}
              style={styles.writeButton}
            >
              Write Today
            </Button>
          </View>
        </Card>

        {/* Shared Milestones */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shared Milestones</Text>
            <Text style={styles.sectionSubtitle}>
              {sharedMilestones?.length || 0} milestones captured
            </Text>
          </View>
          <View style={styles.sectionContent}>
            {sharedMilestones && sharedMilestones.length > 0 ? (
              sharedMilestones.slice(0, 3).map((milestone) => (
                <View key={milestone.id} style={styles.milestonePreview}>
                  <View style={styles.milestoneIcon}>
                    <AntDesign name="star" size={16} color="#FFD700" />
                  </View>
                  <View style={styles.milestoneInfo}>
                    <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                    <Text style={styles.milestoneDate}>
                      {new Date(milestone.date_achieved).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Feather name="map-pin" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.emptyStateText}>
                  No milestones yet. Start creating memories!
                </Text>
                <Button onPress={navigateToMilestones} variant="ghost">
                  Add Milestone
                </Button>
              </View>
            )}
          </View>
          <View style={styles.sectionFooter}>
            <TouchableOpacity onPress={navigateToMilestones} style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All Milestones</Text>
              <AntDesign name="arrowright" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Relationship Insights */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Relationship Insights</Text>
          <View style={styles.insightsGrid}>
            <View style={styles.insightItem}>
              <Text style={styles.insightValue}>{sharedMilestones?.length || 0}</Text>
              <Text style={styles.insightLabel}>Milestones</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightValue}>{relationshipQuestions?.length || 0}</Text>
              <Text style={styles.insightLabel}>Questions</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightValue}>
                {Math.round((connectionScore / 100) * 100)}%
              </Text>
              <Text style={styles.insightLabel}>Connection</Text>
            </View>
          </View>
        </Card>

        {/* Daily Questions */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Questions</Text>
            <Text style={styles.sectionSubtitle}>
              Deepen your connection
            </Text>
          </View>
          <View style={styles.sectionContent}>
            <Button
              onPress={navigateToQuestions}
              variant="primary"
              style={styles.questionsButton}
            >
              Answer Today's Question
            </Button>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  scoreContainer: {
    alignItems: 'center',
    padding: 20,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#757575',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionContent: {
    marginBottom: 12,
  },
  sectionFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  intentionText: {
    fontSize: 16,
    color: '#212121',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  intentionButton: {
    marginTop: 8,
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  completedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streakInfo: {
    gap: 4,
  },
  streakCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  streakLabel: {
    fontSize: 14,
    color: '#666',
  },
  writeButton: {
    minWidth: 120,
  },
  milestonePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  milestoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF9C4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneInfo: {
    flex: 1,
    marginLeft: 12,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  milestoneDate: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#757575',
    marginVertical: 16,
    textAlign: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#E91E63',
    fontWeight: '600',
  },
  insightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  insightItem: {
    alignItems: 'center',
  },
  insightValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E91E63',
  },
  insightLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  questionsButton: {
    marginTop: 8,
  },
});
