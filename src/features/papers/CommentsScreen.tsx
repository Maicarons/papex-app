import { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useTheme } from '@theme/index';
import { Button } from '@components/Button';
import { SkeletonList } from '@components/Skeleton';
import { apiClient } from '@lib/api/client';
import { Endpoints } from '@lib/api/endpoints';
import { isDemoMode } from '@lib/config';
import type { HomeStackParamList } from '@app/routes';

type RouteP = RouteProp<HomeStackParamList, 'Comments'>;

interface Comment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

/** Paper comments (P2). Backend `/api/papers/[id]/comments`. */
export function CommentsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteP>();
  const { paperId } = route.params;
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      setComments([]);
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const data = await apiClient.get<Comment[]>(Endpoints.papers.comments(paperId));
        setComments(data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [paperId]);

  const send = async () => {
    if (!draft.trim() || isDemoMode()) return;
    try {
      await apiClient.post(Endpoints.papers.comments(paperId), { body: draft });
      setDraft('');
      const data = await apiClient.get<Comment[]>(Endpoints.papers.comments(paperId));
      setComments(data);
    } catch {
      /* ignore */
    }
  };

  if (loading) return <SkeletonList rows={4} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md }}>
      <FlatList
        data={comments}
        keyExtractor={(c) => c.id}
        ListEmptyComponent={<Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 30 }}>{t('papers:noResults')}</Text>}
        renderItem={({ item }) => (
          <View style={{ padding: theme.spacing.md, borderBottomWidth: 1, borderColor: theme.colors.border }}>
            <Text style={{ color: theme.colors.text, fontWeight: theme.font.weight.medium }}>{item.author}</Text>
            <Text style={{ color: theme.colors.text }}>{item.body}</Text>
          </View>
        )}
      />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: theme.spacing.sm }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t('papers:addComment')}
          placeholderTextColor={theme.colors.textMuted}
          style={{
            flex: 1,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.md,
            padding: 10,
            color: theme.colors.text,
          }}
        />
        <Pressable onPress={() => void send()}>
          <Text style={{ color: theme.colors.primary, padding: 10 }}>{t('messages:sendFeedback')}</Text>
        </Pressable>
      </View>
      <Button title={t('common:back')} variant="ghost" onPress={() => undefined} />
    </View>
  );
}
