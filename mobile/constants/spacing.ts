// Base spacing unit (8px)
export const BASE_UNIT = 8;

// Padding
export const PADDING_XS = BASE_UNIT * 0.5; // 4px
export const PADDING_SM = BASE_UNIT * 1; // 8px
export const PADDING_MD = BASE_UNIT * 1.5; // 12px
export const PADDING_LG = BASE_UNIT * 2; // 16px
export const PADDING_XL = BASE_UNIT * 3; // 24px
export const PADDING_2XL = BASE_UNIT * 4; // 32px
export const PADDING_3XL = BASE_UNIT * 6; // 48px
export const PADDING_4XL = BASE_UNIT * 8; // 64px
export const PADDING_5XL = BASE_UNIT * 12; // 96px

// Margin
export const MARGIN_XS = BASE_UNIT * 0.5; // 4px
export const MARGIN_SM = BASE_UNIT * 1; // 8px
export const MARGIN_MD = BASE_UNIT * 1.5; // 12px
export const MARGIN_LG = BASE_UNIT * 2; // 16px
export const MARGIN_XL = BASE_UNIT * 3; // 24px
export const MARGIN_2XL = BASE_UNIT * 4; // 32px
export const MARGIN_3XL = BASE_UNIT * 6; // 48px
export const MARGIN_4XL = BASE_UNIT * 8; // 64px
export const MARGIN_5XL = BASE_UNIT * 12; // 96px

// Gap
export const GAP_XS = BASE_UNIT * 0.5; // 4px
export const GAP_SM = BASE_UNIT * 1; // 8px
export const GAP_MD = BASE_UNIT * 1.5; // 12px
export const GAP_LG = BASE_UNIT * 2; // 16px
export const GAP_XL = BASE_UNIT * 3; // 24px
export const GAP_2XL = BASE_UNIT * 4; // 32px
export const GAP_3XL = BASE_UNIT * 6; // 48px

// Border Radius
export const BORDER_RADIUS_XS = BASE_UNIT * 0.5; // 4px
export const BORDER_RADIUS_SM = BASE_UNIT * 1; // 8px
export const BORDER_RADIUS_MD = BASE_UNIT * 1.5; // 12px
export const BORDER_RADIUS_LG = BASE_UNIT * 2; // 16px
export const BORDER_RADIUS_XL = BASE_UNIT * 3; // 24px
export const BORDER_RADIUS_2XL = BASE_UNIT * 4; // 32px
export const BORDER_RADIUS_3XL = BASE_UNIT * 6; // 48px
export const BORDER_RADIUS_FULL = 9999; // For circular elements

// Shadow Spacing
export const SHADOW_OFFSET_XS = 0;
export const SHADOW_OFFSET_SM = BASE_UNIT * 0.25; // 2px
export const SHADOW_OFFSET_MD = BASE_UNIT * 0.5; // 4px
export const SHADOW_OFFSET_LG = BASE_UNIT * 1; // 8px
export const SHADOW_OFFSET_XL = BASE_UNIT * 2; // 16px

// Icon Sizes
export const ICON_SIZE_XS = BASE_UNIT * 1; // 8px
export const ICON_SIZE_SM = BASE_UNIT * 1.5; // 12px
export const ICON_SIZE_MD = BASE_UNIT * 2; // 16px
export const ICON_SIZE_LG = BASE_UNIT * 3; // 24px
export const ICON_SIZE_XL = BASE_UNIT * 4; // 32px
export const ICON_SIZE_2XL = BASE_UNIT * 6; // 48px
export const ICON_SIZE_3XL = BASE_UNIT * 8; // 64px

// Line Heights
export const LINE_HEIGHT_TIGHT = 1.25;
export const LINE_HEIGHT_SNUG = 1.375;
export const LINE_HEIGHT_NORMAL = 1.5;
export const LINE_HEIGHT_RELAXED = 1.625;
export const LINE_HEIGHT_LOOSE = 2;

// Letter Spacing
export const LETTER_TIGHTER = '-0.05em';
export const LETTER_TIGHT = '-0.025em';
export const LETTER_NORMAL = '0em';
export const LETTER_WIDE = '0.025em';
export const LETTER_WIDER = '0.05em';

// Component Spacing Presets
export const SPACING = {
  // Container spacing
  container: {
    padding: PADDING_LG,
    horizontal: PADDING_LG,
    vertical: PADDING_XL,
  },

  // Card spacing
  card: {
    padding: PADDING_LG,
    margin: MARGIN_MD,
    borderRadius: BORDER_RADIUS_LG,
  },

  // Button spacing
  button: {
    paddingVertical: PADDING_SM,
    paddingHorizontal: PADDING_LG,
    borderRadius: BORDER_RADIUS_MD,
    minHeight: BASE_UNIT * 8, // 64px
  },

  // Input spacing
  input: {
    padding: PADDING_MD,
    borderRadius: BORDER_RADIUS_SM,
    borderWidth: 1,
  },

  // List spacing
  list: {
    itemPadding: PADDING_LG,
    itemMargin: 0,
    dividerMargin: MARGIN_SM,
  },

  // Modal spacing
  modal: {
    padding: PADDING_2XL,
    borderRadius: BORDER_RADIUS_XL,
  },

  // Navigation spacing
  navigation: {
    bottomBarHeight: BASE_UNIT * 16, // 128px
    tabBarHeight: BASE_UNIT * 14, // 112px
    headerHeight: BASE_UNIT * 12, // 96px
  },

  // Grid spacing
  grid: {
    gap: GAP_LG,
    columnGap: GAP_LG,
    rowGap: GAP_LG,
  },

  // Form spacing
  form: {
    labelMarginBottom: MARGIN_SM,
    inputMarginBottom: MARGIN_LG,
    errorMarginTop: MARGIN_XS,
  },

  // Card grid
  cardGrid: {
    gap: GAP_LG,
    columns: 2,
  },
};

// Responsive Spacing
export const RESPONSIVE_SPACING = {
  xs: {
    padding: PADDING_SM,
    margin: MARGIN_SM,
    gap: GAP_SM,
  },
  sm: {
    padding: PADDING_MD,
    margin: MARGIN_MD,
    gap: GAP_MD,
  },
  md: {
    padding: PADDING_LG,
    margin: MARGIN_LG,
    gap: GAP_LG,
  },
  lg: {
    padding: PADDING_XL,
    margin: MARGIN_XL,
    gap: GAP_XL,
  },
  xl: {
    padding: PADDING_2XL,
    margin: MARGIN_2XL,
    gap: GAP_2XL,
  },
};

// Custom spacing utilities
export const spacing = (value: number): number => BASE_UNIT * value;

export const createSpacing = (values: number | number[]) => {
  if (typeof values === 'number') {
    return spacing(values);
  }
  return values.map(value => spacing(value));
};

// Predefined spacing combinations
export const SPACING_PRESETS = {
  none: 0,
  xs: BASE_UNIT * 0.5, // 4px
  sm: BASE_UNIT * 1, // 8px
  md: BASE_UNIT * 1.5, // 12px
  lg: BASE_UNIT * 2, // 16px
  xl: BASE_UNIT * 3, // 24px
  '2xl': BASE_UNIT * 4, // 32px
  '3xl': BASE_UNIT * 6, // 48px
  '4xl': BASE_UNIT * 8, // 64px
  '5xl': BASE_UNIT * 12, // 96px
  '6xl': BASE_UNIT * 16, // 128px
  '7xl': BASE_UNIT * 20, // 160px
  '8xl': BASE_UNIT * 24, // 192px
  full: 9999,
};