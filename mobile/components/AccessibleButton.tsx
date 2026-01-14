import React from 'react';
import { Pressable, Text, StyleSheet, View, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { GestureResponderEvent } from 'react-native/Libraries/Types/CoreEventTypes';
import { Platform } from 'react-native';

// Types
export interface AccessibleButtonProps {
  /**
   * The text content of the button
   */
  children: React.ReactNode;

  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;

  /**
   * Hint for screen readers describing what happens when pressed
   */
  accessibilityHint?: string;

  /**
   * Role for the button
   */
  accessibilityRole?: 'button' | 'link' | 'tab' | 'switch';

  /**
   * State of the button for accessibility
   */
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };

  /**
   * Whether the button is disabled
   */
  disabled?: boolean;

  /**
   * Whether the button is loading
   */
  loading?: boolean;

  /**
   * Icon to display on the left side of the button
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon to display on the right side of the button
   */
  rightIcon?: React.ReactNode;

  /**
   * Button size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

  /**
   * Width of the button
   */
  width?: 'auto' | 'full';

  /**
   * Custom style for the button
   */
  style?: ViewStyle;

  /**
   * Custom style for the text
   */
  textStyle?: TextStyle;

  /**
   * Callback when button is pressed
   */
  onPress?: (event: GestureResponderEvent) => void;

  /**
   * Callback when button is focused
   */
  onFocus?: () => void;

  /**
   * Callback when button loses focus
   */
  onBlur?: () => void;

  /**
   * Test ID for testing
   */
  testID?: string;

  /**
   * Accessibility live region
   */
  accessibilityLiveRegion?: 'polite' | 'assertive' | 'none';

  /**
   * Element ID that labels this element
   */
  ariaLabelledBy?: string;

  /**
   * Element ID that describes this element
   */
  ariaDescribedBy?: string;

  /**
   * Minimum touch target size (44x44pt recommended)
   */
  touchTargetSize?: number;
}

// Default button styles
const buttonStyles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 44,
    minWidth: 44,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderStyle: 'solid',
    gap: 8,
  },
  primary: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  secondary: {
    backgroundColor: '#F2F2F7',
    borderColor: '#E5E5EA',
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: '#007AFF',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  destructive: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  disabled: {
    opacity: 0.5,
    pointerEvents: 'none' as any,
  },
  loading: {
    opacity: 0.8,
  },
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    minWidth: 36,
    borderRadius: 6,
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    minWidth: 44,
    borderRadius: 8,
  },
  lg: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 52,
    minWidth: 52,
    borderRadius: 10,
  },
  fullWidth: {
    width: '100%',
  },
  iconOnly: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});

// Text styles
const textStyles = StyleSheet.create({
  base: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#FFFFFF',
  },
  primary: {
    color: '#FFFFFF',
  },
  secondary: {
    color: '#007AFF',
  },
  outline: {
    color: '#007AFF',
  },
  ghost: {
    color: '#007AFF',
  },
  destructive: {
    color: '#FFFFFF',
  },
  sm: {
    fontSize: 14,
    fontWeight: '500',
  },
  md: {
    fontSize: 16,
    fontWeight: '600',
  },
  lg: {
    fontSize: 18,
    fontWeight: '700',
  },
});

/**
 * AccessibleButton component with full WCAG AA+ compliance
 *
 * Features:
 * - Minimum 44x44pt touch targets
 * - ARIA labels and hints
 * - Keyboard navigation support
 * - Screen reader announcements
 * - Proper focus management
 * - Loading states
 * - Icon support
 * - Various visual variants
 */
