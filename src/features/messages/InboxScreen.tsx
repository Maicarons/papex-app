import { useEffect, useState } from 'react';
import { View, FlatList, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@theme/index';
import { SkeletonList } from '@components/Skeleton';
import { EmptyState } from '@components/EmptyState';
import { apiClient } from '@lib/api/client';
import { Endpoints } from '@lib/api/endpoints';
import { isDemoMode } from '@lib/config';
import type { Message } from '@lib/types';

/** In-app messages (docs P0). */
export function InboxScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      setMessages([]);
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const data = await apiClient.get<Message[]>(Endpoints.messages);
        setMessages(data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <SkeletonList rows={5} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: theme.spacing.md }}
        ListEmptyComponent={<EmptyState messageKey="library:emptyBookmarks" />}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: item.read ? theme.colors.surface : theme.colors.surfaceMuted,
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.sm,
            }}
          >
            <Text style={{ color: theme.colors.text, fontWeight: theme.font.weight.medium }}>{item.title}</Text>
            <Text style={{ color: theme.colors.textMuted }}>{item.body}</Text>
            {!item.read ? (
              <Pressable onPress={() => setMessages((prev) => prev.map((m) => (m.id === item.id ? { ...m, read: true } : m)))}>
                <Text style={{ color: theme.colors.primary, marginTop: 4 }}>{t('messages:markRead')}</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}
