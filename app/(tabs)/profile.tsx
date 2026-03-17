import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import {
  ACCOUNT_STATUS_LABELS,
  EVIDENCE_RETENTION,
  MANUAL_VERIFICATION_SLA,
  VERIFICATION_STATUS_LABELS,
} from '@/constants/auth-policy';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppSession } from '@/hooks/use-app-session';
import { useCommunityData } from '@/hooks/use-community-data';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { getMajorGroupById, getUniversityById } from '@/lib/community/metadata';

export default function ProfileScreen() {
  const router = useRouter();
  const { currentEmail, signOut } = useSupabaseAuth();
  const { getBlockedProfiles, unblockProfile } = useCommunityData();
  const {
    profile,
    profileStorageMode,
    profileSyncMessage,
    verificationMethod,
    setAccountStatus,
    resetDemo,
  } = useAppSession();
  const [feedback, setFeedback] = useState<string | undefined>();
  const university = getUniversityById(profile.primaryUniversityId);
  const majorGroup = getMajorGroupById(profile.primaryMajorGroupId);
  const blockedProfiles = getBlockedProfiles();

  const handleResetLocalProfile = () => {
    resetDemo();
  };

  const handleSignOut = async () => {
    const result = await signOut();

    if (!result.ok) {
      setFeedback(result.message ?? '로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    setFeedback(undefined);
    router.replace('/');
  };

  const handleUnblockProfile = async (blockedProfileId: string) => {
    const result = await unblockProfile(blockedProfileId);
    setFeedback(result.message);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.hero}>
        <ThemedText type="title">프로필</ThemedText>
        <ThemedText>
          인증 상태, 전공군, 학교 정보와 Phase 1 데모 제어를 먼저 배치한 화면 골격입니다.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">내 상태</ThemedText>
        <ThemedText>닉네임: {profile.nickname}</ThemedText>
        <ThemedText>인증 상태: {VERIFICATION_STATUS_LABELS[profile.verificationStatus]}</ThemedText>
        <ThemedText>계정 상태: {ACCOUNT_STATUS_LABELS[profile.accountStatus]}</ThemedText>
        <ThemedText>로그인 이메일: {currentEmail ?? '미로그인'}</ThemedText>
        <ThemedText>학교: {university?.name ?? '미선택'}</ThemedText>
        <ThemedText>전공군: {majorGroup?.label ?? '미선택'}</ThemedText>
        <ThemedText>인증 방식: {verificationMethod ?? '미설정'}</ThemedText>
        <ThemedText>
          프로필 저장 위치: {profileStorageMode === 'supabase' ? 'Supabase profiles' : profileStorageMode === 'local_cache' ? '로컬 캐시' : '인증 기반 초기 상태'}
        </ThemedText>
        {profileSyncMessage ? <ThemedText>{profileSyncMessage}</ThemedText> : null}
        {feedback ? <ThemedText>{feedback}</ThemedText> : null}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">운영 기준 요약</ThemedText>
        <ThemedText>{MANUAL_VERIFICATION_SLA.acknowledgement}</ThemedText>
        <ThemedText>{MANUAL_VERIFICATION_SLA.resolution}</ThemedText>
        <ThemedText>{EVIDENCE_RETENTION.default}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">차단 목록</ThemedText>
        {blockedProfiles.length === 0 ? (
          <ThemedText>아직 차단한 사용자가 없습니다.</ThemedText>
        ) : (
          blockedProfiles.map((entry) => {
            const blockedUniversity = getUniversityById(entry.primaryUniversityId);
            const blockedMajorGroup = getMajorGroupById(entry.primaryMajorGroupId);

            return (
              <ThemedView key={entry.profileId} style={styles.blockedItem}>
                <ThemedText type="defaultSemiBold">{entry.displayName}</ThemedText>
                {blockedUniversity ? <ThemedText>학교: {blockedUniversity.name}</ThemedText> : null}
                {blockedMajorGroup ? <ThemedText>전공군: {blockedMajorGroup.label}</ThemedText> : null}
                {!entry.profile ? (
                  <ThemedText>현재는 기본 차단 정보만 보이며, 차단 해제는 계속 가능합니다.</ThemedText>
                ) : null}
                <ThemedText>
                  차단 시각: {new Date(entry.blockedAt).toLocaleDateString('ko-KR')}
                </ThemedText>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => void handleUnblockProfile(entry.profileId)}>
                  <ThemedText type="defaultSemiBold">차단 해제</ThemedText>
                </Pressable>
              </ThemedView>
            );
          })
        )}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">세션 및 로컬 데모 상태</ThemedText>
        <ThemedText>
          아래 계정 상태 전환 버튼은 서버 moderation UI가 아니라 현재 기기에서만 확인하는 로컬
          데모 제어입니다.
        </ThemedText>
        <Pressable style={styles.secondaryButton} onPress={() => setAccountStatus('active')}>
          <ThemedText type="defaultSemiBold">정상 상태로 전환</ThemedText>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => setAccountStatus('restricted')}>
          <ThemedText type="defaultSemiBold">읽기 전용 상태로 전환</ThemedText>
        </Pressable>
        <Pressable style={styles.ghostButton} onPress={handleResetLocalProfile}>
          <ThemedText type="defaultSemiBold">로컬 온보딩 상태 초기화</ThemedText>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={() => void handleSignOut()}>
          <ThemedText style={styles.primaryButtonText}>로그아웃</ThemedText>
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
  hero: {
    gap: 10,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(194, 106, 61, 0.12)',
  },
  card: {
    gap: 10,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  blockedItem: {
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.10)',
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
});
