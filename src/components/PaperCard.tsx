
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@theme/index';
import { Tag } from './Tag';
import type { Paper } from '@lib/types';

interface PaperCardProps {
  paper: Paper;
  bookmarked?: boolean;
  onPress: (paper: Paper) => void;
  onToggleBookmark?: (paper: Paper) => void;
}

export function PaperCard({ paper, bookmarked, onPress, onToggleBookmark }: PaperCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={() => onPress(paper)}
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <Text style={{ color: theme.colors.text, fontSize: theme.font.size.lg, fontWeight: theme.font.weight.bold }} numberOfLines={2}>
        {paper.title}
      </Text>
      {paper.authors.length ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.size.sm, marginTop: 4 }} numberOfLines={1}>
          {paper.authors.join(', ')}
        </Text>
      ) : null}
      {paper.abstract ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.size.sm, marginTop: 6 }} numberOfLines={2}>
          {paper.abstract}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: theme.spacing.sm }}>
        {paper.categories.slice(0, 3).map((c) => (
          <Tag key={c} label={c} />
        ))}
        {onToggleBookmark ? (
          <Tag
            label={bookmarked ? t('papers:bookmarked') : t('papers:bookmark')}
            active={bookmarked}
            onPress={() => onToggleBookmark(paper)}
          />
        ) : null}
      </View>
    </Pressable>
  );
}
