import { useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@theme/index';
import type { Category } from '@lib/types';

interface CategoryTreeProps {
  categories: Category[];
  onSelect: (category: Category) => void;
  /** Current UI language, to pick nameZh / nameEn. */
  lang: 'zh' | 'en';
}

/** Two-level collapsible category tree (docs: 257 bilingual categories). */
export function CategoryTree({ categories, onSelect, lang }: CategoryTreeProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<string | null>(null);

  const roots = useMemo(() => categories.filter((c) => c.parentId === null), [categories]);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  const label = (c: Category) => (lang === 'zh' ? c.nameZh : c.nameEn);

  return (
    <FlatList
      data={roots}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={<Text style={{ color: theme.colors.textMuted, margin: theme.spacing.sm }}>{t('papers:categories')}</Text>}
      renderItem={({ item }) => {
        const kids = childrenOf(item.id);
        const open = expanded === item.id;
        return (
          <View>
            <Pressable
              onPress={() => {
                setExpanded(open ? null : item.id);
                onSelect(item);
              }}
              style={{ padding: theme.spacing.md, borderBottomWidth: 1, borderColor: theme.colors.border }}
            >
              <Text style={{ color: theme.colors.text, fontSize: theme.font.size.md }}>{label(item)}</Text>
            </Pressable>
            {open
              ? kids.map((k) => (
                  <Pressable
                    key={k.id}
                    onPress={() => onSelect(k)}
                    style={{ paddingVertical: theme.spacing.sm, paddingLeft: theme.spacing.xl, paddingRight: theme.spacing.md }}
                  >
                    <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.size.sm }}>{label(k)}</Text>
                  </Pressable>
                ))
              : null}
          </View>
        );
      }}
    />
  );
}
