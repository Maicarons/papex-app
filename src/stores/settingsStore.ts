/**
 * settingsStore — language, theme, biometric unlock, push preference.
 * Persisted via MMKV (docs §5.1). Changing language calls the i18n setter.
 */
import { create } from 'zustand';
import { preferences, type LangCode, type ThemeMode } from '@lib/storage/mmkv';
import { setLanguage as applyLanguage } from '@lib/i18n';

interface SettingsState {
  lang: LangCode;
  theme: ThemeMode;
  biometric: boolean;
  pushEnabled: boolean;
  setLang: (lang: LangCode) => void;
  setTheme: (theme: ThemeMode) => void;
  setBiometric: (on: boolean) => void;
  setPushEnabled: (on: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  lang: preferences.getLang() ?? 'zh',
  theme: preferences.getTheme(),
  biometric: false,
  pushEnabled: true,

  setLang: (lang) => {
    preferences.setLang(lang);
    applyLanguage(lang);
    set({ lang });
  },
  setTheme: (theme) => {
    preferences.setTheme(theme);
    set({ theme });
  },
  setBiometric: (on) => set({ biometric: on }),
  setPushEnabled: (on) => set({ pushEnabled: on }),
}));
