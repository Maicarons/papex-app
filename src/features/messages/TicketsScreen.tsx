import { useEffect, useState } from 'react';
import { View, FlatList, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@theme/index';
import { SkeletonList } from '@components/Skeleton';
import { EmptyState } from '@components/EmptyState';
import { apiClient } from '@lib/api/client';
import { Endpoints } from '@lib/api/endpoints';
import { isDemoMode } from '@lib/config';
import type { Ticket } from '@lib/types';

/** Support tickets (docs P0). */
export function TicketsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      setTickets([]);
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const data = await apiClient.get<Ticket[]>(Endpoints.tickets);
        setTickets(data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <SkeletonList rows={4} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={tickets}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ padding: theme.spacing.md }}
        ListEmptyComponent={<EmptyState messageKey="library:emptySubscriptions" />}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.text }}>{item.subject}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.size.sm }}>
              {t('messages:ticketStatus')}: {item.status}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
