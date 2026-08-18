
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { HomeStack } from './HomeStack';
import { SearchStack } from './SearchStack';
import { LibraryStack } from './LibraryStack';
import { MessagesStack } from './MessagesStack';
import { ProfileStack } from './ProfileStack';
import type { AppTabsParamList } from '../routes';

const Tabs = createBottomTabNavigator<AppTabsParamList>();

export function AppTabs() {
  const { t } = useTranslation();
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="Home" component={HomeStack} options={{ title: t('common:home') }} />
      <Tabs.Screen name="Search" component={SearchStack} options={{ title: t('common:search') }} />
      <Tabs.Screen name="Library" component={LibraryStack} options={{ title: t('common:bookmarks') }} />
      <Tabs.Screen name="Messages" component={MessagesStack} options={{ title: t('common:messages') }} />
      <Tabs.Screen name="Profile" component={ProfileStack} options={{ title: t('common:profile') }} />
    </Tabs.Navigator>
  );
}
