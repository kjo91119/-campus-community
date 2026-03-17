import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppSessionProvider } from '@/hooks/use-app-session';
import { AnalyticsProvider } from '@/hooks/use-analytics';
import { CommunityProvider } from '@/hooks/use-community-data';
import { SupabaseAuthProvider } from '@/hooks/use-supabase-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnalyticsProvider>
        <SupabaseAuthProvider>
          <AppSessionProvider>
            <CommunityProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: '안내' }} />
              </Stack>
            </CommunityProvider>
          </AppSessionProvider>
        </SupabaseAuthProvider>
      </AnalyticsProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
