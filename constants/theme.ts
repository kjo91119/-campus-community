/**
 * Campus Community Design System
 *
 * Brand direction: 보건의료 학생 커뮤니티 — 차분하면서 생기 있는 teal-green 계열.
 * Dark mode는 blue-tinted dark, light mode는 warm neutral.
 */

import { Platform, StyleSheet } from 'react-native';

/* ──────────────────────────── Brand palette ──────────────────────────── */

export const Brand = {
  primary: '#1A8D73',
  primaryLight: '#22B893',
  primaryMuted: '#1A8D7326',
  primarySubtle: '#1A8D7312',

  secondary: '#2563EB',
  secondaryMuted: '#2563EB1A',

  accent: '#F59E0B',
  accentMuted: '#F59E0B1A',

  error: '#EF4444',
  errorMuted: '#EF44441A',

  success: '#10B981',
  successMuted: '#10B9811A',

  warning: '#F59E0B',
  warningMuted: '#F59E0B1A',

  info: '#3B82F6',
  infoMuted: '#3B82F61A',
} as const;

/* ────────────────────────── Semantic colours ─────────────────────────── */

export const Colors = {
  light: {
    background: '#F5F7FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfacePressed: '#F0F2F5',
    surfaceSecondary: '#F0F2F5',

    text: '#1A1D21',
    textSecondary: '#5F6B7A',
    textTertiary: '#8C95A1',
    textInverse: '#FFFFFF',

    border: '#E2E6EB',
    borderLight: '#EEF0F3',
    borderFocused: Brand.primary,

    tint: Brand.primary,
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: Brand.primary,

    tabBar: '#FFFFFF',
    tabBarBorder: '#E2E6EB',

    cardShadow: 'rgba(0, 0, 0, 0.06)',
    cardBorder: '#EAECF0',

    chipBackground: '#F0F2F5',
    chipSelectedBackground: Brand.primaryMuted,
    chipSelectedText: Brand.primary,
    chipBorder: '#E2E6EB',
    chipSelectedBorder: '#1A8D7340',

    inputBackground: '#FFFFFF',
    inputBorder: '#D1D5DB',
    inputPlaceholder: '#9CA3AF',

    warningBackground: '#FEF3C7',
    warningBorder: '#FCD34D',
    warningText: '#92400E',

    successBackground: '#D1FAE5',
    successBorder: '#6EE7B7',
    successText: '#065F46',

    errorBackground: '#FEE2E2',
    errorBorder: '#FCA5A5',
    errorText: '#991B1B',
  },
  dark: {
    background: '#0D1117',
    surface: '#161B22',
    surfaceElevated: '#1C2128',
    surfacePressed: '#21262D',
    surfaceSecondary: '#21262D',

    text: '#E6EDF3',
    textSecondary: '#8B949E',
    textTertiary: '#636C76',
    textInverse: '#0D1117',

    border: '#30363D',
    borderLight: '#21262D',
    borderFocused: Brand.primaryLight,

    tint: Brand.primaryLight,
    icon: '#8B949E',
    tabIconDefault: '#636C76',
    tabIconSelected: Brand.primaryLight,

    tabBar: '#161B22',
    tabBarBorder: '#30363D',

    cardShadow: 'rgba(0, 0, 0, 0.3)',
    cardBorder: '#30363D',

    chipBackground: '#21262D',
    chipSelectedBackground: '#22B89322',
    chipSelectedText: Brand.primaryLight,
    chipBorder: '#30363D',
    chipSelectedBorder: '#22B89350',

    inputBackground: '#0D1117',
    inputBorder: '#30363D',
    inputPlaceholder: '#636C76',

    warningBackground: '#F59E0B14',
    warningBorder: '#F59E0B40',
    warningText: '#FCD34D',

    successBackground: '#10B98114',
    successBorder: '#10B98140',
    successText: '#6EE7B7',

    errorBackground: '#EF444414',
    errorBorder: '#EF444440',
    errorText: '#FCA5A5',
  },
} as const;

/* ───────────────────────── Spacing / Radius ──────────────────────────── */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/* ─────────────────────────── Typography ──────────────────────────────── */

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

/* ──────────────────────── Button sizes ───────────────────────────────── */

export const ButtonSize = {
  sm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    fontSize: 13,
  },
  md: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    fontSize: 15,
  },
  lg: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    fontSize: 15,
  },
} as const;

/* ────────────────────── Shared style helpers ─────────────────────────── */

export const SharedStyles = StyleSheet.create({
  cardShadowLight: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
});

/** Platform-aware shadow styles for card components */
export const CardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  android: { elevation: 1 },
  web: { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  default: {},
}) as Record<string, unknown>;
