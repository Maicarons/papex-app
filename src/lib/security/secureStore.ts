/**
 * `secureStore` — the ONLY place a refresh token may live.
 *
 * Abstraction over OS secure storage:
 *   - iOS      → Keychain (via react-native-keychain, AfterFirstUnlock, no iCloud)
 *   - Android  → Keystore + EncryptedSharedPreferences (via react-native-keychain)
 *   - HarmonyOS→ HUKS (via the ArkTS TurboModule bridge `PapexHuks`)
 *
 * The access token is also kept here. NEVER write tokens to MMKV / AsyncStorage
 * / the file system / logs. See docs/development/papex-app.md §7.6.
 *
 * The client code only depends on the `SecureStore` interface, so tests and
 * mock layers can inject an in-memory implementation.
 */
import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';

export interface SecureStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

const SERVICE = 'com.papex.secure';

/** iOS / Android implementation backed by react-native-keychain. */
class KeychainSecureStore implements SecureStore {
  async get(key: string): Promise<string | null> {
    const creds = await Keychain.getInternetCredentials(`${SERVICE}.${key}`);
    // react-native-keychain returns false (not null) when nothing is stored.
    if (!creds || (creds as unknown as boolean) === false) return null;
    return creds.password ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await Keychain.setInternetCredentials(`${SERVICE}.${key}`, 'papex', value, {
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      // Android: avoid cloud backup / auto-sync of credentials.
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
    });
  }

  async delete(key: string): Promise<void> {
    await Keychain.resetInternetCredentials(`${SERVICE}.${key}`);
  }
}

/** Shape of the RNOH TurboModule bridge registered as `PapexHuks`. */
interface HuksBridge {
  secureSet(key: string, value: string): Promise<boolean>;
  secureGet(key: string): Promise<string | null>;
  secureDelete(key: string): Promise<boolean>;
}

/** HarmonyOS implementation backed by the HUKS ArkTS bridge. */
class HuksSecureStore implements SecureStore {
  private get bridge(): HuksBridge {
    // The bridge is registered by the RNOH TurboModule `PapexHuks`.
    const nativeModules = (globalThis as Record<string, unknown>).NativeModules as
      | { PapexHuks?: HuksBridge }
      | undefined;
    const mod = nativeModules?.PapexHuks;
    if (!mod) {
      throw new Error('PapexHuks native bridge is not available on this build.');
    }
    return mod;
  }

  async get(key: string): Promise<string | null> {
    return this.bridge.secureGet(key);
  }
  async set(key: string, value: string): Promise<void> {
    await this.bridge.secureSet(key, value);
  }
  async delete(key: string): Promise<void> {
    await this.bridge.secureDelete(key);
  }
}

/** In-memory store used for tests and as a safe fallback when native is absent. */
export class MemorySecureStore implements SecureStore {
  private map = new Map<string, string>();
  async get(key: string): Promise<string | null> {
    return this.map.get(key) ?? null;
  }
  async set(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }
  async delete(key: string): Promise<void> {
    this.map.delete(key);
  }
}

function createDefaultStore(): SecureStore {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return new KeychainSecureStore();
  }
  // HarmonyOS reports Platform.OS === 'harmonyos' under RNOH.
  return new HuksSecureStore();
}

/** Singleton used by the app. Replace `setSecureStore` only in tests. */
export const secureStore: SecureStore = createDefaultStore();

let override: SecureStore | null = null;
export function setSecureStore(store: SecureStore | null): void {
  override = store;
}
export function getSecureStore(): SecureStore {
  return override ?? secureStore;
}
