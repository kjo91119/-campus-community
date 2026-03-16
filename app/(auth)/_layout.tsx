import { Redirect, Stack, usePathname } from 'expo-router';

import { useAppSession } from '@/hooks/use-app-session';

export default function AuthLayout() {
  const pathname = usePathname();
  const { canAccessCommunity, isHydrating, profile } = useAppSession();

  if (isHydrating) {
    return null;
  }

  if (canAccessCommunity) {
    return <Redirect href="/(tabs)" />;
  }

  if (
    profile.verificationStatus === 'verified' &&
    (!profile.onboardingCompleted ||
      !profile.primaryUniversityId ||
      !profile.primaryMajorGroupId) &&
    !pathname.endsWith('/onboarding')
  ) {
    return <Redirect href="../onboarding" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
