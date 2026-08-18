
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@theme/index';
import { useSettingsStore } from '@stores/settingsStore';
import type { LangCode } from '@lib/storage/mmkv';

/** Language selection (docs P0): zh / en. */
export function LanguageScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const lang = useSettingsStore((s) => s.lang);
  const setLang = useSettingsStore((s) => s.setLang);
  const options: Array<{ code: LangCode; label: string }> = [
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'English' },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md }}>
      {options.map((o) => (
        <Pressable
          key={o.code}
          onPress={() => setLang(o.code)}
          style={{
            padding: theme.spacing.md,
            backgroundColor: lang === o.code ? theme.colors.primary : theme.colors.surface,
            borderRadius: theme.radius.md,
            marginBottom: theme.spacing.sm,
          }}
        >
          <Text style={{ color: lang === o.code ? theme.colors.primaryForeground : theme.colors.text, fontSize: theme.font.size.lg }}>{o.label}</Text>
        </Pressable>
      ))}
      <Text style={{ color: theme.colors.textMuted, marginTop: theme.spacing.sm }}>{t('common:language')}</Text>
    </View>
  );
}
