// Font Families
export const FONT_FAMILIES = {
  // System fonts
  system: {
    ios: 'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    android: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
    default: 'System',
  },

  // Display fonts (headings)
  display: {
    light: 'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    medium: 'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    semibold: 'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    bold: 'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    heavy: 'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  // Body fonts
  body: {
    regular: 'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    medium: 'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    semibold: 'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    bold: 'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  // Monospace fonts
  mono: {
    regular: 'SF Mono, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    medium: 'SF Mono, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    semibold: 'SF Mono, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    bold: 'SF Mono, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },

  // Handwriting fonts
  handwriting: {
    regular: 'Noteworthy, "Comic Sans MS", cursive',
  },

  // Custom brand fonts
  brand: {
    primary: 'Nunito, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    secondary: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
};

// Font Sizes
export const FONT_SIZES = {
  // Display sizes (for headings)
  display: {
    '4xl': 36,
    '3xl': 30,
    '2xl': 24,
    xl: 20,
    lg: 18,
  },

  // Heading sizes
  heading: {
    h1: 32,
    h2: 28,
    h3: 24,
    h4: 20,
    h5: 18,
    h6: 16,
  },

  // Text sizes
  text: {
    '2xl': 18,
    xl: 16,
    lg: 15,
    base: 14,
    sm: 13,
    xs: 12,
    '2xs': 11,
  },

  // Caption sizes
  caption: {
    base: 12,
    sm: 11,
    xs: 10,
  },

  // Label sizes
  label: {
    base: 14,
    sm: 12,
  },

  // Button sizes
  button: {
    large: 18,
    base: 16,
    small: 14,
  },
};

// Font Weights
export const FONT_WEIGHTS = {
  thin: 100,
  extraLight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extraBold: 800,
  black: 900,
};

// Font Styles
export const FONT_STYLES = {
  normal: 'normal',
  italic: 'italic',
  oblique: 'oblique',
};

// Line Heights
export const LINE_HEIGHTS = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
};

// Letter Spacing
export const LETTER_SPACING = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
};

// Text Decoration
export const TEXT_DECORATION = {
  none: 'none',
  underline: 'underline',
  lineThrough: 'line-through',
  underlineLineThrough: 'underline line-through',
};

// Text Transform
export const TEXT_TRANSFORM = {
  none: 'none',
  capitalize: 'capitalize',
  uppercase: 'uppercase',
  lowercase: 'lowercase',
};

// Text Align
export const TEXT_ALIGN = {
  left: 'left',
  center: 'center',
  right: 'right',
  justify: 'justify',
};

// Font Presets
export const FONT_PRESETS = {
  // Display styles
  display: {
    fontFamily: FONT_FAMILIES.display.semibold,
    fontSize: FONT_SIZES.display.xl,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.tighter,
  },

  // Heading styles
  heading: {
    h1: {
      fontFamily: FONT_FAMILIES.display.semibold,
      fontSize: FONT_SIZES.heading.h1,
      fontWeight: FONT_WEIGHTS.bold,
      lineHeight: LINE_HEIGHTS.tight,
    },
    h2: {
      fontFamily: FONT_FAMILIES.display.semibold,
      fontSize: FONT_SIZES.heading.h2,
      fontWeight: FONT_WEIGHTS.bold,
      lineHeight: LINE_HEIGHTS.tight,
    },
    h3: {
      fontFamily: FONT_FAMILIES.display.semibold,
      fontSize: FONT_SIZES.heading.h3,
      fontWeight: FONT_WEIGHTS.bold,
      lineHeight: LINE_HEIGHTS.tight,
    },
    h4: {
      fontFamily: FONT_FAMILIES.display.semibold,
      fontSize: FONT_SIZES.heading.h4,
      fontWeight: FONT_WEIGHTS.semibold,
      lineHeight: LINE_HEIGHTS.tight,
    },
    h5: {
      fontFamily: FONT_FAMILIES.display.medium,
      fontSize: FONT_SIZES.heading.h5,
      fontWeight: FONT_WEIGHTS.semibold,
      lineHeight: LINE_HEIGHTS.tight,
    },
    h6: {
      fontFamily: FONT_FAMILIES.display.medium,
      fontSize: FONT_SIZES.heading.h6,
      fontWeight: FONT_WEIGHTS.semibold,
      lineHeight: LINE_HEIGHTS.tight,
    },
  },

  // Text styles
  text: {
    large: {
      fontFamily: FONT_FAMILIES.body.regular,
      fontSize: FONT_SIZES.text.xl,
      fontWeight: FONT_WEIGHTS.normal,
      lineHeight: LINE_HEIGHTS.relaxed,
    },
    base: {
      fontFamily: FONT_FAMILIES.body.regular,
      fontSize: FONT_SIZES.text.base,
      fontWeight: FONT_WEIGHTS.normal,
      lineHeight: LINE_HEIGHTS.normal,
    },
    small: {
      fontFamily: FONT_FAMILIES.body.regular,
      fontSize: FONT_SIZES.text.sm,
      fontWeight: FONT_WEIGHTS.normal,
      lineHeight: LINE_HEIGHTS.normal,
    },
    caption: {
      fontFamily: FONT_FAMILIES.body.regular,
      fontSize: FONT_SIZES.caption.base,
      fontWeight: FONT_WEIGHTS.normal,
      lineHeight: LINE_HEIGHTS.normal,
    },
  },

  // Button styles
  button: {
    large: {
      fontFamily: FONT_FAMILIES.body.semibold,
      fontSize: FONT_SIZES.button.large,
      fontWeight: FONT_WEIGHTS.semibold,
      lineHeight: LINE_HEIGHTS.tight,
      letterSpacing: LETTER_SPACING.tighter,
      textTransform: TEXT_TRANSFORM.uppercase,
    },
    base: {
      fontFamily: FONT_FAMILIES.body.semibold,
      fontSize: FONT_SIZES.button.base,
      fontWeight: FONT_WEIGHTS.semibold,
      lineHeight: LINE_HEIGHTS.tight,
      letterSpacing: LETTER_SPACING.tighter,
      textTransform: TEXT_TRANSFORM.uppercase,
    },
    small: {
      fontFamily: FONT_FAMILIES.body.semibold,
      fontSize: FONT_SIZES.button.small,
      fontWeight: FONT_WEIGHTS.semibold,
      lineHeight: LINE_HEIGHTS.tight,
      letterSpacing: LETTER_SPACING.tighter,
      textTransform: TEXT_TRANSFORM.uppercase,
    },
  },

  // Input styles
  input: {
    default: {
      fontFamily: FONT_FAMILIES.body.regular,
      fontSize: FONT_SIZES.text.base,
      fontWeight: FONT_WEIGHTS.normal,
      lineHeight: LINE_HEIGHTS.normal,
    },
  },

  // Label styles
  label: {
    default: {
      fontFamily: FONT_FAMILIES.body.medium,
      fontSize: FONT_SIZES.label.base,
      fontWeight: FONT_WEIGHTS.medium,
      lineHeight: LINE_HEIGHTS.tight,
      letterSpacing: LETTER_SPACING.tighter,
      textTransform: TEXT_TRANSFORM.capitalize,
    },
  },
};

// Typography Theme
export const TYPOGRAPHY_THEME = {
  light: {
    ...FONT_PRESETS,
    colors: {
      primary: '#111827',
      secondary: '#6b7280',
      disabled: '#9ca3af',
      inverse: '#ffffff',
    },
  },
  dark: {
    ...FONT_PRESETS,
    colors: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
      disabled: '#4b5563',
      inverse: '#111827',
    },
  },
};

