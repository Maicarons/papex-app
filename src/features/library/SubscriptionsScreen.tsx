import { useEffect, useState } from 'react';
import { View, FlatList, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@theme/index';
import { Tag } from '@components/Tag';
import { SkeletonList } from '@components/Skeleton';
import { EmptyState } from '@components/EmptyState';
import { isDemoMode } from '@lib/config';
import { useLibraryStore } from '@stores/libraryStore';

/** Subscriptions management (docs P0): categories / authors. */
export function SubscriptionsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const subscriptions = useLibraryStore((s) => s.subscriptions);
  const load = useLibraryStore((s) => s.loadSubscriptions);
  const toggle = useLibraryStore((s) => s.toggleSubscription);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      await load();
      setLoading(false);
    })();
  }, [load]);

  if (loading) return <SkeletonList rows={4} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={subscriptions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: theme.spacing.md }}
        ListEmptyComponent={<EmptyState messageKey="library:emptySubscriptions" />}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.sm,
            }}
          >
            <View>
              <Text style={{ color: theme.colors.text }}>{item.refId}</Text>
              <Tag label={item.kind} />
            </View>
            <Pressable onPress={() => void toggle({ kind: item.kind, refId: item.refId })}>
              <Text style={{ color: theme.colors.danger }}>{t('common:delete')}</Text>
            </Pressable>
          </View>
        )}
      />
      {isDemoMode() ? <Text style={{ color: theme.colors.textMuted, textAlign: 'center', padding: 8 }}>{t('auth:demoHint')}</Text> : null}
    </View>
  );
}
