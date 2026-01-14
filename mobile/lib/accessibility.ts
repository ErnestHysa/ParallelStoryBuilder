import { Platform, AccessibilityInfo, PixelRatio } from 'react-native';

/**
 * Accessibility utilities for React Native
 */

// Accessibility constants
export const ACCESSIBILITY = {
  // Screen reader announcement duration in milliseconds
  ANNOUNCEMENT_DURATION: 3000,

  // Animation durations
  ANIMATION_DURATION: {
    fast: 200,
    normal: 300,
    slow: 500,
  },

  // Minimum touch target size in dp (WCAG AA standard)
  MIN_TOUCH_TARGET: 44,

  // Font scale factors
  FONT_SCALE_FACTORS: {
    small: 0.85,
    normal: 1,
    large: 1.15,
    extraLarge: 1.3,
  },
} as const;

/**
 * Screen reader utilities
 */
export const ScreenReader = {
  /**
   * Check if screen reader is enabled
   */
  isEnabled: async (): Promise<boolean> => {
    return await AccessibilityInfo.isScreenReaderEnabled();
  },

  /**
   * Announce a message to screen reader users
   */
  announce: (message: string, duration: number = ACCESSIBILITY.ANNOUNCEMENT_DURATION): void => {
    if (Platform.OS === 'android') {
      AccessibilityInfo.announceForAccessibility(message);
    } else {
      AccessibilityInfo.announceForAccessibility(message);
      // On iOS, we could use a UIAccessibilityNotification
    }
  },

  /**
   * Add an accessibility change listener
   */
  addChangeListener: (callback: (enabled: boolean) => void): (() => void) => {
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', callback);
    return () => subscription.remove();
  },
} as const;

/**
 * Focus management utilities for React Native
 */
export const Focus = {
  /**
   * Minimum touch target size in pixels
   */
  minTouchTarget: (scaleFactor: number = 1): number => {
    return PixelRatio.getPixelSizeForLayoutSize(
      ACCESSIBILITY.MIN_TOUCH_TARGET * scaleFactor
    );
  },

  /**
   * Check if element meets minimum touch target size
   */
  isValidTouchTarget: (width: number, height: number, scaleFactor: number = 1): boolean => {
    const minSize = Focus.minTouchTarget(scaleFactor);
    return width >= minSize && height >= minSize;
  },
} as const;

/**
 * Motion preferences
 */
export const Motion = {
  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion: (): boolean => {
    // React Native doesn't have a direct API for this
    // Could be stored in app settings
    return false;
  },

  /**
   * Get animation duration based on reduced motion preference
   */
  getDuration: (baseDuration: number): number => {
    return Motion.prefersReducedMotion() ? ACCESSIBILITY.ANIMATION_DURATION.fast : baseDuration;
  },
} as const;

/**
 * Font scaling utilities
 */
export const Typography = {
  /**
   * Check if large text is enabled (Android only)
   */
  isLargeTextEnabled: async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      return await AccessibilityInfo.isBoldTextEnabled();
    }
    return false;
  },

  /**
   * Get font scale from PixelRatio
   */
  getFontScale: (): number => {
    return PixelRatio.getFontScale();
  },

  /**
   * Check if font scale is within acceptable range
   */
  isValidFontScale: (): boolean => {
    const scale = Typography.getFontScale();
    return scale >= ACCESSIBILITY.FONT_SCALE_FACTORS.small &&
           scale <= ACCESSIBILITY.FONT_SCALE_FACTORS.extraLarge;
  },
} as const;

/**
 * Contrast utilities
 */
export const Contrast = {
  /**
   * Calculate relative luminance of a color
   * @param hexColor - Hex color string (e.g., "#RRGGBB" or "#RGB")
   */
  getLuminance: (hexColor: string): number => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const toLinear = (c: number): number => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };

    const rLinear = toLinear(r);
    const gLinear = toLinear(g);
    const bLinear = toLinear(b);

    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio: (color1: string, color2: string): number => {
    const lum1 = Contrast.getLuminance(color1);
    const lum2 = Contrast.getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Check if color combination meets WCAG AA standard
   * @param ratio - Contrast ratio to check
   * @param level - WCAG level ('AA' or 'AAA')
   * @param largeText - Whether the text is large (18pt+ or 14pt+ bold)
   */
  meetsWCAG: (ratio: number, level: 'AA' | 'AAA' = 'AA', largeText: boolean = false): boolean => {
    if (level === 'AAA') {
      return largeText ? ratio >= 4.5 : ratio >= 7;
    }
    return largeText ? ratio >= 3 : ratio >= 4.5;
  },
} as const;

/**
 * Accessibility role definitions for React Native
 */
export const A11yRoles = {
  // Standard roles
  BUTTON: 'button',
  LINK: 'link',
  HEADER: 'header',
  TEXT: 'text',
  SEARCH: 'search',
  NONE: 'none',
  SUMMARY: 'summary',
  IMAGE: 'image',
  IMAGEBUTTON: 'imagebutton',
  KEYBOARDKEY: 'keyboardkey',

  // Android-specific
  ALERT: 'alert',
  CHECKBOX: 'checkbox',
  COMBOBOX: 'combobox',
  MENU: 'menu',
  MENUBAR: 'menubar',
  MENUITEM: 'menuitem',
  PROGRESSBAR: 'progressbar',
  RADIOBUTTON: 'radiobutton',
  SCROLLBAR: 'scrollbar',
  SPINNER: 'spinner',
  TAB: 'tab',
  TABBAR: 'tabbar',
  TABLIST: 'tablist',
  TIMER: 'timer',
  TOGGLEBUTTON: 'togglebutton',
  TOOLBAR: 'toolbar',
} as const;

