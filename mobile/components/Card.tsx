import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
  ViewProps,
} from 'react-native';

export interface CardProps {
  variant?: 'elevated' | 'outlined' | 'flat';
  children: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityRole?: 'article' | 'region' | 'summary' | 'text' | 'none';
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
    hidden?: boolean;
  };
  testID?: string;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  accessibilityViewIsModal?: boolean;
  style?: any;
  containerStyle?: any;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onPress?: () => void;
  isPressable?: boolean;
  focusable?: boolean;
}

const COLORS = {
  surface: '#FFFFFF',
  border: '#E0E0E0',
};

export function Card({
  variant = 'elevated',
  children,
  accessibilityLabel,
  accessibilityRole = 'article',
  accessibilityState,
  testID,
  importantForAccessibility = 'auto',
  accessibilityViewIsModal = false,
  style,
  containerStyle,
  header,
  footer,
  onPress,
  isPressable = false,
  focusable = false,
}: CardProps) {
  const cardStyle = StyleSheet.flatten([
    styles.card,
    styles[variant],
    style,
  ]);

  const baseProps: ViewProps = {
    style: cardStyle,
    accessibilityLabel: accessibilityLabel || 'Card',
    accessibilityRole: isPressable ? ('button' as const) : (accessibilityRole as any),
    accessibilityState: {
      disabled: isPressable && onPress === undefined,
      ...accessibilityState,
    },
    testID,
    importantForAccessibility,
    accessibilityViewIsModal,
  };

  if (isPressable) {
    const pressableProps: TouchableOpacityProps = {
      ...baseProps,
      onPress,
      activeOpacity: 0.8,
      focusable,
    } as TouchableOpacityProps;
    return (
      <TouchableOpacity {...pressableProps}>
        {header && <View style={styles.header}>{header}</View>}
        <View style={styles.content}>{children}</View>
        {footer && <View style={styles.footer}>{footer}</View>}
      </TouchableOpacity>
    );
  }

  return (
    <View {...baseProps}>
      {header && <View style={styles.header}>{header}</View>}
      <View style={styles.content}>{children}</View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: COLORS.surface,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  outlined: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  flat: {},
  header: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 12,
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 12,
  },
});

// Named exports for sub-components
export function CardHeader({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={style}>{children}</View>;
}

export function CardContent({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={style}>{children}</View>;
}

export function CardFooter({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={style}>{children}</View>;
}
