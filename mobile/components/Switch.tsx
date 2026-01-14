import React, { useState } from 'react';
import {
  Switch as RNSwitch,
  SwitchProps as RNSwitchProps,
  ViewStyle,
  TextStyle,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface SwitchProps extends Omit<RNSwitchProps, 'value' | 'onValueChange'> {
  label?: string;
  labelStyle?: TextStyle;
  trackColor?: {
    true?: string;
    false?: string;
  };
  thumbColor?: string;
  disabled?: boolean;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  style?: ViewStyle;
}

const COLORS = {
  primary: '#E91E63',
  secondary: '#757575',
  surface: '#FFFFFF',
  disabled: '#BDBDBD',
  trackOn: '#E91E63',
  trackOff: '#BDBDBD',
  thumbOn: '#FFFFFF',
  thumbOff: '#FFFFFF',
  border: '#E0E0E0',
};

export function Switch({
  label,
  labelStyle,
  trackColor = {
    true: COLORS.trackOn,
    false: COLORS.trackOff,
  },
  thumbColor,
  disabled = false,
  value = false,
  onValueChange,
  style,
  ...props
}: SwitchProps) {
  const [internalValue, setInternalValue] = useState(value);

  const handleChange = (newValue: boolean) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  const finalThumbColor = thumbColor ?? (value ? COLORS.thumbOn : COLORS.thumbOff);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Feather
          name={value ? 'check-circle' : 'circle'}
          size={20}
          color={value ? COLORS.primary : COLORS.secondary}
          style={styles.icon}
        />
      )}
      {label && (
        <Text
          style={[
            styles.label,
            labelStyle,
            disabled && { color: COLORS.disabled },
          ]}
        >
          {label}
        </Text>
      )}
      <RNSwitch
        trackColor={trackColor}
        thumbColor={finalThumbColor}
        disabled={disabled}
        value={internalValue}
        onValueChange={handleChange}
        style={styles.switch}
        ios_backgroundColor={COLORS.trackOff}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    minHeight: 44,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    color: '#212121',
    flex: 1,
    marginRight: 16,
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
});

export default Switch;
