
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@theme/index';
import { Button } from './Button';
import type { ApiError } from '@lib/api/errors';

interface ErrorStateProps {
  error?: ApiError | Error | null;
  onRetry?: () => void;
}

/**
 * Error surface. Shows the i18n-mapped message for an ApiError, else a generic
 * string. The retry button is optional.
 */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const message =
    error && 'i18nKey' in error ? t((error as ApiError).i18nKey) : error?.message ?? t('errors:unknown');

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl }}>
      <Text style={{ color: theme.colors.danger, fontSize: theme.font.size.md, marginBottom: theme.spacing.md }}>{message}</Text>
      {onRetry ? <Button title={t('common:retry')} variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}
