import { View, type ViewProps } from 'react-native';

import { Shadow } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  /** visual level: page bg, card surface, elevated card */
  variant?: 'default' | 'surface' | 'elevated' | 'secondary';
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  variant = 'default',
  ...otherProps
}: ThemedViewProps) {
  const colors = useThemeColors();
  const scheme = useColorScheme() ?? 'light';

  const backgroundColor =
    lightColor || darkColor
      ? (lightColor ?? darkColor ?? colors.background)
      : variant === 'surface'
        ? colors.surface
        : variant === 'elevated'
          ? colors.surfaceElevated
          : variant === 'secondary'
            ? colors.surfaceSecondary
            : colors.background;

  const shadow =
    variant === 'elevated'
      ? (scheme === 'light' ? Shadow.md : {})
      : variant === 'surface'
        ? (scheme === 'light' ? Shadow.sm : {})
        : {};

  const borderStyle =
    variant === 'surface' || variant === 'elevated'
      ? { borderWidth: 1, borderColor: colors.cardBorder }
      : {};

  return (
    <View
      style={[{ backgroundColor }, shadow, borderStyle, style]}
      {...otherProps}
    />
  );
}
