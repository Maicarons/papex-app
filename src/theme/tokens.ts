/**
 * Design tokens — light and dark palettes, sourced to align with the Papex web
 * client. Components consume these via `useTheme()` (docs §4.2, §8).
 */
import type { TextStyle } from 'react-native';

export type ThemeName = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryForeground: string;
  danger: string;
  success: string;
  warning: string;
  skeleton: string;
}

export interface Theme {
  name: ThemeName;
  colors: ThemeColors;
  radius: { sm: number; md: number; lg: number };
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number };
  font: { size: { sm: number; md: number; lg: number; xl: number }; weight: { regular: TextStyle['fontWeight']; medium: TextStyle['fontWeight']; bold: TextStyle['fontWeight'] } };
}

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    background: '#FFFFFF',
    surface: '#F7F8FA',
    surfaceMuted: '#EEF1F5',
    border: '#E2E6EB',
    text: '#1A1F29',
    textMuted: '#6B7280',
    primary: '#2563EB',
    primaryForeground: '#FFFFFF',
    danger: '#DC2626',
    success: '#16A34A',
    warning: '#D97706',
    skeleton: '#E5E7EB',
  },
  radius: { sm: 6, md: 10, lg: 16 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  font: {
    size: { sm: 12, md: 14, lg: 18, xl: 22 },
    weight: { regular: 400, medium: 500, bold: 700 },
  },
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: '#0E1116',
    surface: '#161B22',
    surfaceMuted: '#1F2630',
    border: '#2A313C',
    text: '#E6EAF0',
    textMuted: '#9AA4B2',
    primary: '#3B82F6',
    primaryForeground: '#FFFFFF',
    danger: '#F87171',
    success: '#4ADE80',
    warning: '#FBBF24',
    skeleton: '#232A33',
  },
  radius: lightTheme.radius,
  spacing: lightTheme.spacing,
  font: lightTheme.font,
};

export const themes: Record<ThemeName, Theme> = { light: lightTheme, dark: darkTheme };
