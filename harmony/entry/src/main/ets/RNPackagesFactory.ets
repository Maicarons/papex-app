// RNPackagesFactory — registers the third-party RN packages used by papex-app.
import type { RNPackageContext, RNPackage } from '@rnoh/react-native-openharmony/ts';
import { createRNPackage } from '@rnoh/react-native-openharmony';

// TODO(RNOH): register react-native-mmkv / react-native-pdf / react-native-keychain
// HarmonyOS adapters here once their 0.82.x compatible builds are available.
// The refresh token never leaves secure storage — see PapexSecureStorage below.
export function samplePackageList(ctx: RNPackageContext): RNPackage[] {
  return [
    createRNPackage(ctx),
  ];
}
