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
  accessibilityState?: {
    disabled?: boolean
    selected?: boolean
    checked?: boolean | 'mixed'
    busy?: boolean
    expanded?: boolean
  }
  disabled?: boolean
  style?: ViewStyle
  onPress?: () => void
  testID?: string
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants'
  accessibilityViewIsModal?: boolean
  liveRegion?: 'polite' | 'assertive' | 'none'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  width?: 'auto' | 'full'
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
  accessibilityState,
  style,
  onPress,
  testID,
  importantForAccessibility = 'yes',
  accessibilityViewIsModal = false,
  liveRegion = 'none',
  leftIcon,
  rightIcon,
  size = 'md',
  width = 'auto',
}: ButtonProps) {
  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: 'solid',
      gap: 8,
    };

    switch (size) {
      case 'sm':
        return {
          ...base,
          paddingHorizontal: 12,
          paddingVertical: 8,
          minHeight: 36,
          minWidth: 36,
          borderRadius: 6,
        };
      case 'md':
        return {
          ...base,
          paddingHorizontal: 16,
          paddingVertical: 12,
          minHeight: 44,
          minWidth: 44,
          borderRadius: 8,
        };
      case 'lg':
        return {
          ...base,
          paddingHorizontal: 24,
          paddingVertical: 16,
          minHeight: 52,
          minWidth: 52,
          borderRadius: 10,
        };
      default:
        return base;
    }
  };

  const getTextStyle = (): TextStyle => {
    let baseStyle: TextStyle = {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    };

    switch (size) {
      case 'sm':
        baseStyle = { ...baseStyle, fontSize: 14, fontWeight: '500' };
        break;
      case 'md':
        baseStyle = { ...baseStyle, fontSize: 16, fontWeight: '600' };
        break;
      case 'lg':
        baseStyle = { ...baseStyle, fontSize: 18, fontWeight: '700' };
        break;
    }

    switch (variant) {
      case 'primary':
        baseStyle.color = COLORS.surface;
        break;
      case 'secondary':
        baseStyle.color = COLORS.surface;
        break;
      case 'ghost':
        baseStyle.color = COLORS.primary;
        break;
      case 'danger':
        baseStyle.color = COLORS.surface;
        break;
    }

    return baseStyle;
  };

  const getContainerStyle = (): ViewStyle => {
    const containerStyle: ViewStyle = { ...getButtonStyle() };

    switch (variant) {
      case 'primary':
        containerStyle.backgroundColor = COLORS.primary;
        containerStyle.borderColor = COLORS.primary;
        break;
      case 'secondary':
        containerStyle.backgroundColor = COLORS.secondary;
        containerStyle.borderColor = COLORS.secondary;
        break;
      case 'ghost':
        containerStyle.backgroundColor = 'transparent';
        containerStyle.borderColor = COLORS.primary;
        break;
      case 'danger':
        containerStyle.backgroundColor = COLORS.error;
        containerStyle.borderColor = COLORS.error;
        break;
    }

    if (disabled || isLoading) {
      containerStyle.opacity = 0.5;
    }

    if (width === 'full') {
      containerStyle.width = '100%';
    }

    return containerStyle;
  };

  const isDisabled = disabled || isLoading;
  const finalAccessibilityLabel = accessibilityLabel ||
    (typeof children === 'string' ? children : 'Button');

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityLabel={finalAccessibilityLabel}
      accessibilityHint={accessibilityHint || 'Press to activate'}
      accessibilityRole={accessibilityRole}
      accessibilityState={{
        disabled: isDisabled,
        busy: isLoading,
        ...accessibilityState,
      }}
      testID={testID}
      importantForAccessibility={importantForAccessibility}
      accessibilityViewIsModal={accessibilityViewIsModal}
      accessibilityLiveRegion={liveRegion}
    >
      {isLoading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? COLORS.surface : COLORS.primary}
          style={{ position: 'absolute' }}
        />
      )}

      {leftIcon && <View style={{ opacity: isLoading ? 0 : 1 }}>{leftIcon}</View>}

      {typeof children === 'string' ? (
        <Text style={[getTextStyle(), { opacity: isLoading ? 0 : 1 }]}>
          {children}
        </Text>
      ) : (
        <View style={{ opacity: isLoading ? 0 : 1 }}>{children}</View>
      )}

      {rightIcon && <View style={{ opacity: isLoading ? 0 : 1 }}>{rightIcon}</View>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});
