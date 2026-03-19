import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAppSession } from '@/hooks/use-app-session';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { canAccessCommunity, isHydrating } = useAppSession();
  const colors = Colors[colorScheme ?? 'light'];

  if (isHydrating) {
    return null;
  }

  if (!canAccessCommunity) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: Platform.select({ ios: 88, default: 64 }),
          paddingBottom: Platform.select({ ios: 28, default: 8 }),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.1,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="recruit"
        options={{
          title: '모집',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="school"
        options={{
          title: '학교',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="graduationcap.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
        }}
      />
      <Tabs.Screen name="boards/[boardId]" options={{ href: null }} />
      <Tabs.Screen name="posts/[postId]" options={{ href: null }} />
      <Tabs.Screen name="recruitments/[recruitmentId]" options={{ href: null }} />
      <Tabs.Screen name="recruit-write" options={{ href: null }} />
      <Tabs.Screen name="write" options={{ href: null }} />
    </Tabs>
  );
}
