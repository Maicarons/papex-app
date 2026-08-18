// EntryAbility — RNOH host ability for HarmonyOS.
import { AbilityConstant, UIAbility, Want } from '@kit.AbilityKit';
import { RNOHAppContext, RNOHInstance } from '@rnoh/react-native-openharmony';
import { samplePackageList } from '../RNPackagesFactory';

export default class EntryAbility extends UIAbility {
  private rnoHAppContext?: RNOHAppContext;
  private rnohInstance?: RNOHInstance;

  // Lazily created so the bundle is only loaded when the ability starts.
  private createRNOHInstance() {
    if (!this.rnoHAppContext) {
      this.rnoHAppContext = new RNOHAppContext({
        createRNPackages: samplePackageList,
        enableNDK: true,
        // Papex custom TurboModule: secure storage backed by HUKS.
        turbolModule: [],
      });
    }
    this.rnohInstance = this.rnoHAppContext.createRNOHInstance({});
    return this.rnohInstance;
  }

  onAbilityCreate(want: Want): void {
    // No-op; RN surface is mounted by the ArkUI page.
  }

  onWindowStageCreate(want: Want): void {
    // The RN content is rendered by Index.ets via <RNOHArchitecture>.
  }

  onDestroy(): void {
    this.rnohInstance?.destroy();
  }
}
