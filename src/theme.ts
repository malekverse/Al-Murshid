export interface ThemeColors {
  bg: string;
  bgCard: string;
  bgSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentLight: string;
  border: string;
  danger: string;
  dangerBg: string;
}

export const darkTheme: ThemeColors = {
  bg: '#030712',
  bgCard: '#064e3b',
  bgSecondary: '#022c22',
  text: '#ecfdf5',
  textSecondary: '#a7f3d0',
  textMuted: '#6ee7b7',
  accent: '#10b981',
  accentLight: '#34d399',
  border: '#065f46',
  danger: '#ef4444',
  dangerBg: '#450a0a',
};

export const lightTheme: ThemeColors = {
  bg: '#f0fdf4',
  bgCard: '#ffffff',
  bgSecondary: '#d1fae5',
  text: '#022c22',
  textSecondary: '#065f46',
  textMuted: '#047857',
  accent: '#059669',
  accentLight: '#10b981',
  border: '#a7f3d0',
  danger: '#dc2626',
  dangerBg: '#fce4ec',
};
