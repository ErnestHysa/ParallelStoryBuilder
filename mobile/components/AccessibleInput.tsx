import React, { useEffect, useRef, useState } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
  Pressable,
} from 'react-native';

// Types
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';

export interface AccessibleInputProps extends Omit<TextInputProps, 'onChange'> {
  /**
   * Label for the input
   */
  label?: string;

  /**
   * Description text below the input
   */
  description?: string;

  /**
   * Error message
   */
  error?: string;

  /**
   * Hint for screen readers
   */
  accessibilityHint?: string;

  /**
   * Whether the input is required
   */
  required?: boolean;

  /**
   * Input type
   */
  inputType?: InputType;

  /**
   * Icon to display on the left side
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon to display on the right side
   */
  rightIcon?: React.ReactNode;

  /**
   * Callback when right icon is pressed
   */
  onRightIconPress?: () => void;

  /**
   * Container style
   */
  containerStyle?: ViewStyle;

  /**
   * Input value (controlled)
   */
  value?: string;

  /**
   * Input onChange callback
   */
  onChange?: (value: string) => void;

  /**
   * Whether to show character count
   */
  showCharacterCount?: boolean;

  /**
   * Maximum character length
   */
  maxLength?: number;
}

const inputStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  required: {
    color: '#F44336',
    marginLeft: 2,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  inputContainerFocused: {
    borderColor: '#007AFF',
  },
  inputContainerError: {
    borderColor: '#F44336',
  },
  leftIcon: {
    padding: 12,
    marginRight: 4,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#212121',
    minHeight: 44,
  },
  rightIcon: {
    padding: 12,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'right',
    marginTop: 4,
  },
});

/**
 * AccessibleInput component with full accessibility support
 *
 * Features:
 * - Proper labeling for screen readers
 * - Error announcements
 * - Character counting
 * - Left and right icon support
 * - Focus states
 */
export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  description,
  error,
  accessibilityHint,
  required = false,
  inputType = 'text',
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  value,
  onChange,
  showCharacterCount = false,
  maxLength,
  style,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(inputType === 'password');
  const inputRef = useRef<TextInput>(null);

  // Handle password visibility toggle
  const togglePasswordVisibility = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  // Determine the actual secure text entry state
  const isSecure = inputType === 'password' ? secureTextEntry : undefined;

  // Handle keyboard type
  const getKeyboardType = (): TextInputProps['keyboardType'] => {
    switch (inputType) {
      case 'email':
        return 'email-address';
      case 'number':
      case 'tel':
        return 'numeric';
      case 'url':
        return 'url';
      default:
        return 'default';
    }
  };

  // Build accessibility label
  const accessibilityLabel = label
    ? required
      ? `${label}, required`
      : label
    : textInputProps.placeholder;

  // Build accessibility value
  const getAccessibilityValue = () => {
    if (!value) return {};
    if (error) {
      return { text: `${value}, invalid` };
    }
    return { text: value };
  };

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleChange = (text: string) => {
    onChange?.(text);
    textInputProps.onChangeText?.(text);
  };

  // Determine right icon
  const renderRightIcon = () => {
    if (inputType === 'password') {
      return (
        <TouchableOpacity
          onPress={togglePasswordVisibility}
          style={inputStyles.rightIcon}
          accessibilityLabel={secureTextEntry ? 'Show password' : 'Hide password'}
          accessibilityRole="button"
        >
          <Text style={{ fontSize: 16, color: '#757575' }}>
            {secureTextEntry ? '👁️' : '👁️‍🗨️'}
          </Text>
        </TouchableOpacity>
      );
    }
    if (rightIcon) {
      if (onRightIconPress) {
        return (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={inputStyles.rightIcon}
            accessibilityRole="button"
          >
            {rightIcon}
          </TouchableOpacity>
        );
      }
      return <View style={inputStyles.rightIcon}>{rightIcon}</View>;
    }
    return null;
  };

  return (
    <View style={[inputStyles.container, containerStyle]}>
      {label && (
        <View style={inputStyles.labelContainer}>
          <Text style={inputStyles.label}>{label}</Text>
          {required && <Text style={inputStyles.required}>*</Text>}
        </View>
      )}

      <View style={[
        inputStyles.inputContainer,
        isFocused ? inputStyles.inputContainerFocused : null,
        error ? inputStyles.inputContainerError : null,
      ]}>
        {leftIcon && <View style={inputStyles.leftIcon}>{leftIcon}</View>}

        <TextInput
          ref={inputRef}
          style={[inputStyles.input, style]}
          value={value}
          onChangeText={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isSecure}
          keyboardType={getKeyboardType()}
          autoCapitalize={inputType === 'email' ? 'none' : 'sentences'}
          autoComplete={
            inputType === 'email'
              ? 'email'
              : inputType === 'password'
                ? 'password'
                : undefined
          }
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityState={error ? { expanded: false } : undefined}
          accessibilityValue={getAccessibilityValue()}
          maxLength={maxLength}
          {...textInputProps}
        />

        {renderRightIcon()}
      </View>

      {error && <Text style={inputStyles.errorText}>{error}</Text>}

      {description && !error && <Text style={inputStyles.description}>{description}</Text>}

      {showCharacterCount && maxLength && (
        <Text style={inputStyles.characterCount}>
          {value?.length || 0} / {maxLength}
        </Text>
      )}
    </View>
  );
};

// Helper components
export const TextInputWithLabel: React.FC<AccessibleInputProps> = (props) => {
  return <AccessibleInput {...props} />;
};

export const PasswordInput: React.FC<Omit<AccessibleInputProps, 'inputType'>> = (props) => {
  return <AccessibleInput {...props} inputType="password" />;
};

export const EmailInput: React.FC<Omit<AccessibleInputProps, 'inputType'>> = (props) => {
  return <AccessibleInput {...props} inputType="email" />;
};

export const NumberInput: React.FC<Omit<AccessibleInputProps, 'inputType'>> = (props) => {
  return <AccessibleInput {...props} inputType="number" />;
};

export default AccessibleInput;
