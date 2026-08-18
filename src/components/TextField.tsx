
import { TextInput, Text, View } from 'react-native';
import { useTheme } from '@theme/index';

interface TextFieldProps {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  testID?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export function TextField({ label, value, onChangeText, placeholder, secure, testID, autoCapitalize = 'none' }: TextFieldProps) {
  const theme = useTheme();
  return (
    <View style={{ marginVertical: theme.spacing.sm }}>
      {label ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.size.sm, marginBottom: 4 }}>{label}</Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        testID={testID}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        secureTextEntry={secure}
        autoCapitalize={autoCapitalize}
        style={{
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          paddingVertical: 10,
          paddingHorizontal: 12,
          color: theme.colors.text,
          fontSize: theme.font.size.md,
        }}
      />
    </View>
  );
}
