
import { Pressable, Text, ActivityIndicator, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({ title, variant = 'primary', size = 'md', loading, disabled, style, testID, ...rest }: ButtonProps) {
  const theme = useTheme();
  const bg =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'danger'
      ? theme.colors.danger
      : variant === 'secondary'
      ? theme.colors.surfaceMuted
      : 'transparent';
  const fg =
    variant === 'primary' || variant === 'danger'
      ? theme.colors.primaryForeground
      : variant === 'secondary'
      ? theme.colors.text
      : theme.colors.primary;
  const pad = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const font = size === 'sm' ? theme.font.size.sm : theme.font.size.md;

  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: theme.radius.md,
          paddingVertical: pad,
          paddingHorizontal: pad * 1.5,
          opacity: disabled || loading ? 0.55 : pressed ? 0.85 : 1,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
        },
        style,
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontSize: font, fontWeight: theme.font.weight.medium }}>{title}</Text>}
    </Pressable>
  );
}
