import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ACCOUNT_STATUS_LABELS,
  EVIDENCE_RETENTION,
  MANUAL_VERIFICATION_SLA,
  VERIFICATION_STATUS_LABELS,
} from '@/constants/auth-policy';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppSession } from '@/hooks/use-app-session';
import { useCommunityData } from '@/hooks/use-community-data';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useThemeColors } from '@/hooks/use-theme-color';
import { getMajorGroupById, getUniversityById } from '@/lib/community/metadata';

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
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

  const handleSignOut = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            const result = await signOut();

            if (!result.ok) {
              setFeedback(result.message ?? '로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.');
              return;
            }

            setFeedback(undefined);
            router.replace('/');
          },
        },
      ],
    );
  };

  const handleUnblockProfile = (blockedProfileId: string) => {
    Alert.alert(
      '차단 해제',
      '이 사용자의 차단을 해제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '해제',
          onPress: async () => {
            const result = await unblockProfile(blockedProfileId);
            setFeedback(result.message);
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
      <ThemedText type="title">프로필</ThemedText>
      <ThemedText type="caption" style={{ color: colors.textSecondary }}>
        인증 상태, 전공군, 학교 정보와 Phase 1 데모 제어를 먼저 배치한 화면 골격입니다.
      </ThemedText>

      <ThemedView variant="surface" style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="person-outline" size={14} color={colors.textTertiary} />
          <ThemedText type="sectionHeader">내 상태</ThemedText>
        </View>
        <ThemedText type="subtitle">{profile.nickname}</ThemedText>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <View style={[styles.statusBadge, { backgroundColor: Brand.successMuted }]}>
            <ThemedText type="caption" style={{ color: Brand.success, fontSize: 12 }}>
              {VERIFICATION_STATUS_LABELS[profile.verificationStatus]}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: Brand.primaryMuted }]}>
            <ThemedText type="caption" style={{ color: Brand.primary, fontSize: 12 }}>
              {ACCOUNT_STATUS_LABELS[profile.accountStatus]}
            </ThemedText>
          </View>
        </View>
        {profileSyncMessage ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            {profileSyncMessage}
          </ThemedText>
        ) : null}
        {feedback ? (
          <View style={[styles.feedbackBanner, { backgroundColor: colors.warningBackground, borderColor: colors.warningBorder }]}>
            <ThemedText>{feedback}</ThemedText>
          </View>
        ) : null}
      </ThemedView>

      <ThemedView variant="surface" style={styles.card}>
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <ThemedText type="caption" style={{ color: colors.textTertiary }}>로그인 이메일</ThemedText>
            <ThemedText>{currentEmail ?? '미로그인'}</ThemedText>
          </View>
          <View style={styles.gridRow}>
            <ThemedText type="caption" style={{ color: colors.textTertiary }}>학교</ThemedText>
            <ThemedText>{university?.name ?? '미선택'}</ThemedText>
          </View>
          <View style={styles.gridRow}>
            <ThemedText type="caption" style={{ color: colors.textTertiary }}>전공군</ThemedText>
            <ThemedText>{majorGroup?.label ?? '미선택'}</ThemedText>
          </View>
          <View style={styles.gridRow}>
            <ThemedText type="caption" style={{ color: colors.textTertiary }}>인증 방식</ThemedText>
            <ThemedText>{verificationMethod ?? '미설정'}</ThemedText>
          </View>
          <View style={styles.gridRow}>
            <ThemedText type="caption" style={{ color: colors.textTertiary }}>프로필 저장 위치</ThemedText>
            <ThemedText>
              {profileStorageMode === 'supabase' ? 'Supabase profiles' : profileStorageMode === 'local_cache' ? '로컬 캐시' : '인증 기반 초기 상태'}
            </ThemedText>
          </View>
        </View>
      </ThemedView>

      <ThemedView variant="surface" style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.textTertiary} />
          <ThemedText type="sectionHeader">운영 기준 요약</ThemedText>
        </View>
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          {MANUAL_VERIFICATION_SLA.acknowledgement}
        </ThemedText>
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          {MANUAL_VERIFICATION_SLA.resolution}
        </ThemedText>
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          {EVIDENCE_RETENTION.default}
        </ThemedText>
      </ThemedView>

      <ThemedView variant="surface" style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="ban-outline" size={14} color={colors.textTertiary} />
          <ThemedText type="sectionHeader">차단 목록</ThemedText>
        </View>
        {blockedProfiles.length === 0 ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            아직 차단한 사용자가 없습니다.
          </ThemedText>
        ) : (
          blockedProfiles.map((entry) => {
            const blockedUniversity = getUniversityById(entry.primaryUniversityId);
            const blockedMajorGroup = getMajorGroupById(entry.primaryMajorGroupId);

            return (
              <View
                key={entry.profileId}
                style={[styles.blockedItem, { borderBottomColor: colors.border }]}>
                <ThemedText type="defaultSemiBold">{entry.displayName}</ThemedText>
                {blockedUniversity ? (
                  <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                    학교: {blockedUniversity.name}
                  </ThemedText>
                ) : null}
                {blockedMajorGroup ? (
                  <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                    전공군: {blockedMajorGroup.label}
                  </ThemedText>
                ) : null}
                {!entry.profile ? (
                  <ThemedText type="caption" style={{ color: colors.textTertiary }}>
                    현재는 기본 차단 정보만 보이며, 차단 해제는 계속 가능합니다.
                  </ThemedText>
                ) : null}
                <ThemedText type="caption" style={{ color: colors.textTertiary }}>
                  차단 시각: {new Date(entry.blockedAt).toLocaleDateString('ko-KR')}
                </ThemedText>
                <Pressable
                  accessibilityLabel={`${entry.displayName} 차단 해제`}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleUnblockProfile(entry.profileId)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="close-circle-outline" size={16} color={colors.text} />
                    <ThemedText type="defaultSemiBold">차단 해제</ThemedText>
                  </View>
                </Pressable>
              </View>
            );
          })
        )}
      </ThemedView>

      <ThemedView variant="surface" style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="settings-outline" size={14} color={colors.textTertiary} />
          <ThemedText type="sectionHeader">세션 및 로컬 데모 상태</ThemedText>
        </View>
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          아래 계정 상태 전환 버튼은 서버 moderation UI가 아니라 현재 기기에서만 확인하는 로컬
          데모 제어입니다.
        </ThemedText>

        <View style={styles.buttonGroup}>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => setAccountStatus('active')}>
            <ThemedText type="defaultSemiBold">정상 상태로 전환</ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => setAccountStatus('restricted')}>
            <ThemedText type="defaultSemiBold">읽기 전용 상태로 전환</ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.ghostButton,
              { borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleResetLocalProfile}>
            <ThemedText type="defaultSemiBold">로컬 온보딩 상태 초기화</ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityLabel="로그아웃"
            accessibilityRole="button"
            onPress={handleSignOut}>
            <ThemedText style={styles.primaryButtonText}>로그아웃</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
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
  grid: {
    gap: Spacing.sm,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  statusBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
  },
  feedbackBanner: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  blockedItem: {
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  buttonGroup: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
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
