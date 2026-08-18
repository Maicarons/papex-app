
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@theme/index';

interface EmptyStateProps {
  /** i18n key under `common` or feature namespace, e.g. 'library:emptyBookmarks'. */
  messageKey?: string;
  message?: string;
}

export function EmptyState({ messageKey = 'common:empty', message }: EmptyStateProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl }}>
      <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.size.md }}>{message ?? t(messageKey)}</Text>
    </View>
  );
}
