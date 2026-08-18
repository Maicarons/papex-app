/**
 * Runtime configuration.
 *
 * React Native does not expose `.env` at runtime by default. In a real build
 * these values are injected via a Metro `global` transform (see docs). For the
 * committed tree we read from an optional global injected at build time and
 * fall back to safe defaults so the app is runnable without extra tooling.
 */
type RuntimeConfig = {
  API_BASE_URL: string;
  PUSH_ENABLED: boolean;
  I18N_FALLBACK: 'zh' | 'en';
  API_DEBUG: boolean;
  API_DEMO_MODE: boolean;
  PAPEX_API_KEY: string;
};

const injected = (typeof globalThis !== 'undefined'
  ? (globalThis as Record<string, unknown>).__PAPEX_CONFIG__
  : undefined) as Partial<RuntimeConfig> | undefined;

const defaults: RuntimeConfig = {
  API_BASE_URL: 'https://api.papex.example.com',
  PUSH_ENABLED: true,
  I18N_FALLBACK: 'zh',
  API_DEBUG: false,
  API_DEMO_MODE: false,
  PAPEX_API_KEY: '',
};

export const config: RuntimeConfig = {
  API_BASE_URL: injected?.API_BASE_URL ?? defaults.API_BASE_URL,
  PUSH_ENABLED: injected?.PUSH_ENABLED ?? defaults.PUSH_ENABLED,
  I18N_FALLBACK: injected?.I18N_FALLBACK ?? defaults.I18N_FALLBACK,
  API_DEBUG: injected?.API_DEBUG ?? defaults.API_DEBUG,
  API_DEMO_MODE: injected?.API_DEMO_MODE ?? defaults.API_DEMO_MODE,
  PAPEX_API_KEY: injected?.PAPEX_API_KEY ?? defaults.PAPEX_API_KEY,
};

export const isDemoMode = (): boolean => config.API_DEMO_MODE;
