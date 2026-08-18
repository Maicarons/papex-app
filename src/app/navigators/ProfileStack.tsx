
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '@features/profile/ProfileScreen';
import { EndorsementsScreen } from '@features/profile/EndorsementsScreen';
import { EditProfileScreen } from '@features/profile/EditProfileScreen';
import { StatsScreen } from '@features/profile/StatsScreen';
import { DeviceManagementScreen } from '@features/auth/DeviceManagementScreen';
import { SettingsScreen } from '@features/settings/SettingsScreen';
import { LanguageScreen } from '@features/settings/LanguageScreen';
import { ThemeScreen } from '@features/settings/ThemeScreen';
import { AccountScreen } from '@features/settings/AccountScreen';
import { PushScreen } from '@features/settings/PushScreen';
import { AboutScreen } from '@features/settings/AboutScreen';
import { PaperDetailScreen } from '@features/papers/PaperDetailScreen';
import type { ProfileStackParamList } from '../routes';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator initialRouteName="Profile">
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: '' }} />
      <Stack.Screen name="Endorsements" component={EndorsementsScreen} options={{ title: '' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: '' }} />
      <Stack.Screen name="Stats" component={StatsScreen} options={{ title: '' }} />
      <Stack.Screen name="DeviceManagement" component={DeviceManagementScreen} options={{ title: '' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '' }} />
      <Stack.Screen name="Language" component={LanguageScreen} options={{ title: '' }} />
      <Stack.Screen name="Theme" component={ThemeScreen} options={{ title: '' }} />
      <Stack.Screen name="Account" component={AccountScreen} options={{ title: '' }} />
      <Stack.Screen name="Push" component={PushScreen} options={{ title: '' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: '' }} />
      <Stack.Screen name="PaperDetail" component={PaperDetailScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
