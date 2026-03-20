import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { AppSessionProvider } from '@/hooks/use-app-session';
import { AnalyticsProvider } from '@/hooks/use-analytics';
import { CommunityProvider } from '@/hooks/use-community-data';
import { SupabaseAuthProvider } from '@/hooks/use-supabase-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ErrorBoundary } from '@/components/error-boundary';
import { OfflineBanner } from '@/components/offline-banner';
import { ToastProvider } from '@/components/toast';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const prevSchemeRef = useRef(colorScheme);

  useEffect(() => {
    if (prevSchemeRef.current !== colorScheme) {
      prevSchemeRef.current = colorScheme;
      fadeAnim.setValue(0.85);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [colorScheme, fadeAnim]);

  const navigationTheme = useMemo(
    () => ({
      ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
      colors: {
        ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme).colors,
        background: colors.background,
        card: colors.surface,
        border: colors.border,
        primary: colors.tint,
        text: colors.text,
      },
    }),
    [colorScheme, colors],
  );

  return (
    <ThemeProvider value={navigationTheme}>
      <AnalyticsProvider>
        <SupabaseAuthProvider>
          <AppSessionProvider>
            <CommunityProvider>
              <ToastProvider>
                <ErrorBoundary>
                  <OfflineBanner />
                  <Animated.View style={[layoutStyles.root, { opacity: fadeAnim }]}>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="(auth)" />
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen name="modal" options={{ presentation: 'modal', title: '안내' }} />
                    </Stack>
                  </Animated.View>
                </ErrorBoundary>
              </ToastProvider>
            </CommunityProvider>
          </AppSessionProvider>
        </SupabaseAuthProvider>
      </AnalyticsProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const layoutStyles = StyleSheet.create({
  root: { flex: 1 },
});
