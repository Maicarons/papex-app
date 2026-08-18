
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedScreen } from '@features/papers/FeedScreen';
import { CategoriesScreen } from '@features/papers/CategoriesScreen';
import { PaperDetailScreen } from '@features/papers/PaperDetailScreen';
import { ReaderScreen } from '@features/papers/ReaderScreen';
import { CommentsScreen } from '@features/papers/CommentsScreen';
import type { HomeStackParamList } from '../routes';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator initialRouteName="Feed">
      <Stack.Screen name="Feed" component={FeedScreen} options={{ title: '' }} />
      <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: '' }} />
      <Stack.Screen name="PaperDetail" component={PaperDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="Reader" component={ReaderScreen} options={{ title: '' }} />
      <Stack.Screen name="Comments" component={CommentsScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
