import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { ProgressRing } from './ProgressRing';
import { theme } from '@/lib/theme';
import { MaterialIcons } from '@expo/vector-icons';

interface ConnectionScoreProps {
  score: number;
  label: string;
}

export function ConnectionScore({ score, label }: ConnectionScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#2196F3';
    if (score >= 40) return '#FF9800';
    return '#F44336';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return 'sentiment-very-satisfied';
    if (score >= 60) return 'sentiment-satisfied';
    if (score >= 40) return 'sentiment-neutral';
    return 'sentiment-very-dissatisfied';
  };

  const getImprovementTips = (score: number) => {
    if (score >= 80) {
      return [
        'Keep up the great communication!',
        'Continue sharing your thoughts openly',
        'Maintain your regular writing schedule'
      ];
    } else if (score >= 60) {
      return [
        'Try writing more frequently together',
        'Share more about your feelings',
        'Answer daily questions consistently'
      ];
    } else if (score >= 40) {
      return [
        'Schedule regular writing times',
        'Start with small daily intentions',
        'Share more about your day-to-day life'
      ];
    } else {
      return [
        'Focus on consistent communication',
        'Start with simple daily intentions',
        'Try answering relationship questions',
        'Share your thoughts and feelings more'
      ];
    }
  };

  const tips = getImprovementTips(score);
  const scoreColor = getScoreColor(score);
  const icon = getScoreIcon(score);

  return (
    <View style={styles.container}>
      <View style={styles.scoreContainer}>
        <View style={styles.progressContainer}>
          <ProgressRing
            progress={score / 100}
            size={120}
            strokeWidth={12}
            color={scoreColor}
            backgroundColor="#E0E0E0"
          />
          <View style={styles.scoreCenter}>
            <Text style={[styles.score, { color: scoreColor }]}>{score}</Text>
            <Text style={styles.scoreLabel}>Connection</Text>
          </View>
        </View>

        <View style={styles.labelContainer}>
          <MaterialIcons name={icon} size={24} color={scoreColor} />
          <Text style={[styles.label, { color: scoreColor }]}>{label}</Text>
        </View>
      </View>

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Tips to Improve:</Text>
        {tips.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <MaterialIcons name="check" size={16} color={theme.colors.primary} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const windowWidth = Dimensions.get('window').width;
const isSmallScreen = windowWidth < 360;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  scoreCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [
      { translateY: -isSmallScreen ? -10 : -15 },
      { translateX: -isSmallScreen ? -15 : -20 }
    ],
    alignItems: 'center',
  },
  score: {
    fontSize: isSmallScreen ? 28 : 32,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipsContainer: {
    width: '100%',
    gap: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
});