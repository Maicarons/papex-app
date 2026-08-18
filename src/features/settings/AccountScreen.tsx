
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@theme/index';
import { useAuthStore } from '@stores/authStore';
import type { ProfileStackParamList } from '@app/routes';

/** Account screen (docs P0/P1): device management + API key entry point. */
export function AccountScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<import('@react-navigation/native').NavigationProp<ProfileStackParamList>>();
  const session = useAuthStore((s) => s.session);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md }}>
      <Text style={{ color: theme.colors.textMuted }}>{session?.username ?? '—'}</Text>
      <Pressable
        onPress={() => navigation.navigate('DeviceManagement')}
        style={{ padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, marginVertical: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border }}
      >
        <Text style={{ color: theme.colors.text, fontSize: theme.font.size.lg }}>{t('auth:deviceManagement')}</Text>
      </Pressable>
      <Pressable
        onPress={() => undefined}
        style={{ padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border }}
      >
        <Text style={{ color: theme.colors.text, fontSize: theme.font.size.lg }}>{t('settings:apiKeys')}</Text>
      </Pressable>
    </View>
  );
}
