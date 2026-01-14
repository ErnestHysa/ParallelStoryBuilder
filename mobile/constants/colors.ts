// Primary Colors
export const PRIMARY = '#6366f1'; // indigo-500
export const PRIMARY_LIGHT = '#818cf8'; // indigo-400
export const PRIMARY_DARK = '#4f46e5'; // indigo-600
export const PRIMARY_DISABLED = '#c7d2fe'; // indigo-200

// Secondary Colors
export const SECONDARY = '#ec4899'; // pink-500
export const SECONDARY_LIGHT = '#f472b6'; // pink-400
export const SECONDARY_DARK = '#db2777'; // pink-600

// Success Colors
export const SUCCESS = '#10b981'; // emerald-500
export const SUCCESS_LIGHT = '#34d399'; // emerald-400
export const SUCCESS_DARK = '#059669'; // emerald-600

// Warning Colors
export const WARNING = '#f59e0b'; // amber-500
export const WARNING_LIGHT = '#fbbf24'; // amber-400
export const WARNING_DARK = '#d97706'; // amber-600

// Error Colors
export const ERROR = '#ef4444'; // red-500
export const ERROR_LIGHT = '#f87171'; // red-400
export const ERROR_DARK = '#dc2626'; // red-600

// Info Colors
export const INFO = '#3b82f6'; // blue-500
export const INFO_LIGHT = '#60a5fa'; // blue-400
export const INFO_DARK = '#2563eb'; // blue-600

// Neutral Colors
export const WHITE = '#ffffff';
export const BLACK = '#000000';
export const GRAY_50 = '#f9fafb';
export const GRAY_100 = '#f3f4f6';
export const GRAY_200 = '#e5e7eb';
export const GRAY_300 = '#d1d5db';
export const GRAY_400 = '#9ca3af';
export const GRAY_500 = '#6b7280';
export const GRAY_600 = '#4b5563';
export const GRAY_700 = '#374151';
export const GRAY_800 = '#1f2937';
export const GRAY_900 = '#111827';

// Background Colors
export const BACKGROUND_LIGHT = '#ffffff';
export const BACKGROUND_DARK = '#111827';
export const BACKGROUND_CARD_LIGHT = '#ffffff';
export const BACKGROUND_CARD_DARK = '#1f2937';
export const BACKGROUND_SURFACE_LIGHT = '#f9fafb';
export const BACKGROUND_SURFACE_DARK = '#1f2937';

// Text Colors
export const TEXT_PRIMARY = '#111827';
export const TEXT_SECONDARY = '#6b7280';
export const TEXT_DISABLED = '#9ca3af';
export const TEXT_INVERSE = '#ffffff';

// Border Colors
export const BORDER_LIGHT = '#e5e7eb';
export const BORDER_DARK = '#374151';
export const BORDER_FOCUS = '#6366f1';

// Shadow Colors
export const SHADOW_COLOR = '#000000';
export const SHADOW_COLOR_LIGHT = 'rgba(0, 0, 0, 0.1)';
export const SHADOW_COLOR_DARK = 'rgba(0, 0, 0, 0.3)';

// Theme Palettes
export const LIGHT_THEME = {
  primary: PRIMARY,
  primaryLight: PRIMARY_LIGHT,
  primaryDark: PRIMARY_DARK,
  secondary: SECONDARY,
  success: SUCCESS,
  warning: WARNING,
  error: ERROR,
  info: INFO,
  background: BACKGROUND_LIGHT,
  surface: BACKGROUND_SURFACE_LIGHT,
  card: BACKGROUND_CARD_LIGHT,
  text: {
    primary: TEXT_PRIMARY,
    secondary: TEXT_SECONDARY,
    disabled: TEXT_DISABLED,
    inverse: TEXT_INVERSE,
  },
  border: BORDER_LIGHT,
  shadow: SHADOW_COLOR_LIGHT,
};

