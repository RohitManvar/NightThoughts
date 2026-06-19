// Editorial theme — warm paper tones, hairline borders, serif-italic accents.
// Two palettes: light (day) and a warm "paper-dark" (night).

export type ThemeColors = {
  bg: string;
  card: string;
  cardSoft: string;
  border: string;
  accent: string;
  /** Text/icon color used on top of `accent` backgrounds. */
  accentFg: string;
  accentSoft: string;
  accentGlow: string;
  danger: string;
  text: string;
  textDim: string;
  textFaint: string;
};

export const lightColors: ThemeColors = {
  bg: '#F7F5F0',
  card: '#FFFFFF',
  cardSoft: '#F0EEE6',
  border: '#E5E2D8',
  accent: '#141414',
  accentFg: '#FFFFFF',
  accentSoft: '#F0EEE6',
  accentGlow: '#E9E6DC',
  danger: '#E5484D',
  text: '#141414',
  textDim: '#6E6C64',
  textFaint: '#A9A69C',
};

export const darkColors: ThemeColors = {
  bg: '#15140F',
  card: '#1D1C16',
  cardSoft: '#26241E',
  border: '#34322A',
  accent: '#F2F0E9',
  accentFg: '#15140F',
  accentSoft: '#26241E',
  accentGlow: '#34322A',
  danger: '#FF6B6B',
  text: '#F2F0E9',
  textDim: '#A8A599',
  textFaint: '#6B6960',
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  full: 999,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 36,
};
