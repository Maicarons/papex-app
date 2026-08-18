
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@theme/index';
import { config } from '@lib/config';

/** About screen (docs P0). */
export function AboutScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md }}>
      <Text style={{ color: theme.colors.text, fontSize: theme.font.size.lg }}>Papex</Text>
      <Text style={{ color: theme.colors.textMuted, marginTop: theme.spacing.sm }}>{t('settings:aboutText')}</Text>
      <Text style={{ color: theme.colors.textMuted, marginTop: theme.spacing.sm }}>{t('settings:version')}: 0.1.0</Text>
      <Text style={{ color: theme.colors.textMuted }}>API: {config.API_BASE_URL}</Text>
    </View>
  );
}
