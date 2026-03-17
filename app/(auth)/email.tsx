import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAppSession } from '@/hooks/use-app-session';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useThemeColor } from '@/hooks/use-theme-color';
import { SUPPORTED_UNIVERSITIES } from '@/lib/community/metadata';

type AuthMode = 'sign_in' | 'sign_up';
type VerificationPath = 'school_email' | 'manual_student_id';

export default function EmailAuthScreen() {
  const router = useRouter();
  const { track } = useAnalytics();
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const { lastSubmittedEmail } = useAppSession();
  const {
    bootstrap,
    isLoading,
    pendingEmailConfirmation,
    signInWithEmail,
    signUpWithEmail,
  } = useSupabaseAuth();
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [verificationPath, setVerificationPath] = useState<VerificationPath>('school_email');
  const [email, setEmail] = useState(lastSubmittedEmail ?? '');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<string | undefined>();

  const handleSubmit = async () => {
    if (mode === 'sign_up' && verificationPath === 'school_email') {
      track('school_email_submitted', {
        entry: 'email_auth',
      });
    }

    const action = mode === 'sign_up' ? signUpWithEmail : signInWithEmail;
    const result = await action({
      email,
      password,
      verificationPath,
    });

    setFeedback(result.message);

    if (result.nextStep === 'signed_in') {
      router.replace('/');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedText type="title">이메일 인증 시작</ThemedText>
      <ThemedText>
        Supabase Auth 기반 로그인/회원가입 화면입니다. 학교 이메일이 있으면 빠른 인증으로,
        없으면 일반 이메일 계정 생성 후 학생증 수동 인증으로 이어집니다.
      </ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">진입 모드</ThemedText>
        <ThemedView style={styles.modeRow}>
          <Pressable
            onPress={() => setMode('sign_in')}
            style={[styles.modeChip, mode === 'sign_in' && styles.modeChipSelected]}>
            <ThemedText type="defaultSemiBold">로그인</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setMode('sign_up')}
            style={[styles.modeChip, mode === 'sign_up' && styles.modeChipSelected]}>
            <ThemedText type="defaultSemiBold">회원가입</ThemedText>
          </Pressable>
        </ThemedView>
        <ThemedText>
          현재 모드:{' '}
          {mode === 'sign_in'
            ? '기존 계정 로그인'
            : verificationPath === 'school_email'
              ? '학교 이메일 회원가입'
              : '일반 이메일 계정 생성 후 학생증 인증'}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">인증 경로</ThemedText>
        <ThemedView style={styles.modeRow}>
          <Pressable
            onPress={() => setVerificationPath('school_email')}
            style={[
              styles.modeChip,
              verificationPath === 'school_email' && styles.modeChipSelected,
            ]}>
            <ThemedText type="defaultSemiBold">학교 이메일</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setVerificationPath('manual_student_id')}
            style={[
              styles.modeChip,
              verificationPath === 'manual_student_id' && styles.modeChipSelected,
            ]}>
            <ThemedText type="defaultSemiBold">학생증 fallback</ThemedText>
          </Pressable>
        </ThemedView>
        <ThemedText>
          {verificationPath === 'school_email'
            ? '학교 이메일이 있으면 이 경로를 사용합니다. 이메일 확인 후 바로 온보딩으로 이어질 수 있습니다.'
            : '학교 이메일이 없으면 일반 이메일로 계정을 만든 뒤, 로그인 후 학생증 수동 인증을 진행합니다.'}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">지원 도메인 예시</ThemedText>
        {SUPPORTED_UNIVERSITIES.map((university) => (
          <ThemedText key={university.id}>
            {university.name} · {university.emailDomain}
          </ThemedText>
        ))}
        {verificationPath === 'manual_student_id' ? (
          <ThemedText>학생증 fallback 경로에서는 일반 이메일도 사용할 수 있습니다.</ThemedText>
        ) : null}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">
          {verificationPath === 'school_email' ? '학교 이메일 / 비밀번호' : '이메일 / 비밀번호'}
        </ThemedText>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder={
            verificationPath === 'school_email'
              ? 'example@yonsei.ac.kr'
              : '사용할 이메일 주소'
          }
          placeholderTextColor={borderColor}
          style={[styles.input, { borderColor, color: textColor }]}
          value={email}
        />
        <TextInput
          autoCapitalize="none"
          onChangeText={setPassword}
          placeholder={mode === 'sign_up' ? '비밀번호 8자 이상' : '비밀번호 입력'}
          placeholderTextColor={borderColor}
          secureTextEntry
          style={[styles.input, { borderColor, color: textColor }]}
          value={password}
        />
        {feedback ? <ThemedText>{feedback}</ThemedText> : null}
        {pendingEmailConfirmation ? (
          <ThemedText>
            인증 메일 발송 대기: {pendingEmailConfirmation}
          </ThemedText>
        ) : null}
        {verificationPath === 'manual_student_id' ? (
          <ThemedText>
            이 경로는 계정 생성용입니다. 로그인 후 학생증 수동 인증 전까지 커뮤니티 접근은 열리지
            않습니다.
          </ThemedText>
        ) : null}
        {bootstrap.status !== 'ready_for_client_wiring' ? (
          <ThemedText>현재는 `.env` 설정이 완료되어야 실제 auth 요청을 보낼 수 있습니다.</ThemedText>
        ) : null}
      </ThemedView>

      <ThemedView style={styles.actions}>
        <Pressable
          disabled={isLoading}
          style={styles.primaryButton}
          onPress={() => void handleSubmit()}>
          <ThemedText style={styles.primaryButtonText}>
            {mode === 'sign_in'
              ? '로그인'
              : verificationPath === 'school_email'
                ? '학교 이메일로 회원가입'
                : '계정 만들기 후 학생증 인증'}
          </ThemedText>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => {
            router.push('../manual-verification');
          }}>
          <ThemedText type="defaultSemiBold">학생증 수동 인증 안내 보기</ThemedText>
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
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  modeChipSelected: {
    backgroundColor: 'rgba(30, 95, 175, 0.14)',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
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
