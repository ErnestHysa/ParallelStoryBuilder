import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large'
  color?: string
  fullScreen?: boolean
}

const COLORS = {
  primary: '#E91E63',
  background: '#FAFAFA',
};

export function LoadingSpinner({
  size = 'large',
  color,
  fullScreen = true
}: LoadingSpinnerProps) {
  const spinner = (
    <ActivityIndicator
      size={size}
      color={color || COLORS.primary}
    />
  );

  if (!fullScreen) {
    return spinner;
  }

  return (
    <View style={styles.container}>
      {spinner}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
