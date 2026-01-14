import React from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface StreakDisplayProps {
  streak: number;
  size?: number;
  showLabel?: boolean;
  style?: any;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({
  streak,
  size = 80,
  showLabel = true,
  style
}) => {
  const fireScale = React.useRef(new Animated.Value(1)).current;

  // Animate fire when streak increases
  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(fireScale, {
        toValue: 1.2,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fireScale, {
        toValue: 1,
        duration: 200,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [streak, fireScale]);

  const getStreakColor = () => {
    if (streak >= 30) return '#FFD700'; // Gold
    if (streak >= 14) return '#FF6B6B'; // Red
    if (streak >= 7) return '#FFA500'; // Orange
    return '#FF69B4'; // Pink
  };

  const getStreakEmoji = () => {
    if (streak >= 100) return '🔥🔥🔥';
    if (streak >= 30) return '🔥🔥';
    if (streak >= 14) return '🔥';
    return streak > 0 ? '🔥' : '🌱';
  };

  return (
    <View style={[styles.container, style, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.fireContainer,
          {
            width: size * 0.8,
            height: size * 0.8,
            transform: [{ scale: fireScale }],
          },
        ]}
      >
        <Text style={[
          styles.fire,
          {
            fontSize: size * 0.5,
            color: getStreakColor(),
          }
        ]}>
          {getStreakEmoji()}
        </Text>
      </Animated.View>

      {showLabel && (
        <Text style={[
          styles.streakText,
          {
            fontSize: size * 0.15,
            color: getStreakColor(),
          }
        ]}>
          {streak}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fireContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  fire: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  streakText: {
    fontWeight: 'bold',
    marginTop: 2,
    position: 'absolute',
    bottom: 0,
  },
});

export default StreakDisplay;