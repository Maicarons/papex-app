// Index — ArkUI page that hosts the React Native surface.
import { RNOHApp, RNApp, RNOHArchitecture } from '@rnoh/react-native-openharmony';

@Entry
@Component
struct Index {
  @State message: string = 'Papex';

  build() {
    Column() {
      RNOHApp({ appKey: 'papex' })
    }
    .width('100%')
    .height('100%')
  }
}
