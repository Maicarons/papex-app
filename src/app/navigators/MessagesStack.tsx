
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InboxScreen } from '@features/messages/InboxScreen';
import { TicketsScreen } from '@features/messages/TicketsScreen';
import { FeedbackScreen } from '@features/messages/FeedbackScreen';
import type { MessagesStackParamList } from '../routes';

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export function MessagesStack() {
  return (
    <Stack.Navigator initialRouteName="Inbox">
      <Stack.Screen name="Inbox" component={InboxScreen} options={{ title: '' }} />
      <Stack.Screen name="Tickets" component={TicketsScreen} options={{ title: '' }} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
