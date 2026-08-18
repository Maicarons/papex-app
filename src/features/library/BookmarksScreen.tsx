import { useEffect, useState } from 'react';
import { View, FlatList, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@theme/index';
import { PaperCard } from '@components/PaperCard';
import { SkeletonList } from '@components/Skeleton';
import { EmptyState } from '@components/EmptyState';
import { apiClient } from '@lib/api/client';
import { Endpoints } from '@lib/api/endpoints';
import { isDemoMode } from '@lib/config';
import { useLibraryStore } from '@stores/libraryStore';
import type { Paper } from '@lib/types';
import type { LibraryStackParamList } from '@app/routes';

/** Bookmarked papers (docs P0). */
export function BookmarksScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<import('@react-navigation/native').NavigationProp<LibraryStackParamList>>();
  const bookmarks = useLibraryStore((s) => s.bookmarks);
  const loadBookmarks = useLibraryStore((s) => s.loadBookmarks);
  const toggleBookmark = useLibraryStore((s) => s.toggleBookmark);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      await loadBookmarks();
      if (isDemoMode() || bookmarks.length === 0) {
        setPapers([]);
        setLoading(false);
        return;
      }
      try {
        const list = await Promise.all(
          bookmarks.map((id) => apiClient.get<Paper>(Endpoints.papers.detail(id)).catch(() => null)),
        );
        setPapers(list.filter(Boolean) as Paper[]);
      } finally {
        setLoading(false);
      }
    })();
  }, [bookmarks, loadBookmarks]);

  if (loading) return <SkeletonList rows={5} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={papers}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: theme.spacing.md }}
        ListEmptyComponent={<EmptyState messageKey="library:emptyBookmarks" />}
        renderItem={({ item }) => (
          <PaperCard
            paper={item}
            bookmarked
            onPress={(p) => navigation.navigate('PaperDetail', { paperId: p.id })}
            onToggleBookmark={(p) => void toggleBookmark(p.id)}
          />
        )}
      />
      <Text style={{ color: theme.colors.textMuted, textAlign: 'center', padding: 8 }}>{t('library:bookmarksTitle')}</Text>
    </View>
  );
}
