import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { ACCOUNT_STATUS_LABELS, VERIFICATION_STATUS_LABELS } from '@/constants/auth-policy';
import { getMajorGroupById, getUniversityById } from '@/data/mock-community';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppSession } from '@/hooks/use-app-session';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';

export default function AuthStartScreen() {
  const router = useRouter();
  const { bootstrap, currentEmail, isAuthenticated, pendingEmailConfirmation } = useSupabaseAuth();
  const { authEmail, isHydrating, profile, verificationMethod } = useAppSession();
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

      {profile.verificationStatus === 'pending' ? (
        <ThemedView style={styles.warningCard}>
          <ThemedText type="subtitle">인증 완료 대기</ThemedText>
          <ThemedText>
            학교 이메일 인증이 아직 완료되지 않았습니다. 이메일 링크를 확인한 뒤 다시
            로그인하면 온보딩으로 이어집니다.
          </ThemedText>
        </ThemedView>
      ) : null}

      <ThemedView style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={() => router.push('./email')}>
          <ThemedText style={styles.primaryButtonText}>학교 이메일로 시작</ThemedText>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.push('./manual-verification')}>
          <ThemedText type="defaultSemiBold">학생증 수동 인증</ThemedText>
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
