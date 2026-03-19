import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';

function SkeletonBlock({ style }: { style?: ViewStyle }) {
  const colors = useThemeColors();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { backgroundColor: colors.surfaceSecondary, opacity, borderRadius: Radius.sm },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <SkeletonBlock style={styles.titleBlock} />
      <SkeletonBlock style={styles.bodyBlock} />
      <SkeletonBlock style={styles.bodyBlockShort} />
      <View style={styles.badgeRow}>
        <SkeletonBlock style={styles.badgeBlock} />
        <SkeletonBlock style={styles.badgeBlock} />
      </View>
    </View>
  );
}

export function SkeletonFeed({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.feed}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

export function SkeletonDetail() {
  const colors = useThemeColors();

  return (
    <View style={styles.feed}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <SkeletonBlock style={styles.titleBlockLarge} />
        <SkeletonBlock style={styles.bodyBlock} />
        <SkeletonBlock style={styles.bodyBlock} />
        <SkeletonBlock style={styles.bodyBlockShort} />
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <SkeletonBlock style={styles.titleBlock} />
        <SkeletonBlock style={styles.bodyBlock} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  feed: { gap: Spacing.md },
  card: {
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  titleBlock: { width: '60%', height: 18 },
  titleBlockLarge: { width: '70%', height: 24 },
  bodyBlock: { width: '100%', height: 14 },
  bodyBlockShort: { width: '45%', height: 14 },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm },
  badgeBlock: { width: 60, height: 22, borderRadius: Radius.sm },
});