export const DARK_THEME = {
  primary: PRIMARY,
  primaryLight: PRIMARY_LIGHT,
  primaryDark: PRIMARY_DARK,
  secondary: SECONDARY,
  success: SUCCESS,
  warning: WARNING,
  error: ERROR,
  info: INFO,
  background: BACKGROUND_DARK,
  surface: BACKGROUND_SURFACE_DARK,
  card: BACKGROUND_CARD_DARK,
  text: {
    primary: TEXT_INVERSE,
    secondary: '#9ca3af',
    disabled: '#4b5563',
    inverse: TEXT_PRIMARY,
  },
  border: BORDER_DARK,
  shadow: SHADOW_COLOR_DARK,
};

// Brand Colors
export const BRAND_PRIMARY = '#6366f1';
export const BRAND_SECONDARY = '#ec4899';
export const BRAND_ACCENT = '#10b981';

// Gamification Colors
export const STREAK_COLORS = {
  1: '#fef3c7', // amber-100
  3: '#fde68a', // amber-200
  7: '#fcd34d', // amber-300
  14: '#fbbf24', // amber-400
  30: '#f59e0b', // amber-500
  60: '#d97706', // amber-600
  90: '#b45309', // amber-700
  120: '#92400e', // amber-800
};

// Achievement Colors
export const ACHIEVEMENT_BRONZE = '#cd7f32';
export const ACHIEVEMENT_SILVER = '#c0c0c0';
export const ACHIEVEMENT_GOLD = '#ffd700';
export const ACHIEVEMENT_PLATINUM = '#e5e4e2';

// Relationship Colors
export const CONNECTION_STRONG = '#10b981';
export const CONNECTION_MEDIUM = '#f59e0b';
export const CONNECTION_WEAK = '#ef4444';

// Accessibility Colors
export const COLORBLIND_FRIENDLY = {
  red: '#ff6b6b',
  green: '#51cf66',
  blue: '#339af0',
  yellow: '#ffd43b',
  purple: '#9775fa',
  orange: '#ff922b',
};

// Gradient Colors
export const GRADIENT_PRIMARY = ['#6366f1', '#8b5cf6'];
export const GRADIENT_SECONDARY = ['#ec4899', '#f43f5e'];
export const GRADIENT_SUCCESS = ['#10b981', '#059669'];
export const GRADIENT_WARNING = ['#f59e0b', '#d97706'];
export const GRADIENT_ERROR = ['#ef4444', '#dc2626'];

// Semantic Color Mapping
export const SEMANTIC_COLORS = {
  primary: PRIMARY,
  secondary: SECONDARY,
  success: SUCCESS,
  warning: WARNING,
  error: ERROR,
  info: INFO,
  muted: GRAY_500,
  subtle: GRAY_400,
  strong: GRAY_800,
  inverse: WHITE,
};

// Color Utility Functions
export const isLightColor = (color: string): boolean => {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

export const getContrastColor = (color: string): string => {
  return isLightColor(color) ? BLACK : WHITE;
};

export const getAccessibilityColor = (color: string): string => {
  // Check if color meets WCAG contrast requirements
  const keys = Object.keys(COLORBLIND_FRIENDLY) as Array<keyof typeof COLORBLIND_FRIENDLY>;
  return COLORBLIND_FRIENDLY[keys[Math.floor(Math.random() * keys.length)]];
};

// Export all color palettes
export const COLOR_PALETTES = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
  semantic: SEMANTIC_COLORS,
  streak: STREAK_COLORS,
  achievement: {
    bronze: ACHIEVEMENT_BRONZE,
    silver: ACHIEVEMENT_SILVER,
    gold: ACHIEVEMENT_GOLD,
    platinum: ACHIEVEMENT_PLATINUM,
  },
  connection: {
    strong: CONNECTION_STRONG,
    medium: CONNECTION_MEDIUM,
    weak: CONNECTION_WEAK,
  },
  gradients: {
    primary: GRADIENT_PRIMARY,
    secondary: GRADIENT_SECONDARY,
    success: GRADIENT_SUCCESS,
    warning: GRADIENT_WARNING,
    error: GRADIENT_ERROR,
  },
};