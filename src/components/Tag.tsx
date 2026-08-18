
import { Text, View } from 'react-native';
import { useTheme } from '@theme/index';

interface TagProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Tag({ label, active, onPress }: TagProps) {
  const theme = useTheme();
  const bg = active ? theme.colors.primary : theme.colors.surfaceMuted;
  const fg = active ? theme.colors.primaryForeground : theme.colors.textMuted;
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: theme.radius.sm,
        paddingVertical: 4,
        paddingHorizontal: 8,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{ color: fg, fontSize: theme.font.size.sm, fontWeight: theme.font.weight.medium }}
        onPress={onPress}
      >
        {label}
      </Text>
    </View>
  );
}
