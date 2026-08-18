/**
 * Theme provider hook. Resolves the active theme from settingsStore (light /
 * dark / system) and the OS appearance, exposing tokens to components.
 */
import { useColorScheme, type ColorSchemeName } from 'react-native';
import { useSettingsStore } from '@stores/settingsStore';
import { themes, type Theme, type ThemeName } from './tokens';

export function resolveThemeName(pref: 'light' | 'dark' | 'system', system: ColorSchemeName): ThemeName {
  if (pref === 'system') return system === 'dark' ? 'dark' : 'light';
  return pref;
}

export function useTheme(): Theme {
  const pref = useSettingsStore((s) => s.theme);
  const system = useColorScheme();
  const name = resolveThemeName(pref, system);
  return themes[name];
}

export * from './tokens';
