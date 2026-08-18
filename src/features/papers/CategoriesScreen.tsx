import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@theme/index';
import { SkeletonList } from '@components/Skeleton';
import { ErrorState } from '@components/ErrorState';
import { CategoryTree } from '@components/CategoryTree';
import { apiClient } from '@lib/api/client';
import { Endpoints } from '@lib/api/endpoints';
import { isDemoMode } from '@lib/config';
import { useSettingsStore } from '@stores/settingsStore';
import type { Category } from '@lib/types';
import type { HomeStackParamList } from '@app/routes';

/** Bilingual category tree (docs: 257 categories). */
export function CategoriesScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const lang = useSettingsStore((s) => s.lang);
  const navigation = useNavigation<import('@react-navigation/native').NavigationProp<HomeStackParamList>>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isDemoMode()) {
      setCategories([]);
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const data = await apiClient.get<Category[]>(Endpoints.categories);
        setCategories(data);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <SkeletonList rows={8} />;
  if (error) return <ErrorState error={error} onRetry={() => navigation.goBack()} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <CategoryTree
        categories={categories}
        lang={lang}
        onSelect={(_c) => {
          // Navigate back to feed filtered by this category (P0: feed supports category query).
          navigation.navigate('Feed');
          void t;
        }}
      />
    </View>
  );
}
