
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LibraryScreen } from '@features/library/LibraryScreen';
import { BookmarksScreen } from '@features/library/BookmarksScreen';
import { SubscriptionsScreen } from '@features/library/SubscriptionsScreen';
import { DownloadsScreen } from '@features/library/DownloadsScreen';
import { PaperDetailScreen } from '@features/papers/PaperDetailScreen';
import { ReaderScreen } from '@features/papers/ReaderScreen';
import type { LibraryStackParamList } from '../routes';

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export function LibraryStack() {
  return (
    <Stack.Navigator initialRouteName="LibraryHome">
      <Stack.Screen name="LibraryHome" component={LibraryScreen} options={{ title: '' }} />
      <Stack.Screen name="Bookmarks" component={BookmarksScreen} options={{ title: '' }} />
      <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} options={{ title: '' }} />
      <Stack.Screen name="Downloads" component={DownloadsScreen} options={{ title: '' }} />
      <Stack.Screen name="PaperDetail" component={PaperDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="Reader" component={ReaderScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
