/**
 * MMKV-backed local storage.
 *
 * Holds *non-secret* data only: session pointers, account list (no tokens),
 * preferences, paper-meta cache, reading progress and the download index.
 * Secrets (access/refresh tokens) NEVER touch MMKV — see lib/security/secureStore.
 *
 * @see docs/development/papex-app.md §5.1.
 */
import { MMKV, Mode } from 'react-native-mmkv';

export const mmkv = new MMKV({ id: 'papex', mode: Mode.SINGLE_PROCESS });

export const Keys = {
  // session (pointers / sanitized metadata only)
  SESSION_ACTIVE_USER: 'app.session.activeUser',
  SESSIONS_LIST: 'app.sessions.list',
  // preferences
  LANG: 'app.lang',
  THEME: 'app.theme',
  // caches
  paperMeta: (id: string) => `app.paper.${id}.meta`,
  paperProgress: (id: string) => `app.paper.${id}.progress`,
  readingStats: 'app.reading.stats',
  downloadsIndex: 'app.downloads.index',
  pushToken: 'app.push.token',
} as const;

export type ThemeMode = 'light' | 'dark' | 'system';
export type LangCode = 'zh' | 'en';

function readJson<T>(key: string): T | null {
  const raw = mmkv.getString(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  mmkv.set(key, JSON.stringify(value));
}

export const session = {
  getActiveUserId(): string | null {
    return mmkv.getString(Keys.SESSION_ACTIVE_USER) ?? null;
  },
  setActiveUserId(userId: string | null): void {
    if (userId) mmkv.set(Keys.SESSION_ACTIVE_USER, userId);
    else mmkv.delete(Keys.SESSION_ACTIVE_USER);
  },
  getAccountList(): Array<{ userId: string; username: string; lastLoginAt: number }> {
    return readJson(Keys.SESSIONS_LIST) ?? [];
  },
  setAccountList(list: Array<{ userId: string; username: string; lastLoginAt: number }>): void {
    // Cap at 5 accounts per spec.
    writeJson(Keys.SESSIONS_LIST, list.slice(0, 5));
  },
};

export const preferences = {
  getLang(): LangCode | null {
    return (mmkv.getString(Keys.LANG) as LangCode) ?? null;
  },
  setLang(lang: LangCode): void {
    mmkv.set(Keys.LANG, lang);
  },
  getTheme(): ThemeMode {
    return (mmkv.getString(Keys.THEME) as ThemeMode) ?? 'system';
  },
  setTheme(mode: ThemeMode): void {
    mmkv.set(Keys.THEME, mode);
  },
};

export const paperCache = {
  getMeta<T>(id: string): T | null {
    return readJson<T>(Keys.paperMeta(id));
  },
  setMeta(id: string, meta: unknown): void {
    writeJson(Keys.paperMeta(id), meta);
  },
  getProgress(id: string): { page: number; percent: number; updatedAt: number } | null {
    return readJson(Keys.paperProgress(id));
  },
  setProgress(id: string, progress: { page: number; percent: number }): void {
    writeJson(Keys.paperProgress(id), { ...progress, updatedAt: Date.now() });
  },
};

export const downloads = {
  getIndex<T>(): T[] {
    return readJson<T[]>(Keys.downloadsIndex) ?? [];
  },
  setIndex<T>(index: T[]): void {
    writeJson(Keys.downloadsIndex, index);
  },
};
