import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface SettingItemProps {
  title: string;
  description?: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  disabled?: boolean;
  rightComponent?: React.ReactNode;
  style?: any;
  showArrow?: boolean;
}

const COLORS = {
  primary: '#E91E63',
  surface: '#FFFFFF',
  background: '#FAFAFA',
  text: '#212121',
  secondary: '#757575',
  border: '#E0E0E0',
  disabled: '#BDBDBD',
};

export function SettingItem({
  title,
  description,
  icon,
  onPress,
  disabled = false,
  rightComponent,
  style,
  showArrow = true,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress && !disabled ? onPress : undefined}
      disabled={disabled}
      style={[
        styles.container,
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <View style={[styles.leftSection, disabled && styles.disabled]}>
        {icon && (
          <Feather
            name={icon}
            size={20}
            color={disabled ? COLORS.disabled : COLORS.primary}
            style={styles.icon}
          />
        )}
        <View style={styles.textSection}>
          <Text
            style={[
              styles.title,
              disabled && { color: COLORS.disabled },
            ]}
          >
            {title}
          </Text>
          {description && (
            <Text
              style={[
                styles.description,
                disabled && { color: COLORS.disabled },
              ]}
            >
              {description}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        {rightComponent ? (
          rightComponent
        ) : showArrow ? (
          <Feather
            name="chevron-right"
            size={20}
            color={COLORS.secondary}
          />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  disabled: {
    opacity: 0.5,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 16,
  },
  textSection: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: COLORS.secondary,
    lineHeight: 20,
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SettingItem;