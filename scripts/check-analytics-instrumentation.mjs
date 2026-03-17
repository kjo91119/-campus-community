import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const projectRoot = process.cwd();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath) {
  return readFileSync(join(projectRoot, relativePath), 'utf8');
}

const rootLayoutSource = read('app/_layout.tsx');
const analyticsHookSource = read('hooks/use-analytics.tsx');
const authStartSource = read('app/(auth)/index.tsx');
const emailSource = read('app/(auth)/email.tsx');
const manualVerificationSource = read('app/(auth)/manual-verification.tsx');
const onboardingSource = read('app/(auth)/onboarding.tsx');
const appSessionSource = read('hooks/use-app-session.tsx');
const communityProviderSource = read('hooks/use-community-data.tsx');
const homeSource = read('app/(tabs)/index.tsx');
const schoolSource = read('app/(tabs)/school.tsx');
const recruitSource = read('app/(tabs)/recruit.tsx');
const writeSource = read('app/(tabs)/write.tsx');
const recruitWriteSource = read('app/(tabs)/recruit-write.tsx');
const postDetailSource = read('app/(tabs)/posts/[postId].tsx');
const recruitmentDetailSource = read('app/(tabs)/recruitments/[recruitmentId].tsx');

assert(
  rootLayoutSource.includes('AnalyticsProvider'),
  'Root layout should wrap the app with AnalyticsProvider.'
);

assert(
  analyticsHookSource.includes('campus-community:analytics-events') &&
    analyticsHookSource.includes('track: (name, properties)'),
  'Analytics provider should persist buffered events and expose a track function.'
);

assert(
  authStartSource.includes("track('auth_started'") &&
    !authStartSource.includes("track('manual_verification_started'"),
  'Auth start screen should track auth entry without double-counting manual verification start.'
);

assert(
  emailSource.includes("track('school_email_submitted'"),
  'Email auth screen should track school email submission.'
);

assert(
  manualVerificationSource.includes("track('manual_verification_started'") &&
    manualVerificationSource.includes('hasTrackedStartRef') &&
    manualVerificationSource.includes('if (isHydrating || hasTrackedStartRef.current)'),
  'Manual verification screen should track start once after hydration.'
);

assert(
  onboardingSource.includes("track('onboarding_started'") &&
    onboardingSource.includes('hasTrackedStartRef') &&
    onboardingSource.includes("profile.verificationStatus !== 'verified'"),
  'Onboarding screen should track start once after hydration and verification gating.'
);

assert(
  appSessionSource.includes("track('school_email_verified'") &&
    appSessionSource.includes("track('manual_verification_submitted'") &&
    appSessionSource.includes("track('onboarding_completed'") &&
    appSessionSource.includes('lastVerificationEventKeyRef') &&
    appSessionSource.includes('lastAccountStatusEventKeyRef'),
  'App session provider should track lifecycle events with separate verification and account-status dedupe keys.'
);

assert(
  communityProviderSource.includes("track('post_created'") &&
    communityProviderSource.includes("track('recruitment_created'") &&
    communityProviderSource.includes("track('report_submitted'") &&
    communityProviderSource.includes("track('user_blocked'") &&
    communityProviderSource.includes('comment_created') &&
    communityProviderSource.includes('recruitment_interest_commented'),
  'Community provider should track create/report/block events.'
);

assert(
  homeSource.includes("track('home_viewed'") &&
    homeSource.includes("track('major_filter_applied'") &&
    homeSource.includes('handleSelectMajorFilter'),
  'Home screen should track view and user-triggered major filter usage.'
);

assert(
  schoolSource.includes("track('school_board_viewed'") &&
    schoolSource.includes('hasTrackedViewRef') &&
    schoolSource.includes('if (isHydrating || hasTrackedViewRef.current)'),
  'School board screen should track board views once after hydration.'
);

assert(
  recruitSource.includes("track('recruitment_list_viewed'"),
  'Recruitment list screen should track list views.'
);

assert(
  writeSource.includes("track('post_create_started'") &&
    recruitWriteSource.includes("track('post_create_started'"),
  'Write screens should track create-start entry.'
);

assert(
  postDetailSource.includes("track('post_opened'") &&
    recruitmentDetailSource.includes("track('recruitment_opened'"),
  'Detail screens should track post and recruitment opens.'
);

console.log('Analytics instrumentation regression check passed.');
