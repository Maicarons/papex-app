import { useCallback, useEffect, useState } from 'react';
import { View, FlatList, Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@theme/index';
import { PaperCard } from '@components/PaperCard';
import { SkeletonList } from '@components/Skeleton';
import { ErrorState } from '@components/ErrorState';
import { Tag } from '@components/Tag';
import { apiClient } from '@lib/api/client';
import { Endpoints } from '@lib/api/endpoints';
import { isDemoMode } from '@lib/config';
import { useLibraryStore } from '@stores/libraryStore';
import type { Paper } from '@lib/types';
import type { HomeStackParamList } from '@app/routes';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Feed'>;

const PAGE_SIZE = 20;

export function FeedScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const toggleBookmark = useLibraryStore((s) => s.toggleBookmark);
  const bookmarks = useLibraryStore((s) => s.bookmarks);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  const load = useCallback(async (nextPage: number, cat: string | null) => {
    if (isDemoMode()) {
      // TODO(backend): wire real feed when papex is reachable.
      setPapers([]);
      setLoading(false);
      return;
    }
    try {
      const data = await apiClient.get<{ papers: Paper[]; total: number }>(Endpoints.papers.list, {
        query: { page: nextPage, pageSize: PAGE_SIZE, category: cat ?? undefined },
      });
      setPapers((prev) => (nextPage === 0 ? data.papers : [...prev, ...data.papers]));
      setPage(nextPage);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void load(0, category);
  }, [category, load]);

  if (loading && papers.length === 0) return <SkeletonList rows={6} />;
  if (error) return <ErrorState error={error} onRetry={() => void load(0, category)} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: theme.spacing.sm, gap: 8 }}>
        <Pressable onPress={() => navigation.navigate('Categories')}>
          <Tag label={category ?? t('papers:categories')} active={!!category} />
        </Pressable>
        {category ? (
          <Pressable onPress={() => setCategory(null)}>
            <Text style={{ color: theme.colors.primary }}>✕</Text>
          </Pressable>
        ) : null}
      </View>
      <FlatList
        data={papers}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: theme.spacing.md }}
        onEndReached={() => {
          if (papers.length >= PAGE_SIZE) void load(page + 1, category);
        }}
        onEndReachedThreshold={0.3}
        onRefresh={() => void load(0, category)}
        refreshing={loading}
        ListEmptyComponent={<Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 }}>{t('papers:noResults')}</Text>}
        renderItem={({ item }) => (
          <PaperCard
            paper={item}
            bookmarked={bookmarks.includes(item.id)}
            onPress={(p) => navigation.navigate('PaperDetail', { paperId: p.id })}
            onToggleBookmark={(p) => void toggleBookmark(p.id)}
          />
        )}
      />
    </View>
  );
}
