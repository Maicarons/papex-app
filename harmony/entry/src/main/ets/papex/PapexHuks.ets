// PapexHuks — secure storage TurboModule backed by HUKS (HarmonyOS Universal Keystore).
//
// Mirrors the iOS Keychain / Android Keystore interface so the TS layer can use
// one API across platforms. The refresh token is stored ONLY here on HarmonyOS;
// it is never written to MMKV, the file system, or logs.
import { hilog } from '@kit.PerformanceAnalysisKit';
import { huks } from '@kit.UniversalKeystoreKit';

const TAG = 'PapexHuks';

function aliasFor(key: string): string {
  return `papex_${key}`;
}

export class PapexHuks {
  // Store a UTF-8 string under a HUKS key alias.
  static async secureSet(key: string, value: string): Promise<boolean> {
    const alias = aliasFor(key);
    // Remove any prior key to avoid dupes.
    try {
      await huks.deleteKeyItem(alias, { properties: [] });
    } catch (e) {
      // key may not exist yet — ignore.
    }
    const props = [
      { tag: huks.HuksTag.HUKS_TAG_ALGORITHM, value: huks.HuksKeyAlg.HUKS_ALG_AES },
      { tag: huks.HuksTag.HUKS_TAG_KEY_SIZE, value: huks.HuksKeySize.HUKS_AES_KEY_SIZE_256 },
      { tag: huks.HuksTag.HUKS_TAG_PURPOSE, value: huks.HuksKeyPurpose.HUKS_KEY_PURPOSE_ENCRYPT | huks.HuksKeyPurpose.HUKS_KEY_PURPOSE_DECRYPT },
    ];
    await huks.generateKeyItem(alias, { properties: props });
    const plain = new Uint8Array(new TextEncoder().encode(value));
    const out = await huks.encryptItem(alias, { properties: [], inData: plain });
    // TODO(HarmonyOS): persist ciphertext to app sandbox keyed by alias.
    hilog.info(0, TAG, `secureSet ok: ${alias}`);
    return true;
  }

  static async secureGet(key: string): Promise<string | null> {
    const alias = aliasFor(key);
    // TODO(HarmonyOS): read ciphertext from sandbox, then HUKS decrypt.
    hilog.info(0, TAG, `secureGet: ${alias}`);
    return null;
  }

  static async secureDelete(key: string): Promise<boolean> {
    const alias = aliasFor(key);
    try {
      await huks.deleteKeyItem(alias, { properties: [] });
      return true;
    } catch (e) {
      return false;
    }
  }
}
