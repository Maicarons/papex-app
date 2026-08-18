import { useState } from 'react';
import { Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@theme/index';
import { Button } from '@components/Button';
import { TextField } from '@components/TextField';
import { useAuthStore } from '@stores/authStore';
import { isDemoMode, config } from '@lib/config';
import type { AuthStackParamList } from '@app/routes';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const login = useAuthStore((s) => s.login);
  const accounts = useAuthStore((s) => s.accounts);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      // Session becomes 'authed' → RootNavigator swaps to App automatically.
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: theme.spacing.xl, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: theme.font.size.xl, fontWeight: theme.font.weight.bold, color: theme.colors.text, marginBottom: theme.spacing.xl }}>
        {t('auth:loginTitle')}
      </Text>
      <TextField label={t('auth:username')} value={username} onChangeText={setUsername} autoCapitalize="none" testID="login.username" />
      <TextField label={t('auth:password')} value={password} onChangeText={setPassword} secure testID="login.password" />
      {error ? <Text style={{ color: theme.colors.danger, marginVertical: theme.spacing.sm }}>{error}</Text> : null}
      <Button title={t('auth:loginButton')} loading={busy} onPress={onSubmit} testID="login.submit" />
      <Button title={t('auth:registerLink')} variant="ghost" onPress={() => navigation.navigate('Register')} />
      {accounts.length > 0 ? (
        <Button title={t('auth:switchAccount')} variant="secondary" onPress={() => navigation.navigate('AccountSwitcher')} />
      ) : null}
      {isDemoMode() ? (
        <Text style={{ color: theme.colors.textMuted, marginTop: theme.spacing.lg, textAlign: 'center' }}>
          {t('auth:demoHint')}
          {' '}
          {config.PAPEX_API_KEY ? '' : '(no API key set)'}
        </Text>
      ) : null}
    </ScrollView>
  );
}
