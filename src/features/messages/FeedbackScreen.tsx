import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@theme/index';
import { Button } from '@components/Button';
import { apiClient } from '@lib/api/client';
import { Endpoints } from '@lib/api/endpoints';
import { isDemoMode } from '@lib/config';

/** Feedback submission (docs P0). */
export function FeedbackScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!body.trim()) return;
    setBusy(true);
    if (!isDemoMode()) {
      try {
        await apiClient.post(Endpoints.feedback, { body });
        setSent(true);
        setBody('');
      } catch {
        /* ignore */
      }
    } else {
      setSent(true);
    }
    setBusy(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md }}>
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder={t('messages:feedbackPlaceholder')}
        placeholderTextColor={theme.colors.textMuted}
        multiline
        numberOfLines={6}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          color: theme.colors.text,
          minHeight: 140,
          textAlignVertical: 'top',
        }}
      />
      <Button title={t('messages:sendFeedback')} loading={busy} onPress={() => void send()} />
      {sent ? <Button title={t('common:ok')} variant="ghost" onPress={() => setSent(false)} /> : null}
    </View>
  );
}
