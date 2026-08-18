/**
 * i18n bootstrap (docs §8).
 *
 * - i18next + react-i18next, default language `zh` (matches the web client).
 * - Namespaces: common / auth / papers / library / messages / settings / errors.
 * - Persisted choice in MMKV (`app.lang`); system locale as fallback.
 * - All UI copy must go through `t()` — never hardcode strings in components.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import zh from './locales/zh';
import { preferences, type LangCode } from '../storage/mmkv';

export const NAMESPACES = ['common', 'auth', 'papers', 'library', 'messages', 'settings', 'errors'] as const;

function detectInitialLanguage(): LangCode {
  const saved = preferences.getLang();
  if (saved === 'zh' || saved === 'en') return saved;
  const sys = (typeof navigator !== 'undefined' ? navigator.language : '') || 'zh';
  return sys.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

let initialized = false;

export function initI18n(): typeof i18n {
  if (initialized) return i18n;
  const lng = detectInitialLanguage();
  i18n.use(initReactI18next).init({
    resources: { en, zh },
    lng,
    fallbackLng: 'zh',
    ns: NAMESPACES as unknown as string[],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });
  initialized = true;
  return i18n;
}

/** Change and persist the active language. */
export function setLanguage(lang: LangCode): void {
  preferences.setLang(lang);
  i18n.changeLanguage(lang);
}

/** Reference to the configured i18n instance. */
export { i18n };
