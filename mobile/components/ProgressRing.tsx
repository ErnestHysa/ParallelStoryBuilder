import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
} from 'react-native';
import { Svg, Circle, G } from 'react-native-svg';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#4CAF50',
  backgroundColor = '#E0E0E0',
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const animatedValue = useRef(new Animated.Value(0)).current;

  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const center = size / 2;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedValue]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${center}, ${center}`}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Progress circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
          />
        </G>
      </Svg>

      {/* Center content */}
      <View style={styles.centerContent}>
        {children}
      </View>
    </View>
  );
};

interface CircularProgressProps extends ProgressRingProps {
  showPercentage?: boolean;
  fontSize?: number;
  textColor?: string;
  formatProgress?: (progress: number) => string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#4CAF50',
  backgroundColor = '#E0E0E0',
  showPercentage = true,
  fontSize = 16,
  textColor = '#333',
  formatProgress,
  children,
}) => {
  const formattedProgress = formatProgress
    ? formatProgress(progress)
    : `${Math.round(progress)}%`;

  return (
    <ProgressRing
      progress={progress}
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      backgroundColor={backgroundColor}
    >
      <View style={styles.centerContent}>
        {children ? (
          children
        ) : showPercentage ? (
          <View style={styles.textContainer}>
            <Text style={[styles.percentageText, { fontSize, color: textColor }]}>
              {formattedProgress}
            </Text>
          </View>
        ) : null}
      </View>
    </ProgressRing>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  percentageText: {
    fontWeight: 'bold',
  },
});

export { ProgressRing, CircularProgress };
