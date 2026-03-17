import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import {
  EVIDENCE_RETENTION,
  MANUAL_VERIFICATION_SLA,
  VERIFICATION_STATUS_LABELS,
} from '@/constants/auth-policy';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAppSession } from '@/hooks/use-app-session';
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
    return null;
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
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedText type="title">학생증 수동 인증</ThemedText>
      <ThemedText>
        학교 이메일이 없는 경우를 위한 fallback 인증 단계입니다. 이번 단계에서는 실제 이미지
        업로드 대신 제출 상태와 검토 흐름을 먼저 연결합니다.
      </ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">현재 상태</ThemedText>
        <ThemedText>로그인: {isAuthenticated ? '완료' : '미로그인'}</ThemedText>
        <ThemedText>이메일: {authEmail ?? '미입력'}</ThemedText>
        <ThemedText>인증 상태: {VERIFICATION_STATUS_LABELS[profile.verificationStatus]}</ThemedText>
        <ThemedText>학교: {verificationUniversity?.name ?? '미선택'}</ThemedText>
        <ThemedText>
          인증 요청 저장 위치:{' '}
          {verificationStorageMode === 'supabase'
            ? 'Supabase verifications'
            : verificationStorageMode === 'local_retry'
              ? '로컬 재시도 필요 상태'
              : verificationStorageMode === 'local_cache'
              ? '로컬 캐시'
              : '인증 기반 기본 상태'}
        </ThemedText>
        {verificationSyncMessage ? <ThemedText>{verificationSyncMessage}</ThemedText> : null}
      </ThemedView>

      {!isAuthenticated ? (
        <ThemedView style={styles.warningCard}>
          <ThemedText type="subtitle">먼저 계정 로그인이 필요합니다</ThemedText>
          <ThemedText>
            학생증 수동 인증은 일반 이메일 또는 학교 이메일로 계정을 만든 뒤 로그인한 상태에서만
            진행할 수 있습니다.
          </ThemedText>
        </ThemedView>
      ) : null}

      {isEmailPending ? (
        <ThemedView style={styles.warningCard}>
          <ThemedText type="subtitle">학교 이메일 확인이 먼저 필요합니다</ThemedText>
          <ThemedText>
            현재 계정은 학생증 수동 인증 검토 중이 아니라 학교 이메일 인증 대기 상태입니다. 메일함의
            확인 링크를 먼저 눌러 주세요.
          </ThemedText>
        </ThemedView>
      ) : null}

      {isManualPendingOnServer ? (
        <ThemedView style={styles.warningCard}>
          <ThemedText type="subtitle">검토 대기 중</ThemedText>
          <ThemedText>
            제출 시간: {formatDateTimeLabel(verificationRecord?.submittedAt)}
          </ThemedText>
          <ThemedText>제출 학교: {verificationUniversity?.name ?? '미선택'}</ThemedText>
          <ThemedText>{MANUAL_VERIFICATION_SLA.acknowledgement}</ThemedText>
          <ThemedText>{MANUAL_VERIFICATION_SLA.resolution}</ThemedText>
        </ThemedView>
      ) : null}

      {isManualPendingLocalRetry ? (
        <ThemedView style={styles.warningCard}>
          <ThemedText type="subtitle">재시도가 필요합니다</ThemedText>
          <ThemedText>
            최근 제출은 로컬에만 임시 저장되어 아직 서버 검토 대기 상태가 아닐 수 있습니다.
          </ThemedText>
          <ThemedText>
            제출 시간: {formatDateTimeLabel(verificationRecord?.submittedAt)}
          </ThemedText>
          <ThemedText>제출 학교: {verificationUniversity?.name ?? '미선택'}</ThemedText>
          <ThemedText>
            네트워크가 안정되면 아래 버튼으로 다시 제출해 주세요.
          </ThemedText>
          {verificationSyncMessage ? <ThemedText>{verificationSyncMessage}</ThemedText> : null}
        </ThemedView>
      ) : null}

      {isManualRejected ? (
        <ThemedView style={styles.warningCard}>
          <ThemedText type="subtitle">재제출이 필요합니다</ThemedText>
          <ThemedText>
            반려 사유: {verificationRecord?.rejectionReason ?? '제출 자료 확인이 어려웠습니다.'}
          </ThemedText>
          <ThemedText>
            학교를 다시 선택하고 안내를 확인한 뒤 재제출할 수 있습니다.
          </ThemedText>
        </ThemedView>
      ) : null}

      {isPendingWithoutManualRecord ? (
        <ThemedView style={styles.warningCard}>
          <ThemedText type="subtitle">제출 기록을 다시 확인해 주세요</ThemedText>
          <ThemedText>
            현재는 대기 상태로 보이지만, 최근 학생증 제출 기록을 찾지 못했습니다. 다시 제출하면
            상태를 복구할 수 있습니다.
          </ThemedText>
        </ThemedView>
      ) : null}

      {profile.verificationStatus === 'verified' ? (
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">인증 완료</ThemedText>
          <ThemedText>
            현재 계정은 이미 인증이 완료되었습니다. 온보딩이 남아 있다면 이어서 진행하면 됩니다.
          </ThemedText>
        </ThemedView>
      ) : null}

      {isAuthenticated && hasSchoolEmailPath && profile.verificationStatus !== 'verified' ? (
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">학교 이메일 우선 경로 사용 계정</ThemedText>
          <ThemedText>
            현재 이메일은 지원 학교 도메인으로 확인됩니다. 이 계정은 학생증 fallback보다 학교
            이메일 인증을 우선 사용하는 것이 맞습니다.
          </ThemedText>
        </ThemedView>
      ) : null}

      {canSubmit ? (
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">학교 선택</ThemedText>
          <ThemedText>
            학생증 또는 재학 증빙을 제출할 학교를 선택합니다. 학교 보드 접근 기준에도 이 값이
            사용됩니다.
          </ThemedText>
          {SUPPORTED_UNIVERSITIES.map((item) => {
            const selected = selectedUniversityId === item.id;

            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedUniversityId(item.id)}
                style={[
                  styles.choice,
                  selected && styles.choiceSelected,
                ]}>
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <ThemedText>{item.region}</ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>
      ) : null}

      {canSubmit ? (
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">제출 전 확인</ThemedText>
          <Pressable
            onPress={() => setAcceptedMaskingGuide((current) => !current)}
            style={[styles.choice, acceptedMaskingGuide && styles.choiceSelected]}>
            <ThemedText type="defaultSemiBold">
              {acceptedMaskingGuide
                ? '민감정보 마스킹 안내 확인 완료'
                : '주민번호 등 민감정보는 가리고 제출하겠습니다'}
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setAcceptedEvidenceChecklist((current) => !current)}
            style={[styles.choice, acceptedEvidenceChecklist && styles.choiceSelected]}>
            <ThemedText type="defaultSemiBold">
              {acceptedEvidenceChecklist
                ? '재학 증빙 준비 확인 완료'
                : '학생증 또는 재학 확인 자료를 준비했습니다'}
            </ThemedText>
          </Pressable>
          <ThemedText>
            실제 이미지 업로드는 다음 단계에서 연결합니다. 지금은 제출 상태와 검토 흐름을 먼저
            확인합니다.
          </ThemedText>
          <ThemedText>{EVIDENCE_RETENTION.default}</ThemedText>
          {feedback ? <ThemedText>{feedback}</ThemedText> : null}
        </ThemedView>
      ) : null}

      {verificationRecord?.method === 'student_id_manual' ? (
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">최근 인증 요청 요약</ThemedText>
          <ThemedText>제출 유형: {verificationRecord.submittedLabel ?? '학생증 수동 인증'}</ThemedText>
          <ThemedText>제출 시각: {formatDateTimeLabel(verificationRecord.submittedAt)}</ThemedText>
          <ThemedText>검토 시각: {formatDateTimeLabel(verificationRecord.reviewedAt)}</ThemedText>
          <ThemedText>상태: {verificationRecord.status}</ThemedText>
        </ThemedView>
      ) : null}

      <ThemedView style={styles.actions}>
        {canSubmit ? (
          <Pressable
            disabled={isSubmitting}
            style={styles.primaryButton}
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
          <Pressable style={styles.secondaryButton} onPress={() => router.push('../email')}>
            <ThemedText type="defaultSemiBold">일반 이메일 계정 만들기 / 로그인</ThemedText>
          </Pressable>
        ) : null}

        {profile.verificationStatus === 'verified' && !profile.onboardingCompleted ? (
          <Pressable style={styles.secondaryButton} onPress={() => router.push('../onboarding')}>
            <ThemedText type="defaultSemiBold">온보딩 이어서 진행</ThemedText>
          </Pressable>
        ) : null}

        <Pressable style={styles.secondaryButton} onPress={() => router.push('../email')}>
          <ThemedText type="defaultSemiBold">학교 이메일 인증으로 돌아가기</ThemedText>
        </Pressable>
        <Pressable style={styles.ghostButton} onPress={() => router.back()}>
          <ThemedText type="defaultSemiBold">이전 화면</ThemedText>
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
  },
  card: {
    gap: 10,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  warningCard: {
    gap: 8,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(194, 106, 61, 0.12)',
  },
  choice: {
    gap: 4,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  choiceSelected: {
    backgroundColor: 'rgba(30, 95, 175, 0.14)',
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#1E5FAF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  ghostButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
});
