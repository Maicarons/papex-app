import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useTheme } from '@theme/index';
import { Button } from '@components/Button';
import { Tag } from '@components/Tag';
import { Skeleton } from '@components/Skeleton';
import { ErrorState } from '@components/ErrorState';
import { apiClient } from '@lib/api/client';
import { Endpoints } from '@lib/api/endpoints';
import { isDemoMode } from '@lib/config';
import { paperCache } from '@lib/storage/mmkv';
import { useLibraryStore } from '@stores/libraryStore';
import type { Paper, PaperVersion } from '@lib/types';
import type { HomeStackParamList } from '@app/routes';

type RouteP = RouteProp<HomeStackParamList, 'PaperDetail'>;

export function PaperDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteP>();
  const navigation = useNavigation<import('@react-navigation/native').NavigationProp<HomeStackParamList>>();
  const { paperId } = route.params;
  const toggleBookmark = useLibraryStore((s) => s.toggleBookmark);
  const bookmarks = useLibraryStore((s) => s.bookmarks);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [versions, setVersions] = useState<PaperVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const progress = paperCache.getProgress(paperId);

  useEffect(() => {
    if (isDemoMode()) {
      setPaper(null);
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const [p, vs] = await Promise.all([
          apiClient.get<Paper>(Endpoints.papers.detail(paperId)),
          apiClient.get<PaperVersion[]>(Endpoints.papers.versions(paperId)),
        ]);
        setPaper(p);
        setVersions(vs);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    })();
  }, [paperId]);

  if (loading) return <View style={{ padding: theme.spacing.md }}><Skeleton height={200} /></View>;
  if (error || !paper) return <ErrorState error={error} onRetry={() => navigation.goBack()} />;

  const latest = versions[0];
  const bookmarked = bookmarks.includes(paper.id);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md }}>
      <Text style={{ fontSize: theme.font.size.xl, fontWeight: theme.font.weight.bold, color: theme.colors.text }}>{paper.title}</Text>
      {paper.authors.length ? <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>{paper.authors.join(', ')}</Text> : null}
      {paper.abstract ? <Text style={{ color: theme.colors.text, marginTop: theme.spacing.md }}>{paper.abstract}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: theme.spacing.md }}>
        {paper.categories.map((c) => (
          <Tag key={c} label={c} />
        ))}
      </View>
      {paper.doi ? <Text style={{ color: theme.colors.textMuted }}>{t('papers:doi')}: {paper.doi}</Text> : null}
      {paper.source ? <Text style={{ color: theme.colors.textMuted }}>{t('papers:source')}: {paper.source}</Text> : null}
      {progress ? (
        <Text style={{ color: theme.colors.primary, marginTop: theme.spacing.sm }}>
          {t('papers:readingProgress')}: {Math.round(progress.percent * 100)}%
        </Text>
      ) : null}

      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
        <Button
          title={t('papers:pdfOpen')}
          onPress={() => latest && navigation.navigate('Reader', { paperId: paper.id, version: latest.version })}
        />
        <Button title={bookmarked ? t('papers:bookmarked') : t('papers:bookmark')} variant="secondary" onPress={() => void toggleBookmark(paper.id)} />
        <Button title={t('papers:comments')} variant="ghost" onPress={() => navigation.navigate('Comments', { paperId: paper.id })} />
      </View>
    </ScrollView>
  );
}
