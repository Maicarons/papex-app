
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SearchScreen } from '@features/papers/SearchScreen';
import { PaperDetailScreen } from '@features/papers/PaperDetailScreen';
import { ReaderScreen } from '@features/papers/ReaderScreen';
import type { SearchStackParamList } from '../routes';

const Stack = createNativeStackNavigator<SearchStackParamList>();

export function SearchStack() {
  return (
    <Stack.Navigator initialRouteName="Search">
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: '' }} />
      <Stack.Screen name="PaperDetail" component={PaperDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="Reader" component={ReaderScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
