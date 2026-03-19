import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInput as TextInputType,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAppSession } from '@/hooks/use-app-session';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useThemeColors } from '@/hooks/use-theme-color';
import { SUPPORTED_UNIVERSITIES } from '@/lib/community/metadata';

type AuthMode = 'sign_in' | 'sign_up';
type VerificationPath = 'school_email' | 'manual_student_id';

export default function EmailAuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { track } = useAnalytics();
  const { lastSubmittedEmail } = useAppSession();
  const {
    bootstrap,
    isLoading,
    pendingEmailConfirmation,
    signInWithEmail,
    signUpWithEmail,
  } = useSupabaseAuth();
  const passwordRef = useRef<TextInputType>(null);
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [verificationPath, setVerificationPath] = useState<VerificationPath>('school_email');
  const [email, setEmail] = useState(lastSubmittedEmail ?? '');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<string | undefined>();

  const handleSubmit = async () => {
    if (mode === 'sign_up' && verificationPath === 'school_email') {
      track('school_email_submitted', { entry: 'email_auth' });
    }

    const action = mode === 'sign_up' ? signUpWithEmail : signInWithEmail;
    const result = await action({ email, password, verificationPath });
    setFeedback(result.message);

    if (result.nextStep === 'signed_in') {
      router.replace('/');
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xl }]}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled">

      <ThemedText type="title">이메일 인증</ThemedText>
      <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: -Spacing.sm }}>
        학교 이메일이 있으면 빠른 인증, 없으면 학생증 수동 인증으로 이어집니다.
      </ThemedText>

      {/* Mode toggle */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">진입 모드</ThemedText>
        <View style={styles.segmentRow}>
          <Pressable
            onPress={() => setMode('sign_in')}
            style={({ pressed }) => [
              styles.segment,
              { borderColor: colors.border },
              mode === 'sign_in' && { backgroundColor: Brand.primaryMuted, borderColor: Brand.primary + '50' },
              pressed && { opacity: 0.7 },
            ]}>
            <ThemedText
              type="defaultSemiBold"
              style={mode === 'sign_in' ? { color: Brand.primary } : undefined}>
              로그인
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setMode('sign_up')}
            style={({ pressed }) => [
              styles.segment,
              { borderColor: colors.border },
              mode === 'sign_up' && { backgroundColor: Brand.primaryMuted, borderColor: Brand.primary + '50' },
              pressed && { opacity: 0.7 },
            ]}>
            <ThemedText
              type="defaultSemiBold"
              style={mode === 'sign_up' ? { color: Brand.primary } : undefined}>
              회원가입
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>

      {/* Verification path */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">인증 경로</ThemedText>
        <View style={styles.segmentRow}>
          <Pressable
            onPress={() => setVerificationPath('school_email')}
            style={({ pressed }) => [
              styles.segment,
              { borderColor: colors.border },
              verificationPath === 'school_email' && { backgroundColor: Brand.primaryMuted, borderColor: Brand.primary + '50' },
              pressed && { opacity: 0.7 },
            ]}>
            <ThemedText
              type="defaultSemiBold"
              style={verificationPath === 'school_email' ? { color: Brand.primary } : undefined}>
              학교 이메일
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setVerificationPath('manual_student_id')}
            style={({ pressed }) => [
              styles.segment,
              { borderColor: colors.border },
              verificationPath === 'manual_student_id' && { backgroundColor: Brand.primaryMuted, borderColor: Brand.primary + '50' },
              pressed && { opacity: 0.7 },
            ]}>
            <ThemedText
              type="defaultSemiBold"
              style={verificationPath === 'manual_student_id' ? { color: Brand.primary } : undefined}>
              학생증 인증
            </ThemedText>
          </Pressable>
        </View>
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          {verificationPath === 'school_email'
            ? '학교 이메일이 있으면 이 경로를 사용합니다.'
            : '학교 이메일이 없으면 일반 이메일로 계정을 만든 뒤 학생증 수동 인증을 진행합니다.'}
        </ThemedText>
      </ThemedView>

      {/* Supported domains */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">지원 학교</ThemedText>
        <View style={styles.domainList}>
          {SUPPORTED_UNIVERSITIES.map((u) => (
            <View key={u.id} style={[styles.domainChip, { backgroundColor: colors.surfaceSecondary }]}>
              <ThemedText type="caption">{u.name}</ThemedText>
              <ThemedText type="caption" style={{ color: colors.textTertiary }}>
                {u.emailDomain}
              </ThemedText>
            </View>
          ))}
        </View>
      </ThemedView>

      {/* Email / password */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">
          {verificationPath === 'school_email' ? '학교 이메일 / 비밀번호' : '이메일 / 비밀번호'}
        </ThemedText>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          onSubmitEditing={() => passwordRef.current?.focus()}
          placeholder={verificationPath === 'school_email' ? 'example@yonsei.ac.kr' : '사용할 이메일 주소'}
          placeholderTextColor={colors.inputPlaceholder}
          returnKeyType="next"
          style={[styles.input, { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.inputBackground }]}
          value={email}
        />
        <TextInput
          ref={passwordRef}
          autoCapitalize="none"
          autoComplete="password"
          onChangeText={setPassword}
          onSubmitEditing={() => void handleSubmit()}
          placeholder={mode === 'sign_up' ? '비밀번호 8자 이상' : '비밀번호 입력'}
          placeholderTextColor={colors.inputPlaceholder}
          returnKeyType="done"
          secureTextEntry
          style={[styles.input, { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.inputBackground }]}
          value={password}
        />
        {feedback ? (
          <ThemedText type="caption" style={{ color: Brand.primary }}>{feedback}</ThemedText>
        ) : null}
        {pendingEmailConfirmation ? (
          <ThemedText type="caption" style={{ color: colors.warningText }}>
            인증 메일 발송 대기: {pendingEmailConfirmation}
          </ThemedText>
        ) : null}
        {verificationPath === 'manual_student_id' ? (
          <ThemedText type="caption" style={{ color: colors.textTertiary }}>
            이 경로는 계정 생성용입니다. 로그인 후 학생증 인증 전까지 커뮤니티 접근은 열리지 않습니다.
          </ThemedText>
        ) : null}
        {bootstrap.status !== 'ready_for_client_wiring' ? (
          <ThemedText type="caption" style={{ color: colors.warningText }}>
            .env 설정이 완료되어야 실제 auth 요청을 보낼 수 있습니다.
          </ThemedText>
        ) : null}
      </ThemedView>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={mode === 'sign_in' ? '로그인' : '회원가입'}
          accessibilityRole="button"
          disabled={isLoading}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: Brand.primary },
            pressed && { opacity: 0.85 },
            isLoading && { opacity: 0.5 },
          ]}
          onPress={() => void handleSubmit()}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>
              {mode === 'sign_in'
                ? '로그인'
                : verificationPath === 'school_email'
                  ? '학교 이메일로 회원가입'
                  : '계정 만들기'}
            </ThemedText>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            pressed && { backgroundColor: colors.surfacePressed },
          ]}
          onPress={() => router.push('../manual-verification')}>
          <ThemedText type="defaultSemiBold">학생증 수동 인증 안내</ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.ghostButton,
            { borderColor: colors.border },
            pressed && { backgroundColor: colors.surfacePressed },
          ]}
          onPress={() => router.back()}>
          <ThemedText type="defaultSemiBold" style={{ color: colors.textSecondary }}>
            이전 화면
          </ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  card: {
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  domainList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  domainChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    gap: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: 15,
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
  ghostButton: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
});
