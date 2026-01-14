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
  AccessibilityRole,
} from 'react-native';

export interface TextAreaProps extends Omit<TextInputProps, 'onChange'> {
  label?: string;
  error?: string;
  description?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
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
  rows?: number;
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

export function TextArea({
  label,
  error,
  description,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'none',
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
  rows = 6,
  announceRequired = true,
  showHelpOnFocus = true,
  ...props
}: TextAreaProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<TextInput>(null);

  const finalAccessibilityLabel = accessibilityLabel || label;
  const finalAccessibilityHint = accessibilityHint ||
    (showHelpOnFocus ? 'Enter multi-line text' : undefined);

  const labelText = label || 'Text area';
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
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 8,
      backgroundColor: COLORS.surface,
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

    return base;
  };

  const getInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      minHeight: rows * 40,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: COLORS.surface,
      color: COLORS.text,
      fontSize: 16,
      textAlignVertical: 'top',
    };

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
          accessibilityRole="text"
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
        <TextInput
          ref={inputRef}
          style={[getInputStyle(), props.editable === false && styles.inputDisabled]}
          placeholderTextColor={COLORS.textSecondary}
          accessibilityLabel={finalAccessibilityLabel}
          accessibilityHint={finalAccessibilityHint}
          accessibilityRole={accessibilityRole}
          accessibilityState={{
            disabled: props.editable === false,
            selected: isFocused,
            ...accessibilityState,
          }}
          importantForAccessibility={importantForAccessibility}
          accessibilityViewIsModal={accessibilityViewIsModal}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline
          numberOfLines={rows}
          textAlignVertical="top"
          {...props}
        />
      </TouchableOpacity>

      {showCharCount && maxLength && (
        <Text
          style={showCharCountWarning ? styles.charCountWarning : styles.charCount}
          accessible={true}
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    color: COLORS.textSecondary,
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

export default TextArea;
