import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import { MAJOR_GROUPS } from '@/constants/major-groups';
import { MOCK_UNIVERSITIES, getUniversityById } from '@/data/mock-community';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppSession } from '@/hooks/use-app-session';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function OnboardingScreen() {
  const router = useRouter();
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
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const selectedUniversity = getUniversityById(universityId || profile.primaryUniversityId);

  if (isHydrating) {
    return null;
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
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedText type="title">온보딩</ThemedText>
      <ThemedText>
        학교 이메일 인증 후 닉네임, 학교, 전공군을 확정합니다. 이 단계에서 프로필 저장 구조와
        홈 진입 조건을 함께 맞춥니다.
      </ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">인증 정보</ThemedText>
        <ThemedText>로그인 이메일: {authEmail ?? '미확인'}</ThemedText>
        <ThemedText>학교: {selectedUniversity?.name ?? '미확인'}</ThemedText>
        <ThemedText>공개 노출은 닉네임과 전공군 중심으로 진행됩니다.</ThemedText>
        <ThemedText>
          프로필 저장 위치: {profileStorageMode === 'supabase' ? 'Supabase profiles' : profileStorageMode === 'local_cache' ? '로컬 캐시' : '인증 기반 초기 상태'}
        </ThemedText>
        {profileSyncMessage ? <ThemedText>{profileSyncMessage}</ThemedText> : null}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">기본 프로필</ThemedText>
        <TextInput
          onChangeText={setNickname}
          placeholder="닉네임 입력"
          placeholderTextColor={borderColor}
          style={[styles.input, { borderColor, color: textColor }]}
          value={nickname}
        />
        <ThemedText>닉네임은 2~12자의 한글, 영문, 숫자, 밑줄만 사용할 수 있습니다.</ThemedText>
        <TextInput
          onChangeText={setMajorLabel}
          placeholder="세부 학과명 또는 관심 태그"
          placeholderTextColor={borderColor}
          style={[styles.input, { borderColor, color: textColor }]}
          value={majorLabel}
        />
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">학교 선택</ThemedText>
        <ThemedText>
          MVP에서는 학교 이메일로 확인된 학교와 동일한 학교를 프로필 학교로 사용합니다.
        </ThemedText>
        {MOCK_UNIVERSITIES.map((item) => {
          const selected = universityId === item.id;

          return (
            <Pressable
              key={item.id}
              onPress={() => setUniversityId(item.id)}
              style={[
                styles.choice,
                selected && { backgroundColor: 'rgba(30, 95, 175, 0.14)' },
              ]}>
              <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
              <ThemedText>{item.region}</ThemedText>
            </Pressable>
          );
        })}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">전공군 선택</ThemedText>
        {MAJOR_GROUPS.map((group) => {
          const selected = majorGroupId === group.id;

          return (
            <Pressable
              key={group.id}
              onPress={() => setMajorGroupId(group.id)}
              style={[
                styles.choice,
                selected && { backgroundColor: 'rgba(30, 95, 175, 0.14)' },
              ]}>
              <ThemedText type="defaultSemiBold">{group.label}</ThemedText>
              <ThemedText>{group.description}</ThemedText>
            </Pressable>
          );
        })}
        {feedback ? <ThemedText>{feedback}</ThemedText> : null}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">정책 확인</ThemedText>
        <ThemedText>
          익명성은 공개 노출 방식일 뿐이며, 신고 접수 시 운영 정책에 따라 검토될 수 있습니다.
        </ThemedText>
        <ThemedText>
          비방, 허위 정보, 반복 도배는 제한 대상이며 MVP에서는 닉네임 정책과 기본 규칙 동의 후
          진입합니다.
        </ThemedText>
        <Pressable
          onPress={() => setAcceptedPolicy((current) => !current)}
          style={[
            styles.choice,
            acceptedPolicy && { backgroundColor: 'rgba(30, 95, 175, 0.14)' },
          ]}>
          <ThemedText type="defaultSemiBold">
            {acceptedPolicy ? '확인 완료' : '이용 규칙과 익명성 정책을 확인했습니다'}
          </ThemedText>
        </Pressable>
      </ThemedView>

      <Pressable
        disabled={isSubmitting}
        style={styles.primaryButton}
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
    padding: 20,
    gap: 16,
  },
  card: {
    gap: 10,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  choice: {
    gap: 4,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
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