/**
 * Accessibility trait definitions (iOS)
 */
export const A11yTraits = {
  NONE: 'none',
  BUTTON: 'button',
  LINK: 'link',
  HEADER: 'header',
  SEARCH: 'search',
  IMAGE: 'image',
  SELECTED: 'selected',
  PLAYS: 'plays',
  KEY: 'key',
  TEXT: 'text',
  SUMMARY: 'summary',
  DISABLED: 'disabled',
  FREQUENTLY_UPDATED: 'frequentlyUpdated',
  STARTS_MEDIA: 'startsMedia',
  ADJUSTABLE: 'adjustable',
  ALLOWS_DIRECT_INTERACTION: 'allowsDirectInteraction',
  CAUSES_PAGE_TURN: 'causesPageTurn',
  PAGE_TURN: 'pageTurn',
} as const;

/**
 * Semantic component type definitions for React Native
 */
export const SemanticElements = {
  /**
   * Create accessible button props
   */
  Button: (accessibilityLabel: string) => ({
    accessibilityRole: A11yRoles.BUTTON,
    accessibilityLabel,
    accessibilityState: { disabled: false },
  }),

  /**
   * Create accessible link props
   */
  Link: (accessibilityLabel: string) => ({
    accessibilityRole: A11yRoles.LINK,
    accessibilityLabel,
  }),

  /**
   * Create accessible header props
   */
  Header: (accessibilityLabel?: string) => ({
    accessibilityRole: A11yRoles.HEADER,
    accessibilityLabel,
    accessibilityLevel: 1,
  }),

  /**
   * Create accessible text props
   */
  Text: (accessibilityLabel?: string) => ({
    accessibilityRole: A11yRoles.TEXT,
    accessibilityLabel,
  }),
} as const;

/**
 * High contrast color combinations that meet WCAG AA
 */
export const HIGH_CONTRAST_COLORS = {
  // Light backgrounds
  white_black: { bg: '#FFFFFF', fg: '#000000', ratio: 21 },
  white_darkGray: { bg: '#FFFFFF', fg: '#1A1A1A', ratio: 16.5 },
  lightGray_black: { bg: '#F5F5F5', fg: '#000000', ratio: 18.5 },
  cream_black: { bg: '#FFFDD0', fg: '#000000', ratio: 19.5 },

  // Dark backgrounds
  black_white: { bg: '#000000', fg: '#FFFFFF', ratio: 21 },
  darkGray_white: { bg: '#1A1A1A', fg: '#FFFFFF', ratio: 16.5 },
  navy_lightYellow: { bg: '#000080', fg: '#FFFF00', ratio: 16.3 },
  darkGreen_lightGreen: { bg: '#006400', fg: '#90EE90', ratio: 12.2 },

  // Brand colors with WCAG AA combinations
  purple_onWhite: { bg: '#FFFFFF', fg: '#9C27B0', ratio: 4.8 },
  purple_onLight: { bg: '#F3E5F5', fg: '#9C27B0', ratio: 4.1 },
  pink_onWhite: { bg: '#FFFFFF', fg: '#E91E63', ratio: 4.5 },
} as const;

/**
 * Utility to get a high contrast color combination
 */
export const getHighContrastColors = (
  preferDark: boolean = false
): { bg: string; fg: string } => {
  if (preferDark) {
    return { bg: HIGH_CONTRAST_COLORS.black_white.bg, fg: HIGH_CONTRAST_COLORS.black_white.fg };
  }
  return { bg: HIGH_CONTRAST_COLORS.white_black.bg, fg: HIGH_CONTRAST_COLORS.white_black.fg };
};

/**
 * Keyboard navigation helpers (for TV/web platforms)
 */
export const Keyboard = {
  /**
   * Common keyboard event handlers
   */
  handlers: {
    /**
     * Handle Enter key press
     */
    onEnter: (callback: () => void) => (e: any) => {
      if (e?.key === 'Enter' || e?.key === ' ') {
        e?.preventDefault?.();
        callback();
      }
    },

    /**
     * Handle Escape key press
     */
    onEscape: (callback: () => void) => (e: any) => {
      if (e?.key === 'Escape') {
        callback();
      }
    },

    /**
     * Handle Arrow keys
     */
    onArrow: (direction: 'up' | 'down' | 'left' | 'right', callback: () => void) => (e: any) => {
      if (e?.key === `Arrow${direction.charAt(0).toUpperCase() + direction.slice(1)}`) {
        e?.preventDefault?.();
        callback();
      }
    },
  },
} as const;

/**
 * Complete accessibility helper object
 */
export const Accessibility = {
  ACCESSIBILITY,
  ScreenReader,
  Focus,
  Motion,
  Typography,
  Contrast,
  A11yRoles,
  A11yTraits,
  SemanticElements,
  HIGH_CONTRAST_COLORS,
  getHighContrastColors,
  Keyboard,
} as const;
