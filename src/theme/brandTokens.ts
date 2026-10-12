import { alpha, darken } from '@mui/material/styles';

// Locked colors: NUTALIG CI / Brand Refresh Active Source Rev.03, page 7.
export const BRAND_COLORS = {
  ivory: '#F7F3EE',
  green: '#1F3F37',
  sand: '#D4C5BA',
  terracotta: '#925944',
  charcoal: '#30302F'
};

// UI states use shades of the brand colors. Error/warning colors retain their meaning.
export const SEMANTIC_COLORS = {
  success: BRAND_COLORS.green,
  info: BRAND_COLORS.green,
  warning: '#9A651B',
  error: '#DC1B0D'
};

export const BRAND_UI = {
  surface: '#FFFFFF',
  greenTint: alpha(BRAND_COLORS.green, 0.08),
  greenSelected: alpha(BRAND_COLORS.green, 0.14),
  terracottaTint: alpha(BRAND_COLORS.terracotta, 0.1),
  sandTint: alpha(BRAND_COLORS.sand, 0.32),
  mutedText: alpha(BRAND_COLORS.charcoal, 0.7),
  disabledText: alpha(BRAND_COLORS.charcoal, 0.5),
  greenHover: darken(BRAND_COLORS.green, 0.15),
  terracottaHover: darken(BRAND_COLORS.terracotta, 0.15),
  errorHover: darken(SEMANTIC_COLORS.error, 0.15)
};

// Legacy button classes and CSS modules share the same tokens as both MUI themes.
export const BRAND_CSS_VARIABLES: Record<string, string> = {
  '--nutalig-ivory': BRAND_COLORS.ivory,
  '--nutalig-green': BRAND_COLORS.green,
  '--nutalig-sand': BRAND_COLORS.sand,
  '--nutalig-terracotta': BRAND_COLORS.terracotta,
  '--nutalig-charcoal': BRAND_COLORS.charcoal,
  '--nutalig-green-hover': BRAND_UI.greenHover,
  '--nutalig-terracotta-hover': BRAND_UI.terracottaHover,
  '--nutalig-green-tint': BRAND_UI.greenTint,
  '--nutalig-green-selected': BRAND_UI.greenSelected,
  '--nutalig-terracotta-tint': BRAND_UI.terracottaTint,
  '--nutalig-sand-tint': BRAND_UI.sandTint,
  '--nutalig-muted-text': BRAND_UI.mutedText,
  '--nutalig-disabled-text': BRAND_UI.disabledText,
  '--nutalig-error': SEMANTIC_COLORS.error,
  '--nutalig-error-hover': BRAND_UI.errorHover
};
