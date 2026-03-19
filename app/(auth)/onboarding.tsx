import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { SkeletonDetail } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAppSession } from '@/hooks/use-app-session';
import { useThemeColors } from '@/hooks/use-theme-color';
import {
  SUPPORTED_MAJOR_GROUPS,
  SUPPORTED_UNIVERSITIES,
  getUniversityById,
} from '@/lib/community/metadata';

export default function OnboardingScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { track } = useAnalytics();
  const {
    authEmail,
    completeOnboarding,
    isHydrating,
    profile,
    profileStorageMode,
    profileSyncMessage,
  } = useAppSession();
  const [nickname, setNickname] = useState(profile.nickname);
  const [universityId, setUniversityId] = useState(profile.primaryUniversityId ?? '');
  const [majorGroupId, setMajorGroupId] = useState(profile.primaryMajorGroupId ?? '');
  const [majorLabel, setMajorLabel] = useState(profile.majorLabel ?? '');
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [feedback, setFeedback] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedUniversity = getUniversityById(universityId || profile.primaryUniversityId);
  const hasTrackedStartRef = useRef(false);

  useEffect(() => {
    if (isHydrating || profile.verificationStatus !== 'verified' || hasTrackedStartRef.current) {
      return;
    }

    track('onboarding_started', {
      university_id: profile.primaryUniversityId ?? null,
      major_group: profile.primaryMajorGroupId ?? null,
    });
    hasTrackedStartRef.current = true;
  }, [
    isHydrating,
    profile.primaryMajorGroupId,
    profile.primaryUniversityId,
    profile.verificationStatus,
    track,
  ]);

  if (isHydrating) {
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
        <SkeletonDetail />
      </ScrollView>
    );
  }

  if (profile.verificationStatus !== 'verified') {
    return <Redirect href="/" />;
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const result = await completeOnboarding({
      nickname,
      universityId,
      majorGroupId,
      majorLabel,
      acceptedPolicy,
    });

    if (!result.ok) {
      setFeedback(result.message);
      setIsSubmitting(false);
      return;
    }

    setFeedback(result.message);
    setIsSubmitting(false);
    router.replace('/(tabs)');
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
      <ThemedText type="title">온보딩</ThemedText>
      <ThemedText type="caption" style={{ color: colors.textSecondary }}>
        학교 이메일 인증 후 닉네임, 학교, 전공군을 확정합니다. 이 단계에서 프로필 저장 구조와
        홈 진입 조건을 함께 맞춥니다.
      </ThemedText>

      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">인증 정보</ThemedText>
        <View style={styles.infoRow}>
          <ThemedText type="caption" style={{ color: colors.textTertiary }}>로그인 이메일</ThemedText>
          <ThemedText>{authEmail ?? '미확인'}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText type="caption" style={{ color: colors.textTertiary }}>학교</ThemedText>
          <ThemedText>{selectedUniversity?.name ?? '미확인'}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText type="caption" style={{ color: colors.textTertiary }}>프로필 저장 위치</ThemedText>
          <ThemedText>
            {profileStorageMode === 'supabase' ? 'Supabase profiles' : profileStorageMode === 'local_cache' ? '로컬 캐시' : '인증 기반 초기 상태'}
          </ThemedText>
        </View>
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          공개 노출은 닉네임과 전공군 중심으로 진행됩니다.
        </ThemedText>
        {profileSyncMessage ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            {profileSyncMessage}
          </ThemedText>
        ) : null}
      </ThemedView>

      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">기본 프로필</ThemedText>
        <TextInput
          onChangeText={setNickname}
          placeholder="닉네임 입력"
          placeholderTextColor={colors.inputPlaceholder}
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.text,
            },
          ]}
          value={nickname}
        />
        <ThemedText type="caption" style={{ color: colors.textTertiary }}>
          닉네임은 2~12자의 한글, 영문, 숫자, 밑줄만 사용할 수 있습니다.
        </ThemedText>
        <TextInput
          onChangeText={setMajorLabel}
          placeholder="세부 학과명 또는 관심 태그"
          placeholderTextColor={colors.inputPlaceholder}
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.text,
            },
          ]}
          value={majorLabel}
        />
      </ThemedView>

      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">학교 선택</ThemedText>
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          MVP에서는 학교 이메일로 확인된 학교와 동일한 학교를 프로필 학교로 사용합니다.
        </ThemedText>
        <View style={styles.choiceList}>
          {SUPPORTED_UNIVERSITIES.map((item) => {
            const selected = universityId === item.id;

            return (
              <Pressable
                key={item.id}
                onPress={() => setUniversityId(item.id)}
                style={({ pressed }) => [
                  styles.choice,
                  { borderColor: colors.border },
                  selected && styles.choiceSelected,
                  pressed && { opacity: 0.7 },
                ]}>
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                  {item.region}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ThemedView>

      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">전공군 선택</ThemedText>
        <View style={styles.choiceList}>
          {SUPPORTED_MAJOR_GROUPS.map((group) => {
            const selected = majorGroupId === group.id;

            return (
              <Pressable
                key={group.id}
                onPress={() => setMajorGroupId(group.id)}
                style={({ pressed }) => [
                  styles.choice,
                  { borderColor: colors.border },
                  selected && styles.choiceSelected,
                  pressed && { opacity: 0.7 },
                ]}>
                <ThemedText type="defaultSemiBold">{group.label}</ThemedText>
                <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                  {group.description}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
        {feedback ? (
          <View style={[styles.feedbackBanner, { backgroundColor: colors.warningBackground, borderColor: colors.warningBorder }]}>
            <ThemedText>{feedback}</ThemedText>
          </View>
        ) : null}
      </ThemedView>

      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">정책 확인</ThemedText>
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          익명성은 공개 노출 방식일 뿐이며, 신고 접수 시 운영 정책에 따라 검토될 수 있습니다.
        </ThemedText>
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          비방, 허위 정보, 반복 도배는 제한 대상이며 MVP에서는 닉네임 정책과 기본 규칙 동의 후
          진입합니다.
        </ThemedText>
        <Pressable
          onPress={() => setAcceptedPolicy((current) => !current)}
          style={({ pressed }) => [
            styles.choice,
            { borderColor: colors.border },
            acceptedPolicy && styles.choiceSelected,
            pressed && { opacity: 0.7 },
          ]}>
          <View style={styles.checkboxRow}>
            <View
              style={[
                styles.checkbox,
                { borderColor: colors.border },
                acceptedPolicy && { backgroundColor: Brand.primary, borderColor: Brand.primary },
              ]}>
              {acceptedPolicy ? <ThemedText style={{ color: '#FFFFFF', fontSize: 12, lineHeight: 16 }}>✓</ThemedText> : null}
            </View>
            <ThemedText type="defaultSemiBold" style={{ flex: 1 }}>
              {acceptedPolicy ? '확인 완료' : '이용 규칙과 익명성 정책을 확인했습니다'}
            </ThemedText>
          </View>
        </Pressable>
      </ThemedView>

      <Pressable
        disabled={isSubmitting}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && { opacity: 0.7 },
          isSubmitting && { opacity: 0.5 },
        ]}
        onPress={() => void handleSubmit()}>
        <ThemedText style={styles.primaryButtonText}>
          {isSubmitting ? '저장 중...' : '온보딩 완료하고 홈으로 이동'}
        </ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  card: {
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: 15,
  },
  choiceList: {
    gap: Spacing.sm,
  },
  choice: {
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  choiceSelected: {
    backgroundColor: Brand.primaryMuted,
    borderColor: Brand.primary + '50',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Spacing.xs,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackBanner: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Brand.primary,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
