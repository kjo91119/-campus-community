import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { ACCOUNT_STATUS_LABELS, VERIFICATION_STATUS_LABELS } from '@/constants/auth-policy';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAppSession } from '@/hooks/use-app-session';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { getMajorGroupById, getUniversityById } from '@/lib/community/metadata';

export default function AuthStartScreen() {
  const router = useRouter();
  const { track } = useAnalytics();
  const { bootstrap, currentEmail, isAuthenticated, pendingEmailConfirmation } = useSupabaseAuth();
  const { authEmail, isHydrating, profile, rejectionReason, verificationMethod } = useAppSession();
  const university = getUniversityById(profile.primaryUniversityId);
  const majorGroup = getMajorGroupById(profile.primaryMajorGroupId);

  if (isHydrating) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.hero}>
        <ThemedText type="title">전공 네트워크 시작</ThemedText>
        <ThemedText>
          보건의료기사 계열 학생이 학교 인증을 기반으로 전공군 정보와 모집을 교류하는 앱
          골격입니다.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">현재 인증 상태</ThemedText>
        <ThemedText>로그인: {isAuthenticated ? '완료' : '미로그인'}</ThemedText>
        <ThemedText>이메일: {authEmail ?? currentEmail ?? '미입력'}</ThemedText>
        <ThemedText>
          인증: {VERIFICATION_STATUS_LABELS[profile.verificationStatus]} / 계정:{' '}
          {ACCOUNT_STATUS_LABELS[profile.accountStatus]}
        </ThemedText>
        <ThemedText>
          학교: {university?.name ?? '미선택'} / 전공군: {majorGroup?.label ?? '미선택'}
        </ThemedText>
        <ThemedText>인증 방식: {verificationMethod ?? '아직 없음'}</ThemedText>
      </ThemedView>

      {bootstrap.status !== 'ready_for_client_wiring' ? (
        <ThemedView style={styles.warningCard}>
          <ThemedText type="subtitle">Supabase 환경 확인 필요</ThemedText>
          <ThemedText>
            현재 auth client가 바로 초기화되지 않았습니다. `.env`의 URL과 key를 먼저 확인해
            주세요.
          </ThemedText>
        </ThemedView>
      ) : null}

      {pendingEmailConfirmation ? (
        <ThemedView style={styles.warningCard}>
          <ThemedText type="subtitle">이메일 확인 대기</ThemedText>
          <ThemedText>
            {pendingEmailConfirmation} 주소로 전송된 인증 링크를 확인한 뒤 로그인해 주세요.
          </ThemedText>
        </ThemedView>
      ) : null}

      {profile.verificationStatus === 'pending' && verificationMethod === 'email' ? (
        <ThemedView style={styles.warningCard}>
          <ThemedText type="subtitle">인증 완료 대기</ThemedText>
          <ThemedText>
            학교 이메일 인증이 아직 완료되지 않았습니다. 이메일 링크를 확인한 뒤 다시
            로그인하면 온보딩으로 이어집니다.
          </ThemedText>
        </ThemedView>
      ) : null}

      {profile.verificationStatus === 'pending' && verificationMethod === 'student_id_manual' ? (
        <ThemedView style={styles.warningCard}>
          <ThemedText type="subtitle">학생증 검토 대기</ThemedText>
          <ThemedText>
            학생증 수동 인증 요청이 접수되었습니다. 검토 결과가 나올 때까지 잠시 기다려 주세요.
          </ThemedText>
        </ThemedView>
      ) : null}

      {profile.verificationStatus === 'rejected' ? (
        <ThemedView style={styles.warningCard}>
          <ThemedText type="subtitle">학생증 재제출 필요</ThemedText>
          <ThemedText>
            {rejectionReason ?? '제출 자료 재확인이 필요합니다. 학생증 수동 인증 화면에서 다시 제출해 주세요.'}
          </ThemedText>
        </ThemedView>
      ) : null}

      {profile.accountStatus === 'restricted' ? (
        <ThemedView style={styles.warningCard}>
          <ThemedText type="subtitle">읽기 전용 상태</ThemedText>
          <ThemedText>
            현재 계정은 운영 제재 상태라 커뮤니티를 읽기만 할 수 있습니다. 글쓰기, 댓글,
            모집 등록은 잠시 제한됩니다.
          </ThemedText>
        </ThemedView>
      ) : null}

      {profile.accountStatus === 'banned' ? (
        <ThemedView style={styles.warningCard}>
          <ThemedText type="subtitle">계정 이용 정지</ThemedText>
          <ThemedText>
            현재 계정은 운영 정지 상태라 커뮤니티 접근이 잠겨 있습니다. 이의제기 정책과 운영
            기준을 확인한 뒤 문의해 주세요.
          </ThemedText>
        </ThemedView>
      ) : null}

      {isAuthenticated && profile.verificationStatus === 'unverified' ? (
        <ThemedView style={styles.warningCard}>
          <ThemedText type="subtitle">학교 인증이 아직 필요합니다</ThemedText>
          <ThemedText>
            학교 이메일이 없거나 빠른 인증을 쓰지 않은 계정입니다. 학생증 수동 인증을 진행해야
            커뮤니티 접근이 열립니다.
          </ThemedText>
        </ThemedView>
      ) : null}

      <ThemedView style={styles.actions}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            track('auth_started', { entry: 'auth_start', path: 'school_email' });
            router.push('./email');
          }}>
          <ThemedText style={styles.primaryButtonText}>학교 이메일로 시작</ThemedText>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => {
            router.push('./manual-verification');
          }}>
          <ThemedText type="defaultSemiBold">
            {isAuthenticated ? '학생증 수동 인증 진행' : '학교 이메일이 없어요'}
          </ThemedText>
        </Pressable>
        {profile.verificationStatus === 'verified' && !profile.onboardingCompleted ? (
          <Pressable style={styles.secondaryButton} onPress={() => router.push('./onboarding')}>
            <ThemedText type="defaultSemiBold">온보딩 이어서 진행</ThemedText>
          </Pressable>
        ) : null}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
  },
  hero: {
    gap: 10,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(75, 130, 195, 0.10)',
  },
  card: {
    gap: 8,
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
