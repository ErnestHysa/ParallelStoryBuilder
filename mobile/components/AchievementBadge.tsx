import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

interface AchievementBadgeProps {
  achievement: {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: 'writing' | 'social' | 'exploration' | 'special';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    points: number;
    unlocked_at?: string;
    progress?: number;
    max_progress?: number;
  };
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  showProgress?: boolean;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = 'medium',
  onPress,
  showProgress = true,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 100,
          height: 100,
          iconSize: 30,
          titleSize: 12,
          descSize: 10,
          fontSize: 8,
        };
      case 'large':
        return {
          width: 140,
          height: 140,
          iconSize: 50,
          titleSize: 16,
          descSize: 12,
          fontSize: 10,
        };
      default:
        return {
          width: 120,
          height: 120,
          iconSize: 40,
          titleSize: 14,
          descSize: 11,
          fontSize: 9,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const getRarityColors = () => {
    const baseColors = {
      common: {
        background: '#E0E0E0',
        border: '#BDBDBD',
        text: '#424242',
        icon: '#E91E63',
      },
      rare: {
        background: 'rgba(75, 192, 192, 0.2)',
        border: 'rgba(75, 192, 192, 0.5)',
        text: '#424242',
        icon: 'rgba(75, 192, 192, 1)',
      },
      epic: {
        background: 'rgba(153, 102, 255, 0.2)',
        border: 'rgba(153, 102, 255, 0.5)',
        text: '#424242',
        icon: 'rgba(153, 102, 255, 1)',
      },
      legendary: {
        background: 'rgba(255, 215, 0, 0.2)',
        border: 'rgba(255, 215, 0, 0.5)',
        text: '#424242',
        icon: 'rgba(255, 215, 0, 1)',
      },
    };

    return baseColors[achievement.rarity];
  };

  const rarityColors = getRarityColors();

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const progressPercentage = achievement.max_progress && achievement.progress
    ? Math.round((achievement.progress / achievement.max_progress) * 100)
    : 0;

  const opacity = achievement.unlocked_at ? 1 : 0.5;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.7}
      disabled={!achievement.unlocked_at && !onPress}
    >
      <Animated.View
        style={[
          styles.badge,
          {
            width: sizeStyles.width,
            height: sizeStyles.height,
            backgroundColor: rarityColors.background,
            borderColor: rarityColors.border,
            opacity,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text
              style={[
                styles.icon,
                {
                  fontSize: sizeStyles.iconSize,
                  color: rarityColors.icon,
                  opacity: achievement.unlocked_at ? 1 : 0.3,
                },
              ]}
            >
              {achievement.icon}
            </Text>
          </View>

          <Animated.Text
            style={[
              styles.title,
              {
                fontSize: sizeStyles.titleSize,
                color: rarityColors.text,
                opacity: achievement.unlocked_at ? 1 : 0.5,
              },
            ]}
          >
            {achievement.title}
          </Animated.Text>

          {showProgress && achievement.max_progress && achievement.progress && (
            <View style={styles.progressContainer}>
              <View style={[
                styles.progressBar,
                {
                  width: `${progressPercentage}%`,
                  backgroundColor: rarityColors.icon,
                },
              ]} />
            </View>
          )}

          {achievement.unlocked_at && (
            <View style={styles.pointsContainer}>
              <Text style={[
                styles.points,
                {
                  fontSize: sizeStyles.fontSize,
                  color: rarityColors.text,
                },
              ]}>
                +{achievement.points} pts
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    marginBottom: 4,
  },
  icon: {
    textAlign: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  progressContainer: {
    width: '80%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  pointsContainer: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  points: {
    fontWeight: 'bold',
  },
});

export default AchievementBadge;