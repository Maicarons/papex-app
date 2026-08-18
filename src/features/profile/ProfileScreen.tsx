
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@theme/index';
import { Button } from '@components/Button';
import { useAuthStore } from '@stores/authStore';
import { useSettingsStore } from '@stores/settingsStore';
import { canContribute } from '@lib/security/tokens';
import type { ProfileStackParamList } from '@app/routes';

export function ProfileScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<import('@react-navigation/native').NavigationProp<ProfileStackParamList>>();
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const lang = useSettingsStore((s) => s.lang);

  const rows: Array<{ key: keyof ProfileStackParamList; title: string }> = [
    { key: 'Endorsements', title: t('profile:endorsementsTitle') },
    { key: 'EditProfile', title: t('profile:editProfile') },
    { key: 'Stats', title: t('profile:stats') },
    { key: 'DeviceManagement', title: t('auth:deviceManagement') },
    { key: 'Settings', title: t('common:settings') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md }}>
      <Text style={{ fontSize: theme.font.size.xl, fontWeight: theme.font.weight.bold, color: theme.colors.text }}>{session?.username ?? '—'}</Text>
      {canContribute(session) ? <Text style={{ color: theme.colors.primary }}>paper:create</Text> : null}
      <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
        {rows.map((r) => (
          <Pressable
            key={r.key}
            onPress={() => navigation.navigate(r.key as never)}
            style={{ padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border }}
          >
            <Text style={{ color: theme.colors.text, fontSize: theme.font.size.lg }}>{r.title}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ marginTop: theme.spacing.lg }}>
        <Button title={t('common:logout')} variant="danger" onPress={() => void logout()} />
      </View>
      <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: theme.spacing.sm }}>{lang}</Text>
    </View>
  );
}
