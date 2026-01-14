import React from 'react';
import {
  TextInput,
  Text,
  View,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';

export interface InputProps extends Omit<TextInputProps, 'onChange'> {
  label?: string;
  error?: string;
  description?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'text';
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
  descriptionStyle?: TextStyle;
  testID?: string;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  accessibilityViewIsModal?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
  minLength?: number;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightButton?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  announceRequired?: boolean;
  showHelpOnFocus?: boolean;
}

const COLORS = {
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  primary: '#E91E63',
  error: '#F44336',
};

export function Input({
  label,
  error,
  description,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'text',
  accessibilityState,
  style,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  descriptionStyle,
  testID,
  importantForAccessibility = 'yes',
  accessibilityViewIsModal = false,
  showCharCount = false,
  maxLength,
  minLength,
  required = false,
  leftIcon,
  rightIcon,
  rightButton,
  size = 'md',
  variant = 'default',
  announceRequired = true,
  showHelpOnFocus = true,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<TextInput>(null);

  const finalAccessibilityLabel = accessibilityLabel || label;
  const finalAccessibilityHint = accessibilityHint ||
    (showHelpOnFocus ? 'Enter text' : undefined);

  const labelText = label || 'Input field';
  const labelWithRequired = announceRequired && required
    ? `${labelText} required`
    : labelText;

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      position: 'relative',
      width: '100%',
      marginBottom: 16,
    };

    return { ...base, ...containerStyle };
  };

  const getInputContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 8,
      backgroundColor: COLORS.surface,
      minHeight: 44,
    };

    if (error) {
      base.borderColor = COLORS.error;
      base.borderWidth = 1;
    }

    if (isFocused) {
      base.borderColor = COLORS.primary;
      base.borderWidth = 2;
      base.shadowColor = COLORS.primary;
      base.shadowOffset = { width: 0, height: 0 };
      base.shadowRadius = 4;
      base.shadowOpacity = 0.2;
    }

    switch (size) {
      case 'sm':
        base.minHeight = 36;
        (base as any).borderRadius = 6;
        break;
      case 'md':
        base.minHeight = 44;
        (base as any).borderRadius = 8;
        break;
      case 'lg':
        base.minHeight = 52;
        (base as any).borderRadius = 10;
        break;
    }

    switch (variant) {
      case 'filled':
        base.backgroundColor = '#F5F5F5';
        break;
      case 'outlined':
        base.backgroundColor = 'transparent';
        break;
    }

    return base;
  };

  const getInputStyle = (): TextStyle => {
    let baseStyle: TextStyle = {
      fontSize: 16,
      color: COLORS.text,
      minHeight: 44,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flex: 1,
    };

    switch (size) {
      case 'sm':
        baseStyle = { ...baseStyle, fontSize: 14, minHeight: 36 };
        break;
      case 'md':
        baseStyle = { ...baseStyle, fontSize: 16, minHeight: 44 };
        break;
      case 'lg':
        baseStyle = { ...baseStyle, fontSize: 18, minHeight: 52 };
        break;
    }

    return { ...baseStyle, ...inputStyle };
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const charCount = props.value?.length || 0;
  const showCharCountWarning = maxLength && charCount > maxLength * 0.8;

  return (
    <View style={[getContainerStyle(), style]} testID={testID}>
      {label && (
        <Text
          style={[
            styles.label,
            required && styles.labelRequired,
            labelStyle,
          ]}
          accessible={true}
          accessibilityRole={accessibilityRole}
          accessibilityLabel={labelWithRequired}
          importantForAccessibility="yes"
        >
          {label}
          {required && <Text style={styles.labelRequired}> *</Text>}
        </Text>
      )}

      {description && (
        <Text style={[styles.description, descriptionStyle]}>
          {description}
        </Text>
      )}

      <TouchableOpacity
        onPress={() => inputRef.current?.focus()}
        style={getInputContainerStyle()}
        activeOpacity={0.8}
        disabled={props.editable === false}
        accessibilityRole="none"
      >
        {leftIcon && (
          <View style={styles.leftIconContainer} pointerEvents="none">
            {leftIcon}
          </View>
        )}

        <TextInput
          ref={inputRef}
          style={[getInputStyle(), props.editable === false && styles.inputDisabled]}
          placeholderTextColor={COLORS.textSecondary}
          accessibilityLabel={finalAccessibilityLabel}
          accessibilityHint={finalAccessibilityHint}
          accessibilityRole="text"
          accessibilityState={{
            disabled: props.editable === false,
            selected: isFocused,
            ...accessibilityState,
          }}
          importantForAccessibility={importantForAccessibility}
          accessibilityViewIsModal={accessibilityViewIsModal}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {rightIcon && (
          <View style={styles.rightIconContainer} pointerEvents="none">
            {rightIcon}
          </View>
        )}

        {rightButton && (
          <View style={styles.rightButtonContainer}>
            {rightButton}
          </View>
        )}
      </TouchableOpacity>

      {showCharCount && maxLength && (
        <Text
          style={showCharCountWarning ? styles.charCountWarning : styles.charCount}
          accessible={true}
          accessibilityRole="text"
          accessibilityLiveRegion="none"
        >
          {charCount} / {maxLength}
        </Text>
      )}

      {error && (
        <Text
          style={[styles.errorText, errorStyle]}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  labelRequired: {
    color: COLORS.error,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputDisabled: {
    color: COLORS.textSecondary,
  },
  leftIconContainer: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  rightButtonContainer: {
    position: 'absolute',
    right: 8,
    zIndex: 1,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  charCountWarning: {
    color: COLORS.primary,
  },
});

export default Input;
