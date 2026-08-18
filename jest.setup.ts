/* Jest global setup for papex-app. */
// NOTE: `@testing-library/jest-native/extend-expect` is loaded via `setupFilesAfterEnv`
// in jest.config.js — it must NOT be imported here (setupFiles runs before `expect`
// is defined).

// react-native-mmkv ships a native module that is not available under Jest.
// We replace it with an in-memory implementation so storage tests are isolated.
jest.mock('react-native-mmkv', () => {
  class MMKV {
    private store = new Map<string, string>();
    set(key: string, value: string | number | boolean): void {
      this.store.set(key, String(value));
    }
    getString(key: string): string | undefined {
      return this.store.get(key);
    }
    getNumber(key: string): number | undefined {
      const v = this.store.get(key);
      return v === undefined ? undefined : Number(v);
    }
    getBoolean(key: string): boolean | undefined {
      const v = this.store.get(key);
      return v === undefined ? undefined : v === 'true';
    }
    delete(key: string): void {
      this.store.delete(key);
    }
    clearAll(): void {
      this.store.clear();
    }
    getAllKeys(): string[] {
      return Array.from(this.store.keys());
    }
  }
  return { MMKV, Mode: { SINGLE_PROCESS: 1 } };
});

// react-native-keychain is backed by OS secure storage; mock with in-memory map.
jest.mock('react-native-keychain', () => {
  const mem = new Map<string, { username: string; password: string }>();
  return {
    setInternetCredentials: jest.fn(async (k: string, u: string, p: string) => {
      mem.set(k, { username: u, password: p });
    }),
    getInternetCredentials: jest.fn(async (k: string) => mem.get(k)),
    resetInternetCredentials: jest.fn(async (k: string) => {
      mem.delete(k);
    }),
    __mockStore: mem,
  };
});

// Note: react-native 0.82 no longer ships `Libraries/Animated/NativeAnimatedHelper`,
// so the legacy jest mock for it is omitted. Our unit tests (tokens / client / i18n)
// are pure logic and do not import react-native Animated.