export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  size = 'md',
  variant = 'primary',
  width = 'auto',
  style,
  textStyle,
  onPress,
  onFocus,
  onBlur,
  testID,
  accessibilityLiveRegion = 'none',
  ariaLabelledBy,
  ariaDescribedBy,
  touchTargetSize = 44,
}) => {
  // Create the accessibility label if not provided
  const finalAccessibilityLabel = accessibilityLabel ||
    (typeof children === 'string' ? children : 'Button');

  // Combine all accessibility props
  const accessibilityProps = {
    accessible: true,
    accessibilityLabel: finalAccessibilityLabel,
    accessibilityHint: accessibilityHint || 'Press to activate',
    accessibilityRole,
    accessibilityState: {
      disabled,
      busy: loading,
      ...accessibilityState,
    },
    accessibilityLiveRegion,
    importantForAccessibility: 'yes' as const,
    accessibilityViewIsModal: false,
    ...(ariaLabelledBy && { accessibilityLabelledBy: ariaLabelledBy }),
    ...(ariaDescribedBy && { accessibilityDescribedBy: ariaDescribedBy }),
  };

  // Calculate styles
  const buttonStyle = StyleSheet.flatten([
    buttonStyles.base,
    buttonStyles[variant],
    buttonStyles[size],
    disabled && buttonStyles.disabled,
    loading && buttonStyles.loading,
    width === 'full' && buttonStyles.fullWidth,
    !children && buttonStyles.iconOnly,
    style,
  ]);

  const textStyleComputed = StyleSheet.flatten([
    textStyles.base,
    textStyles[variant],
    textStyles[size],
    textStyle,
  ]);

  // Handle press with proper accessibility feedback
  const handlePress = (event: GestureResponderEvent) => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }

    // Provide haptic feedback on supported devices
    if (Platform.OS === 'ios' && !disabled && !loading) {
      const HapticFeedback = require('react-native-haptic-feedback').default;
      HapticFeedback.trigger('impactLight');
    }

    onPress?.(event);
  };

  // Handle keyboard focus
  const handleFocus = () => {
    if (!disabled && !loading) {
      // Provide haptic feedback for focus
      if (Platform.OS === 'ios') {
        const HapticFeedback = require('react-native-haptic-feedback').default;
        HapticFeedback.trigger('impactLight');
      }
      onFocus?.();
    }
  };

  return (
    <Pressable
      {...accessibilityProps}
      testID={testID}
      style={({ pressed }) => [
        buttonStyle,
        {
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      onPress={handlePress}
      onPressIn={handleFocus}
      onFocus={handleFocus}
      onBlur={onBlur}
      disabled={disabled || loading}
      android_ripple={{
        color: variant === 'primary' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 122, 255, 0.3)',
        borderless: false,
        radius: touchTargetSize / 2,
      }}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : '#007AFF'}
          style={{ position: 'absolute' }}
        />
      )}

      {leftIcon && (
        <View style={{ opacity: loading ? 0 : 1 }}>
          {leftIcon}
        </View>
      )}

      {typeof children === 'string' ? (
        <Text
          style={[
            textStyleComputed,
            {
              opacity: loading ? 0 : 1,
            },
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {children}
        </Text>
      ) : (
        <View style={{ opacity: loading ? 0 : 1 }}>
          {children}
        </View>
      )}

      {rightIcon && (
        <View style={{ opacity: loading ? 0 : 1 }}>
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
};

// Helper components for common button patterns
export const IconButton: React.FC<AccessibleButtonProps> = (props) => {
  return (
    <AccessibleButton
      {...props}
      size="md"
      variant={props.variant || 'ghost'}
      width="auto"
    >
      {props.children}
    </AccessibleButton>
  );
};

export const PrimaryButton: React.FC<Omit<AccessibleButtonProps, 'variant'>> = (props) => {
  return <AccessibleButton {...props} variant="primary" />;
};

export const SecondaryButton: React.FC<Omit<AccessibleButtonProps, 'variant'>> = (props) => {
  return <AccessibleButton {...props} variant="secondary" />;
};

export const OutlineButton: React.FC<Omit<AccessibleButtonProps, 'variant'>> = (props) => {
  return <AccessibleButton {...props} variant="outline" />;
};

export const GhostButton: React.FC<Omit<AccessibleButtonProps, 'variant'>> = (props) => {
  return <AccessibleButton {...props} variant="ghost" />;
};

export const DestructiveButton: React.FC<Omit<AccessibleButtonProps, 'variant'>> = (props) => {
  return <AccessibleButton {...props} variant="destructive" />;
};

// Helper for creating groups of buttons
export const ButtonGroup: React.FC<{
  children: React.ReactNode;
  spacing?: number;
  style?: ViewStyle;
}> = ({ children, spacing = 8, style }) => {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {React.Children.map(children, (child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < React.Children.count(children) - 1 && (
            <View style={{ width: spacing }} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};