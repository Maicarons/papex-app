import { useState } from 'react';
import { Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@theme/index';
import { Button } from '@components/Button';
import { TextField } from '@components/TextField';
import { useAuthStore } from '@stores/authStore';
import type { AuthStackParamList } from '@app/routes';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const register = useAuthStore((s) => s.register);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      await register(username, password, displayName);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: theme.spacing.xl, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: theme.font.size.xl, fontWeight: theme.font.weight.bold, color: theme.colors.text, marginBottom: theme.spacing.xl }}>
        {t('auth:registerTitle')}
      </Text>
      <TextField label={t('auth:username')} value={username} onChangeText={setUsername} autoCapitalize="none" />
      <TextField label={t('profile:displayName')} value={displayName} onChangeText={setDisplayName} />
      <TextField label={t('auth:password')} value={password} onChangeText={setPassword} secure />
      {error ? <Text style={{ color: theme.colors.danger, marginVertical: theme.spacing.sm }}>{error}</Text> : null}
      <Button title={t('auth:registerButton')} loading={busy} onPress={onSubmit} />
      <Button title={t('common:back')} variant="ghost" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}
