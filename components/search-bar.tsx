import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';

type SearchBarProps = {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
};

export function SearchBar({
  placeholder = '검색어를 입력하세요',
  onSearch,
  debounceMs = 300,
}: SearchBarProps) {
  const colors = useThemeColors();
  const [query, setQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onSearch(query.trim());
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, debounceMs, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.inputBackground,
          borderColor: colors.inputBorder,
        },
      ]}>
      <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
      <TextInput
        accessibilityLabel="검색"
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor={colors.inputPlaceholder}
        returnKeyType="search"
        style={[styles.input, { color: colors.text }]}
        value={query}
      />
      {query.length > 0 ? (
        <Pressable
          accessibilityLabel="검색어 지우기"
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleClear}>
          <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: Spacing.xs,
  },
});