// Font Helper Functions
export const getFontStyle = (preset: keyof typeof FONT_PRESETS, variant?: string) => {
  const presetValue = FONT_PRESETS[preset];
  if (variant && typeof presetValue === 'object' && variant in presetValue) {
    return (presetValue as any)[variant];
  }
  return presetValue;
};

export const createFontFamily = (fontFamily: string, platform?: 'ios' | 'android' | 'web') => {
  const plat = platform || 'ios';
  return fontFamily.includes(',') ? fontFamily : FONT_FAMILIES.system[plat as 'ios' | 'android'] || fontFamily;
};

export const scaleFontSize = (fontSize: number, scaleFactor: number): number => {
  return Math.round(fontSize * scaleFactor);
};

// Responsive Font Sizes
export const RESPONSIVE_FONT_SIZES = {
  xs: {
    display: FONT_SIZES.display['2xl'],
    heading: FONT_SIZES.heading.h4,
    text: FONT_SIZES.text.base,
    caption: FONT_SIZES.caption.sm,
  },
  sm: {
    display: FONT_SIZES.display['3xl'],
    heading: FONT_SIZES.heading.h3,
    text: FONT_SIZES.text.lg,
    caption: FONT_SIZES.caption.base,
  },
  md: {
    display: FONT_SIZES.display.xl,
    heading: FONT_SIZES.heading.h2,
    text: FONT_SIZES.text.xl,
    caption: FONT_SIZES.caption.base,
  },
  lg: {
    display: FONT_SIZES.display['4xl'],
    heading: FONT_SIZES.heading.h1,
    text: FONT_SIZES.text['2xl'],
    caption: FONT_SIZES.caption.base,
  },
};