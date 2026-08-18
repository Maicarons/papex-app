
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthStack';
import { AppTabs } from './AppTabs';
import type { RootStackParamList } from '../routes';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator({ authed }: { authed: boolean }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {authed ? (
        <Stack.Screen name="App" component={AppTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
