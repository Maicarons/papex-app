
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@theme/index';
import { useSettingsStore } from '@stores/settingsStore';
import type { ThemeMode } from '@lib/storage/mmkv';

/** Theme selection (docs P0): light / dark / system. */
export function ThemeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const mode = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const options: Array<{ code: ThemeMode; label: string }> = [
    { code: 'light', label: t('common:light') },
    { code: 'dark', label: t('common:dark') },
    { code: 'system', label: t('common:system') },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md }}>
      {options.map((o) => (
        <Pressable
          key={o.code}
          onPress={() => setTheme(o.code)}
          style={{
            padding: theme.spacing.md,
            backgroundColor: mode === o.code ? theme.colors.primary : theme.colors.surface,
            borderRadius: theme.radius.md,
            marginBottom: theme.spacing.sm,
          }}
        >
          <Text style={{ color: mode === o.code ? theme.colors.primaryForeground : theme.colors.text, fontSize: theme.font.size.lg }}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
