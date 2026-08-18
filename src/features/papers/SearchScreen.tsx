import { useState } from 'react';
import { View, Text, TextInput, FlatList, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@theme/index';
import { PaperCard } from '@components/PaperCard';
import { Tag } from '@components/Tag';
import { SkeletonList } from '@components/Skeleton';
import { ErrorState } from '@components/ErrorState';
import { apiClient } from '@lib/api/client';
import { Endpoints } from '@lib/api/endpoints';
import { isDemoMode } from '@lib/config';
import { useLibraryStore } from '@stores/libraryStore';
import type { Paper } from '@lib/types';
import type { SearchStackParamList } from '@app/routes';

type Nav = NativeStackNavigationProp<SearchStackParamList, 'Search'>;

export function SearchScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const toggleBookmark = useLibraryStore((s) => s.toggleBookmark);
  const bookmarks = useLibraryStore((s) => s.bookmarks);
  const [q, setQ] = useState('');
  const [semantic, setSemantic] = useState(false);
  const [results, setResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const runSearch = async (query: string) => {
    if (!query.trim() || isDemoMode()) {
      // TODO(backend): wire /api/search when papex is reachable.
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await apiClient.get<{ papers: Paper[] }>(Endpoints.search, {
        query: { q: query, semantic: semantic ? 1 : 0 },
      });
      setResults(data.papers);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md }}>
      <TextInput
        value={q}
        onChangeText={(v) => {
          setQ(v);
          void runSearch(v);
        }}
        placeholder={t('papers:searchPlaceholder')}
        placeholderTextColor={theme.colors.textMuted}
        style={{
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          padding: 10,
          color: theme.colors.text,
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.sm }}>
        <Tag label={t('papers:semantic')} active={semantic} onPress={() => setSemantic((s) => !s)} />
        <Switch value={semantic} onValueChange={setSemantic} style={{ marginLeft: 8 }} />
      </View>
      {loading ? (
        <SkeletonList rows={5} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void runSearch(q)} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: theme.spacing.sm }}
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
      )}
    </View>
  );
}
