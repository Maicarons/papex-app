import { useEffect, useState } from 'react';
import { View, FlatList, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@theme/index';
import { Button } from '@components/Button';
import { SkeletonList } from '@components/Skeleton';
import { EmptyState } from '@components/EmptyState';
import { apiClient } from '@lib/api/client';
import { Endpoints } from '@lib/api/endpoints';
import { isDemoMode } from '@lib/config';
import type { Endorsement } from '@lib/types';

/** Endorsements (docs P0/P2). GET / POST /api/endorsements. */
export function EndorsementsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [items, setItems] = useState<Endorsement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      setItems([]);
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const data = await apiClient.get<Endorsement[]>(Endpoints.endorsements);
        setItems(data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const endorse = async () => {
    if (isDemoMode()) return;
    try {
      await apiClient.post(Endpoints.endorsements, { kind: 'quality' });
      const data = await apiClient.get<Endorsement[]>(Endpoints.endorsements);
      setItems(data);
    } catch {
      /* ignore */
    }
  };

  if (loading) return <SkeletonList rows={4} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={items}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: theme.spacing.md }}
        ListEmptyComponent={<EmptyState messageKey="library:emptySubscriptions" />}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm }}>
            <Text style={{ color: theme.colors.text }}>{item.kind}</Text>
          </View>
        )}
      />
      <View style={{ padding: theme.spacing.md }}>
        <Button title={t('profile:endorse')} onPress={() => void endorse()} />
      </View>
    </View>
  );
}
