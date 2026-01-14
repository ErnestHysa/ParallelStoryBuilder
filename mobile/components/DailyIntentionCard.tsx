import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { theme } from '@/lib/theme';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';

interface DailyIntention {
  id: string;
  intention: string;
  partner_intention: string | null;
  streak_count: number;
  completed_at: string | null;
  created_at: string;
}

interface DailyIntentionCardProps {
  intention: DailyIntention;
  onComplete: () => void;
  isComplete: boolean;
}

export function DailyIntentionCard({ intention, onComplete, isComplete }: DailyIntentionCardProps) {
  const handleComplete = () => {
    if (!isComplete) {
      onComplete();
    }
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

  return (
    <Card style={styles.card}>
      <View>
        <View style={styles.header}>
          <View style={styles.streakContainer}>
            <View style={[
              styles.streakIndicator,
              { backgroundColor: getStreakColor(intention.streak_count) }
            ]}>
              <MaterialIcons name="local-fire-department" size={20} color="#fff" />
            </View>
            <View style={styles.streakInfo}>
              <Text style={styles.streakCount}>{intention.streak_count}</Text>
              <Text style={styles.streakLabel}>{getStreakLabel(intention.streak_count)}</Text>
            </View>
          </View>

          <Text style={styles.date}>
            {intention.created_at ? formatDate(intention.created_at) : 'Today'}
          </Text>
        </View>

        <View style={styles.intentionSection}>
          <View style={styles.intentionHeader}>
            <AntDesign name="heart" size={16} color={theme.colors.primary} />
            <Text style={styles.intentionLabel}>My Intention</Text>
          </View>
          <Text style={styles.intentionText}>{intention.intention}</Text>
        </View>

        {!isComplete && (
          <TouchableOpacity
            style={[styles.completeButton, styles.completeButtonEmpty]}
            onPress={handleComplete}
          >
            <Text style={styles.completeButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        )}

        {isComplete && (
          <TouchableOpacity
            style={[styles.completeButton, styles.completeButtonFilled]}
            onPress={handleComplete}
          >
            <MaterialIcons name="check" size={16} color="#fff" />
            <Text style={styles.completeButtonText}>Completed!</Text>
          </TouchableOpacity>
        )}

        {intention.partner_intention && (
          <View style={styles.partnerSection}>
            <View style={styles.partnerHeader}>
              <AntDesign name="heart" size={16} color="#2196F3" />
              <Text style={styles.partnerLabel}>Partner's Intention</Text>
            </View>
            <Text style={styles.partnerText}>{intention.partner_intention}</Text>
          </View>
        )}

        {!intention.partner_intention && !isComplete && (
          <View style={styles.waitingSection}>
            <MaterialIcons name="hourglass-bottom" size={20} color="#FF9800" />
            <Text style={styles.waitingText}>
              Waiting for partner's intention...
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 0,
  },
  header: {
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
  intentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  intentionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  intentionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  completeButtonEmpty: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  completeButtonFilled: {
    backgroundColor: theme.colors.primary,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  partnerSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  partnerHeader: {
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
  waitingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#FFF9C4',
    borderRadius: 8,
    marginTop: 8,
  },
  waitingText: {
    fontSize: 14,
    color: '#F57C00',
    flex: 1,
  },
});