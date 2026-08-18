
import { View, Text, Pressable, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@theme/index';
import { useSettingsStore } from '@stores/settingsStore';
import type { ProfileStackParamList } from '@app/routes';

/** Settings hub (docs P0): language, theme, account, push, about, biometric. */
export function SettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<import('@react-navigation/native').NavigationProp<ProfileStackParamList>>();
  const biometric = useSettingsStore((s) => s.biometric);
  const setBiometric = useSettingsStore((s) => s.setBiometric);
  const pushEnabled = useSettingsStore((s) => s.pushEnabled);
  const setPushEnabled = useSettingsStore((s) => s.setPushEnabled);

  const rows: Array<{ key: keyof ProfileStackParamList; title: string }> = [
    { key: 'Language', title: t('settings:language') },
    { key: 'Theme', title: t('settings:theme') },
    { key: 'Account', title: t('settings:account') },
    { key: 'Push', title: t('settings:push') },
    { key: 'About', title: t('settings:about') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md }}>
      <Text style={{ fontSize: theme.font.size.xl, fontWeight: theme.font.weight.bold, color: theme.colors.text, marginBottom: theme.spacing.md }}>
        {t('settings:settingsTitle')}
      </Text>
      {rows.map((r) => (
        <Pressable
          key={r.key}
          onPress={() => navigation.navigate(r.key as never)}
          style={{ padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border }}
        >
          <Text style={{ color: theme.colors.text, fontSize: theme.font.size.lg }}>{r.title}</Text>
        </Pressable>
      ))}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: theme.spacing.md }}>
        <Text style={{ color: theme.colors.text }}>{t('settings:biometric')}</Text>
        <Switch value={biometric} onValueChange={setBiometric} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: theme.spacing.md }}>
        <Text style={{ color: theme.colors.text }}>{t('settings:push')}</Text>
        <Switch value={pushEnabled} onValueChange={setPushEnabled} />
      </View>
    </View>
  );
}
