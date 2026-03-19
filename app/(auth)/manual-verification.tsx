import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EVIDENCE_RETENTION,
  MANUAL_VERIFICATION_SLA,
  VERIFICATION_STATUS_LABELS,
} from '@/constants/auth-policy';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { SkeletonDetail } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAppSession } from '@/hooks/use-app-session';
import { useThemeColors } from '@/hooks/use-theme-color';
import {
  SUPPORTED_UNIVERSITIES,
  findUniversityByEmail,
  getUniversityById,
} from '@/lib/community/metadata';

function formatDateTimeLabel(value?: string) {
  if (!value) {
    return '미기록';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate()
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
}

export default function ManualVerificationScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { track } = useAnalytics();
  const {
    authEmail,
    isAuthenticated,
    isHydrating,
    profile,
    submitManualVerification,
    verificationRecord,
    verificationStorageMode,
    verificationSyncMessage,
  } = useAppSession();
  const [selectedUniversityId, setSelectedUniversityId] = useState(
    verificationRecord?.universityId ?? profile.primaryUniversityId ?? ''
  );
  const [acceptedMaskingGuide, setAcceptedMaskingGuide] = useState(false);
  const [acceptedEvidenceChecklist, setAcceptedEvidenceChecklist] = useState(false);
  const [feedback, setFeedback] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasTrackedStartRef = useRef(false);

  useEffect(() => {
    if (isHydrating || hasTrackedStartRef.current) {
      return;
    }

    track('manual_verification_started', {
      entry: 'manual_verification_screen',
      is_authenticated: isAuthenticated,
    });
    hasTrackedStartRef.current = true;
  }, [isAuthenticated, isHydrating, track]);

  if (isHydrating) {
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
        <SkeletonDetail />
      </ScrollView>
    );
  }

  const verificationUniversity = getUniversityById(
    verificationRecord?.universityId ?? profile.primaryUniversityId
  );
  const hasSchoolEmailPath = authEmail ? Boolean(findUniversityByEmail(authEmail)) : false;
  const isManualVerificationRecord = verificationRecord?.method === 'student_id_manual';
  const isManualPendingOnServer =
    profile.verificationStatus === 'pending' &&
    isManualVerificationRecord &&
    verificationStorageMode === 'supabase';
  const isManualPendingLocalRetry =
    profile.verificationStatus === 'pending' &&
    isManualVerificationRecord &&
    (
      verificationStorageMode === 'local_retry' ||
      verificationRecord?.syncState === 'retry_required'
    );
  const isManualRejected =
    profile.verificationStatus === 'rejected' && isManualVerificationRecord;
  const isEmailPending =
    profile.verificationStatus === 'pending' && verificationRecord?.method === 'email';
  const isPendingWithoutManualRecord =
    profile.verificationStatus === 'pending' &&
    !isManualVerificationRecord &&
    !isEmailPending &&
    !hasSchoolEmailPath;
  const canSubmit =
    isAuthenticated &&
    !hasSchoolEmailPath &&
    (
      profile.verificationStatus === 'unverified' ||
      isManualRejected ||
      isPendingWithoutManualRecord ||
      isManualPendingLocalRetry
    );

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const result = await submitManualVerification({
      universityId: selectedUniversityId,
      acceptedMaskingGuide,
      acceptedEvidenceChecklist,
    });

    setFeedback(result.message);
    setIsSubmitting(false);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
      <ThemedText type="title">학생증 수동 인증</ThemedText>
      <ThemedText type="caption" style={{ color: colors.textSecondary }}>
        학교 이메일이 없는 경우를 위한 fallback 인증 단계입니다. 이번 단계에서는 실제 이미지
        업로드 대신 제출 상태와 검토 흐름을 먼저 연결합니다.
      </ThemedText>

      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">현재 상태</ThemedText>
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <ThemedText type="caption" style={{ color: colors.textTertiary }}>로그인</ThemedText>
            <ThemedText>{isAuthenticated ? '완료' : '미로그인'}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText type="caption" style={{ color: colors.textTertiary }}>이메일</ThemedText>
            <ThemedText>{authEmail ?? '미입력'}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText type="caption" style={{ color: colors.textTertiary }}>인증 상태</ThemedText>
            <ThemedText>{VERIFICATION_STATUS_LABELS[profile.verificationStatus]}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText type="caption" style={{ color: colors.textTertiary }}>학교</ThemedText>
            <ThemedText>{verificationUniversity?.name ?? '미선택'}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText type="caption" style={{ color: colors.textTertiary }}>인증 요청 저장 위치</ThemedText>
            <ThemedText>
              {verificationStorageMode === 'supabase'
                ? 'Supabase verifications'
                : verificationStorageMode === 'local_retry'
                  ? '로컬 재시도 필요 상태'
                  : verificationStorageMode === 'local_cache'
                  ? '로컬 캐시'
                  : '인증 기반 기본 상태'}
            </ThemedText>
          </View>
        </View>
        {verificationSyncMessage ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            {verificationSyncMessage}
          </ThemedText>
        ) : null}
      </ThemedView>

      {!isAuthenticated ? (
        <View style={[styles.warningCard, { backgroundColor: colors.warningBackground, borderColor: colors.warningBorder }]}>
          <ThemedText type="sectionHeader">먼저 계정 로그인이 필요합니다</ThemedText>
          <ThemedText>
            학생증 수동 인증은 일반 이메일 또는 학교 이메일로 계정을 만든 뒤 로그인한 상태에서만
            진행할 수 있습니다.
          </ThemedText>
        </View>
      ) : null}

      {isEmailPending ? (
        <View style={[styles.warningCard, { backgroundColor: colors.warningBackground, borderColor: colors.warningBorder }]}>
          <ThemedText type="sectionHeader">학교 이메일 확인이 먼저 필요합니다</ThemedText>
          <ThemedText>
            현재 계정은 학생증 수동 인증 검토 중이 아니라 학교 이메일 인증 대기 상태입니다. 메일함의
            확인 링크를 먼저 눌러 주세요.
          </ThemedText>
        </View>
      ) : null}

      {isManualPendingOnServer ? (
        <View style={[styles.warningCard, { backgroundColor: colors.warningBackground, borderColor: colors.warningBorder }]}>
          <ThemedText type="sectionHeader">검토 대기 중</ThemedText>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <ThemedText type="caption" style={{ color: colors.textTertiary }}>제출 시간</ThemedText>
              <ThemedText>{formatDateTimeLabel(verificationRecord?.submittedAt)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText type="caption" style={{ color: colors.textTertiary }}>제출 학교</ThemedText>
              <ThemedText>{verificationUniversity?.name ?? '미선택'}</ThemedText>
            </View>
          </View>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            {MANUAL_VERIFICATION_SLA.acknowledgement}
          </ThemedText>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            {MANUAL_VERIFICATION_SLA.resolution}
          </ThemedText>
        </View>
      ) : null}

      {isManualPendingLocalRetry ? (
        <View style={[styles.errorCard, { backgroundColor: colors.errorBackground, borderColor: colors.errorBorder }]}>
          <ThemedText type="sectionHeader">재시도가 필요합니다</ThemedText>
          <ThemedText>
            최근 제출은 로컬에만 임시 저장되어 아직 서버 검토 대기 상태가 아닐 수 있습니다.
          </ThemedText>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <ThemedText type="caption" style={{ color: colors.textTertiary }}>제출 시간</ThemedText>
              <ThemedText>{formatDateTimeLabel(verificationRecord?.submittedAt)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText type="caption" style={{ color: colors.textTertiary }}>제출 학교</ThemedText>
              <ThemedText>{verificationUniversity?.name ?? '미선택'}</ThemedText>
            </View>
          </View>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            네트워크가 안정되면 아래 버튼으로 다시 제출해 주세요.
          </ThemedText>
          {verificationSyncMessage ? (
            <ThemedText type="caption" style={{ color: colors.textSecondary }}>
              {verificationSyncMessage}
            </ThemedText>
          ) : null}
        </View>
      ) : null}

      {isManualRejected ? (
        <View style={[styles.errorCard, { backgroundColor: colors.errorBackground, borderColor: colors.errorBorder }]}>
          <ThemedText type="sectionHeader">재제출이 필요합니다</ThemedText>
          <ThemedText>
            반려 사유: {verificationRecord?.rejectionReason ?? '제출 자료 확인이 어려웠습니다.'}
          </ThemedText>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            학교를 다시 선택하고 안내를 확인한 뒤 재제출할 수 있습니다.
          </ThemedText>
        </View>
      ) : null}

      {isPendingWithoutManualRecord ? (
        <View style={[styles.warningCard, { backgroundColor: colors.warningBackground, borderColor: colors.warningBorder }]}>
          <ThemedText type="sectionHeader">제출 기록을 다시 확인해 주세요</ThemedText>
          <ThemedText>
            현재는 대기 상태로 보이지만, 최근 학생증 제출 기록을 찾지 못했습니다. 다시 제출하면
            상태를 복구할 수 있습니다.
          </ThemedText>
        </View>
      ) : null}

      {profile.verificationStatus === 'verified' ? (
        <ThemedView variant="surface" style={styles.card}>
          <ThemedText type="sectionHeader">인증 완료</ThemedText>
          <ThemedText>
            현재 계정은 이미 인증이 완료되었습니다. 온보딩이 남아 있다면 이어서 진행하면 됩니다.
          </ThemedText>
        </ThemedView>
      ) : null}

      {isAuthenticated && hasSchoolEmailPath && profile.verificationStatus !== 'verified' ? (
        <ThemedView variant="surface" style={styles.card}>
          <ThemedText type="sectionHeader">학교 이메일 우선 경로 사용 계정</ThemedText>
          <ThemedText>
            현재 이메일은 지원 학교 도메인으로 확인됩니다. 이 계정은 학생증 fallback보다 학교
            이메일 인증을 우선 사용하는 것이 맞습니다.
          </ThemedText>
        </ThemedView>
      ) : null}

      {canSubmit ? (
        <ThemedView variant="surface" style={styles.card}>
          <ThemedText type="sectionHeader">학교 선택</ThemedText>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            학생증 또는 재학 증빙을 제출할 학교를 선택합니다. 학교 보드 접근 기준에도 이 값이
            사용됩니다.
          </ThemedText>
          <View style={styles.choiceList}>
            {SUPPORTED_UNIVERSITIES.map((item) => {
              const selected = selectedUniversityId === item.id;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedUniversityId(item.id)}
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
      ) : null}

      {canSubmit ? (
        <ThemedView variant="surface" style={styles.card}>
          <ThemedText type="sectionHeader">제출 전 확인</ThemedText>
          <View style={styles.choiceList}>
            <Pressable
              onPress={() => setAcceptedMaskingGuide((current) => !current)}
              style={({ pressed }) => [
                styles.choice,
                { borderColor: colors.border },
                acceptedMaskingGuide && styles.choiceSelected,
                pressed && { opacity: 0.7 },
              ]}>
              <View style={styles.checkboxRow}>
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: colors.border },
                    acceptedMaskingGuide && { backgroundColor: Brand.primary, borderColor: Brand.primary },
                  ]}>
                  {acceptedMaskingGuide ? <ThemedText style={{ color: '#FFFFFF', fontSize: 12, lineHeight: 16 }}>✓</ThemedText> : null}
                </View>
                <ThemedText type="defaultSemiBold" style={{ flex: 1 }}>
                  {acceptedMaskingGuide
                    ? '민감정보 마스킹 안내 확인 완료'
                    : '주민번호 등 민감정보는 가리고 제출하겠습니다'}
                </ThemedText>
              </View>
            </Pressable>
            <Pressable
              onPress={() => setAcceptedEvidenceChecklist((current) => !current)}
              style={({ pressed }) => [
                styles.choice,
                { borderColor: colors.border },
                acceptedEvidenceChecklist && styles.choiceSelected,
                pressed && { opacity: 0.7 },
              ]}>
              <View style={styles.checkboxRow}>
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: colors.border },
                    acceptedEvidenceChecklist && { backgroundColor: Brand.primary, borderColor: Brand.primary },
                  ]}>
                  {acceptedEvidenceChecklist ? <ThemedText style={{ color: '#FFFFFF', fontSize: 12, lineHeight: 16 }}>✓</ThemedText> : null}
                </View>
                <ThemedText type="defaultSemiBold" style={{ flex: 1 }}>
                  {acceptedEvidenceChecklist
                    ? '재학 증빙 준비 확인 완료'
                    : '학생증 또는 재학 확인 자료를 준비했습니다'}
                </ThemedText>
              </View>
            </Pressable>
          </View>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            실제 이미지 업로드는 다음 단계에서 연결합니다. 지금은 제출 상태와 검토 흐름을 먼저
            확인합니다.
          </ThemedText>
          <ThemedText type="caption" style={{ color: colors.textTertiary }}>
            {EVIDENCE_RETENTION.default}
          </ThemedText>
          {feedback ? (
            <View style={[styles.feedbackBanner, { backgroundColor: colors.warningBackground, borderColor: colors.warningBorder }]}>
              <ThemedText>{feedback}</ThemedText>
            </View>
          ) : null}
        </ThemedView>
      ) : null}

      {verificationRecord?.method === 'student_id_manual' ? (
        <ThemedView variant="surface" style={styles.card}>
          <ThemedText type="sectionHeader">최근 인증 요청 요약</ThemedText>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <ThemedText type="caption" style={{ color: colors.textTertiary }}>제출 유형</ThemedText>
              <ThemedText>{verificationRecord.submittedLabel ?? '학생증 수동 인증'}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText type="caption" style={{ color: colors.textTertiary }}>제출 시각</ThemedText>
              <ThemedText>{formatDateTimeLabel(verificationRecord.submittedAt)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText type="caption" style={{ color: colors.textTertiary }}>검토 시각</ThemedText>
              <ThemedText>{formatDateTimeLabel(verificationRecord.reviewedAt)}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText type="caption" style={{ color: colors.textTertiary }}>상태</ThemedText>
              <ThemedText>{verificationRecord.status}</ThemedText>
            </View>
          </View>
        </ThemedView>
      ) : null}

      <View style={styles.actions}>
        {canSubmit ? (
          <Pressable
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.7 },
              isSubmitting && { opacity: 0.5 },
            ]}
            onPress={() => void handleSubmit()}>
            <ThemedText style={styles.primaryButtonText}>
              {isSubmitting
                ? '제출 중...'
                : isManualPendingLocalRetry
                  ? '학생증 수동 인증 다시 시도'
                  : profile.verificationStatus === 'rejected'
                  ? '학생증 수동 인증 재제출'
                  : '학생증 수동 인증 제출'}
            </ThemedText>
          </Pressable>
        ) : null}

        {!isAuthenticated ? (
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => router.push('../email')}>
            <ThemedText type="defaultSemiBold">일반 이메일 계정 만들기 / 로그인</ThemedText>
          </Pressable>
        ) : null}

        {profile.verificationStatus === 'verified' && !profile.onboardingCompleted ? (
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => router.push('../onboarding')}>
            <ThemedText type="defaultSemiBold">온보딩 이어서 진행</ThemedText>
          </Pressable>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => router.push('../email')}>
          <ThemedText type="defaultSemiBold">학교 이메일 인증으로 돌아가기</ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.ghostButton,
            { borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => router.back()}>
          <ThemedText type="defaultSemiBold">이전 화면</ThemedText>
        </Pressable>
      </View>
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
  warningCard: {
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  errorCard: {
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  infoGrid: {
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
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
  actions: {
    gap: Spacing.sm,
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
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  ghostButton: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
});
