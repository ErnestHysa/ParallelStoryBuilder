import React from 'react';
import {
  TextInput,
  Text,
  View,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';

export interface InputProps extends TextInputProps {
  label?: string
  error?: string
  accessibilityLabel?: string
  accessibilityHint?: string
  style?: ViewStyle
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
  style,
  accessibilityLabel,
  accessibilityHint,
  ...props
}: InputProps) {
  return (
    <View style={style}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <TextInput
        style={error ? [styles.input, styles.inputError] : styles.input}
        placeholderTextColor={COLORS.textSecondary}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint || (error ? `Error: ${error}` : undefined)}
        {...props}
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  input: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: 16,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
});
