import { useEffect } from 'react';
import { View, FlatList, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@theme/index';
import { EmptyState } from '@components/EmptyState';
import { Button } from '@components/Button';
import { useLibraryStore } from '@stores/libraryStore';
import { pdfCache } from '@lib/storage/pdfCache';
import type { LibraryStackParamList } from '@app/routes';

/** Offline downloads (docs P1): list cached PDFs, open or remove. */
export function DownloadsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<import('@react-navigation/native').NavigationProp<LibraryStackParamList>>();
  const downloads = useLibraryStore((s) => s.downloads);
  const refresh = useLibraryStore((s) => s.refreshDownloads);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onRemove = async (paperId: string, version: string) => {
    await pdfCache.remove(paperId, version);
    refresh();
  };

  const fmt = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={downloads}
        keyExtractor={(d) => `${d.paperId}:${d.version}`}
        contentContainerStyle={{ padding: theme.spacing.md }}
        ListEmptyComponent={<EmptyState messageKey="library:emptyDownloads" />}
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
            <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('Reader', { paperId: item.paperId, version: item.version })}>
              <Text style={{ color: theme.colors.text }}>{item.paperId}</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.size.sm }}>
                v{item.version} · {fmt(item.size)}
              </Text>
            </Pressable>
            <Button title={t('common:delete')} variant="danger" size="sm" onPress={() => void onRemove(item.paperId, item.version)} />
          </View>
        )}
      />
    </View>
  );
}
