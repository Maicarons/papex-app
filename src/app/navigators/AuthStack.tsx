
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '@features/auth/LoginScreen';
import { RegisterScreen } from '@features/auth/RegisterScreen';
import { AccountSwitcherScreen } from '@features/auth/AccountSwitcherScreen';
import type { AuthStackParamList } from '../routes';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: '' }} />
      <Stack.Screen name="AccountSwitcher" component={AccountSwitcherScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
