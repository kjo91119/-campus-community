import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ACCOUNT_STATUS_LABELS, VERIFICATION_STATUS_LABELS } from '@/constants/auth-policy';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { SkeletonDetail } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAppSession } from '@/hooks/use-app-session';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useThemeColors } from '@/hooks/use-theme-color';
import { getMajorGroupById, getUniversityById } from '@/lib/community/metadata';

export default function AuthStartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const { bootstrap, currentEmail, isAuthenticated, pendingEmailConfirmation } = useSupabaseAuth();
  const { authEmail, isHydrating, profile, rejectionReason, verificationMethod } = useAppSession();
  const university = getUniversityById(profile.primaryUniversityId);
  const majorGroup = getMajorGroupById(profile.primaryMajorGroupId);

  if (isHydrating) {
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xl }]}>
        <SkeletonDetail />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xl }]}>

      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: Brand.primaryMuted }]}>
        <View style={styles.heroIconRow}>
          <View style={styles.heroIconRing}>
            <View style={[styles.heroIcon, { backgroundColor: Brand.primary }]}>
              <Ionicons name="medical-outline" size={32} color={Brand.primary} />
            </View>
          </View>
        </View>
        <ThemedText type="title">전공 네트워크</ThemedText>
        <ThemedText style={{ color: colors.textSecondary }}>
          보건의료계열 학생이 학교 인증을 기반으로{'\n'}전공군 정보와 모집을 교류하는 커뮤니티
        </ThemedText>
      </View>

      {/* Current status card */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">현재 인증 상태</ThemedText>
        <View style={styles.statusGrid}>
          <StatusRow label="로그인" value={isAuthenticated ? '완료' : '미로그인'} colors={colors} />
          <StatusRow label="이메일" value={authEmail ?? currentEmail ?? '미입력'} colors={colors} />
          <StatusRow
            label="인증"
            value={VERIFICATION_STATUS_LABELS[profile.verificationStatus]}
            colors={colors}
          />
          <StatusRow
            label="계정"
            value={ACCOUNT_STATUS_LABELS[profile.accountStatus]}
            colors={colors}
          />
          <StatusRow label="학교" value={university?.name ?? '미선택'} colors={colors} />
          <StatusRow label="전공군" value={majorGroup?.label ?? '미선택'} colors={colors} />
        </View>
      </ThemedView>

      {/* Warning cards */}
      {bootstrap.status !== 'ready_for_client_wiring' ? (
        <WarningCard
          title="Supabase 환경 확인 필요"
          body="현재 auth client가 바로 초기화되지 않았습니다. .env의 URL과 key를 먼저 확인해 주세요."
          colors={colors}
        />
      ) : null}

      {pendingEmailConfirmation ? (
        <WarningCard
          title="이메일 확인 대기"
          body={`${pendingEmailConfirmation} 주소로 전송된 인증 링크를 확인한 뒤 로그인해 주세요.`}
          colors={colors}
        />
      ) : null}

      {profile.verificationStatus === 'pending' && verificationMethod === 'email' ? (
        <WarningCard
          title="인증 완료 대기"
          body="학교 이메일 인증이 아직 완료되지 않았습니다. 이메일 링크를 확인한 뒤 다시 로그인하면 온보딩으로 이어집니다."
          colors={colors}
        />
      ) : null}

      {profile.verificationStatus === 'pending' && verificationMethod === 'student_id_manual' ? (
        <WarningCard
          title="학생증 검토 대기"
          body="학생증 수동 인증 요청이 접수되었습니다. 검토 결과가 나올 때까지 잠시 기다려 주세요."
          colors={colors}
        />
      ) : null}

      {profile.verificationStatus === 'rejected' ? (
        <WarningCard
          title="학생증 재제출 필요"
          body={rejectionReason ?? '제출 자료 재확인이 필요합니다. 학생증 수동 인증 화면에서 다시 제출해 주세요.'}
          colors={colors}
          variant="error"
        />
      ) : null}

      {profile.accountStatus === 'restricted' ? (
        <WarningCard
          title="읽기 전용 상태"
          body="현재 계정은 운영 제재 상태라 커뮤니티를 읽기만 할 수 있습니다."
          colors={colors}
        />
      ) : null}

      {profile.accountStatus === 'banned' ? (
        <WarningCard
          title="계정 이용 정지"
          body="현재 계정은 운영 정지 상태라 커뮤니티 접근이 잠겨 있습니다."
          colors={colors}
          variant="error"
        />
      ) : null}

      {isAuthenticated && profile.verificationStatus === 'unverified' ? (
        <WarningCard
          title="학교 인증이 아직 필요합니다"
          body="학생증 수동 인증을 진행해야 커뮤니티 접근이 열립니다."
          colors={colors}
        />
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: Brand.primary },
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => {
            track('auth_started', { entry: 'auth_start', path: 'school_email' });
            router.push('./email');
          }}>
          <ThemedText style={styles.primaryButtonText}>학교 이메일로 시작</ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            pressed && { backgroundColor: colors.surfacePressed },
          ]}
          onPress={() => router.push('./manual-verification')}>
          <ThemedText type="defaultSemiBold">
            {isAuthenticated ? '학생증 수동 인증 진행' : '학교 이메일이 없어요'}
          </ThemedText>
        </Pressable>
        {profile.verificationStatus === 'verified' && !profile.onboardingCompleted ? (
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
              pressed && { backgroundColor: colors.surfacePressed },
            ]}
            onPress={() => router.push('./onboarding')}>
            <ThemedText type="defaultSemiBold">온보딩 이어서 진행</ThemedText>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

/* ─── Sub-components ─── */

function StatusRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={styles.statusRow}>
      <ThemedText type="caption" style={{ color: colors.textTertiary, minWidth: 52 }}>
        {label}
      </ThemedText>
      <ThemedText type="caption" style={{ flex: 1 }}>
        {value}
      </ThemedText>
    </View>
  );
}

function WarningCard({
  title,
  body,
  colors,
  variant = 'warning',
}: {
  title: string;
  body: string;
  colors: ReturnType<typeof useThemeColors>;
  variant?: 'warning' | 'error';
}) {
  const bg = variant === 'error' ? colors.errorBackground : colors.warningBackground;
  const border = variant === 'error' ? colors.errorBorder : colors.warningBorder;
  const text = variant === 'error' ? colors.errorText : colors.warningText;

  return (
    <View style={[styles.warningCard, { backgroundColor: bg, borderColor: border }]}>
      <ThemedText type="defaultSemiBold" style={{ color: text }}>
        {title}
      </ThemedText>
      <ThemedText type="caption" style={{ color: text, opacity: 0.85 }}>
        {body}
      </ThemedText>
    </View>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  hero: {
    gap: Spacing.md,
    padding: Spacing.xxl,
    borderRadius: Radius.xl,
  },
  heroIconRow: {
    marginBottom: Spacing.xs,
  },
  heroIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: Brand.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  statusGrid: {
    gap: Spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  warningCard: {
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  actions: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  primaryButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
});
