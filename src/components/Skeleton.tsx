
import { View, type DimensionValue } from 'react-native';
import { useTheme } from '@theme/index';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
}

/** Shimmer-free placeholder block (skeleton screen primitive, docs P1). */
export function Skeleton({ width = '100%', height = 16, radius }: SkeletonProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius ?? theme.radius.sm,
        backgroundColor: theme.colors.skeleton,
      }}
    />
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  const theme = useTheme();
  return (
    <View style={{ padding: theme.spacing.md, gap: theme.spacing.md }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={64} />
      ))}
    </View>
  );
}
