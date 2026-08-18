
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@theme/index';
import { useAuthStore } from '@stores/authStore';
import type { AccountMeta } from '@lib/security/tokens';

/** Multi-account switcher (docs §7.7) — up to 5 sanitized accounts. */
export function AccountSwitcherScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const accounts = useAuthStore((s) => s.accounts);
  const activeUser = useAuthStore((s) => s.session?.userId ?? null);
  const switchAccount = useAuthStore((s) => s.switchAccount);
  const removeAccount = useAuthStore((s) => s.removeAccount);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md }}>
      <Text style={{ fontSize: theme.font.size.xl, fontWeight: theme.font.weight.bold, color: theme.colors.text, marginBottom: theme.spacing.md }}>
        {t('auth:multiAccount')}
      </Text>
      {accounts.map((a: AccountMeta) => (
        <View
          key={a.userId}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.sm,
          }}
        >
          <Pressable onPress={() => void switchAccount(a.userId)} style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontSize: theme.font.size.md }}>{a.username}</Text>
            {a.userId === activeUser ? (
              <Text style={{ color: theme.colors.primary, fontSize: theme.font.size.sm }}>{t('auth:currentDevice')}</Text>
            ) : null}
          </Pressable>
          <Pressable onPress={() => void removeAccount(a.userId)}>
            <Text style={{ color: theme.colors.danger, fontSize: theme.font.size.sm }}>{t('common:delete')}</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}
