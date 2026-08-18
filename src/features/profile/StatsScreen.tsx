
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@theme/index';
import { mmkv, Keys } from '@lib/storage/mmkv';

/** Reading statistics (docs P2) — local aggregation from the reading-stats store. */
export function StatsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const raw = mmkv.getString(Keys.readingStats);
  const stats = (raw ? (JSON.parse(raw) as Record<string, number>) : {}) as Record<string, number>;
  const totalMin = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md }}>
      <Text style={{ color: theme.colors.text, fontSize: theme.font.size.lg }}>{t('profile:readingTime')}</Text>
      <Text style={{ color: theme.colors.textMuted, marginTop: theme.spacing.sm }}>{Math.round(totalMin)} min</Text>
    </View>
  );
}
