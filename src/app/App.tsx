/**
 * Application root. Assembles providers in order:
 *   i18n → theme (via settingsStore) → NavigationContainer.
 * Bootstraps the persisted session then renders the appropriate navigator.
 */
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { initI18n } from '@lib/i18n';
import { useTheme } from '@theme/index';
import { useAuthStore } from '@stores/authStore';
import { RootNavigator } from './navigators/RootStack';

export function App(): React.JSX.Element {
  const theme = useTheme();
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const status = useAuthStore((s) => s.status);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initI18n();
    void bootstrap().finally(() => setReady(true));
  }, [bootstrap]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={theme.name === 'dark' ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <RootNavigator authed={status === 'authed'} />
      </NavigationContainer>
    </View>
  );
}

export default App;
