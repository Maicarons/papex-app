import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@theme/index';
import { Button } from '@components/Button';
import { TextField } from '@components/TextField';
import { apiClient } from '@lib/api/client';
import { Endpoints } from '@lib/api/endpoints';
import { isDemoMode } from '@lib/config';
import { useAuthStore } from '@stores/authStore';

/** Edit profile (docs P0). Avatar upload is TODO(backend): POST /api/me/avatar. */
export function EditProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const [displayName, setDisplayName] = useState(session?.username ?? '');
  const [bio, setBio] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    if (!isDemoMode()) {
      // TODO(backend): PATCH /api/auth/me with displayName/bio.
      try {
        await apiClient.put(Endpoints.auth.me, { displayName, bio });
      } catch {
        /* ignore */
      }
    }
    setBusy(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md }}>
      <TextField label={t('profile:displayName')} value={displayName} onChangeText={setDisplayName} />
      <TextField label={t('profile:bio')} value={bio} onChangeText={setBio} />
      <Button title={t('common:save')} loading={busy} onPress={() => void save()} />
    </View>
  );
}
