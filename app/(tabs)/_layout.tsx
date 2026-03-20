import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Brand, Colors, Shadow } from '@/constants/theme';
import type { ComponentProps } from 'react';
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
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.select({ ios: 78, default: 56 }),
          paddingBottom: Platform.select({ ios: 24, default: 4 }),
          paddingTop: 4,
          ...Shadow.lg,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="house.fill" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="recruit"
        options={{
          title: '모집',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person.2.fill" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="school"
        options={{
          title: '학교',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="graduationcap.fill" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person.fill" color={color} focused={focused} />
          ),
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

function TabIcon({ name, color, focused }: { name: ComponentProps<typeof IconSymbol>['name']; color: string; focused: boolean }) {
  return (
    <View style={tabStyles.iconWrap}>
      <IconSymbol size={26} name={name} color={color} />
      {focused ? <View style={tabStyles.activeDot} /> : null}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    gap: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.primary,
  },
});
