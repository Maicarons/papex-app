import { useState } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@theme/index';
import { Button } from '@components/Button';
import { pushService } from '@lib/push/pushService';

/** Push notifications settings (docs P1). Re-registers the device token. */
export function PushScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>('');

  const reregister = async () => {
    const rec = await pushService.register();
    setStatus(rec ? rec.token.slice(0, 8) : 'none');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md }}>
      <Text style={{ color: theme.colors.text }}>{t('settings:push')}</Text>
      <Button title={t('common:refresh')} onPress={() => void reregister()} />
      {status ? <Text style={{ color: theme.colors.textMuted, marginTop: theme.spacing.sm }}>{status}</Text> : null}
    </View>
  );
}
