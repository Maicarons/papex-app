
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@theme/index';
import type { LibraryStackParamList } from '@app/routes';

/** Library hub: bookmarks / subscriptions / offline downloads. */
export function LibraryScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<import('@react-navigation/native').NavigationProp<LibraryStackParamList>>();

  const entries: Array<{ key: keyof LibraryStackParamList; title: string }> = [
    { key: 'Bookmarks', title: t('library:bookmarksTitle') },
    { key: 'Subscriptions', title: t('library:subscriptionsTitle') },
    { key: 'Downloads', title: t('library:downloadsTitle') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md }}>
      <Text style={{ fontSize: theme.font.size.xl, fontWeight: theme.font.weight.bold, color: theme.colors.text, marginBottom: theme.spacing.md }}>
        {t('common:bookmarks')}
      </Text>
      {entries.map((e) => (
        <Pressable
          key={e.key}
          onPress={() => navigation.navigate(e.key as 'Bookmarks')}
          style={{
            padding: theme.spacing.md,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface,
            marginBottom: theme.spacing.sm,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Text style={{ color: theme.colors.text, fontSize: theme.font.size.lg }}>{e.title}</Text>
        </Pressable>
      ))}
    </View>
  );
}
