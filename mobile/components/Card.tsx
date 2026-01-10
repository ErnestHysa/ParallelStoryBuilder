import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

export interface CardProps {
  variant?: 'elevated' | 'outlined' | 'flat'
  children: React.ReactNode
  accessibilityLabel?: string
  accessibilityRole?: 'summary' | 'text' | 'none'
  style?: ViewStyle
}

const COLORS = {
  surface: '#FFFFFF',
  border: '#E0E0E0',
};

export function Card({
  variant = 'elevated',
  children,
  accessibilityLabel,
  accessibilityRole = 'summary',
  style,
}: CardProps) {
  const getCardStyle = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: 12,
      padding: 16,
      backgroundColor: COLORS.surface,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...base,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        };
      case 'outlined':
        return {
          ...base,
          borderWidth: 1,
          borderColor: COLORS.border,
        };
      case 'flat':
        return base;
      default:
        return base;
    }
  };

  return (
    <View
      style={[getCardStyle(), style]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  outlined: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  flat: {},
});
