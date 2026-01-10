import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  isLoading?: boolean
  children: React.ReactNode
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityRole?: 'button' | 'text' | 'link'
  disabled?: boolean
  style?: ViewStyle
  onPress?: () => void
}

const COLORS = {
  primary: '#E91E63',
  primaryDark: '#C2185B',
  secondary: '#9C27B0',
  error: '#F44336',
  surface: '#FFFFFF',
  background: '#FAFAFA',
  text: '#212121',
  border: '#E0E0E0',
};

export function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  style,
  onPress,
}: ButtonProps) {
  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      minHeight: 44,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    switch (variant) {
      case 'primary':
        return { ...base, backgroundColor: COLORS.primary };
      case 'secondary':
        return { ...base, backgroundColor: COLORS.secondary };
      case 'ghost':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: COLORS.primary,
        };
      case 'danger':
        return { ...base, backgroundColor: COLORS.error };
      default:
        return base;
    }
  };

  const getTextStyle = (): TextStyle => {
    return {
      color: variant === 'ghost' ? COLORS.primary : COLORS.surface,
      fontSize: 16,
      fontWeight: '600',
    };
  };

  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[getButtonStyle(), isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: isDisabled }}
    >
      {isLoading ? (
        <>
          <ActivityIndicator size="small" color={getTextStyle().color} />
          <View style={{ width: 8 }} />
          <Text style={getTextStyle()}>{children}</Text>
        </>
      ) : (
        <Text style={getTextStyle()}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});
