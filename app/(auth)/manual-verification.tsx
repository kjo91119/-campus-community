import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { EVIDENCE_RETENTION, MANUAL_VERIFICATION_SLA } from '@/constants/auth-policy';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ManualVerificationScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedText type="title">학생증 수동 인증</ThemedText>
      <ThemedText>
        이번 단계에서는 실제 수동 인증 연결을 하지 않고, 이메일 인증이 어려운 사용자를 위한
        placeholder 화면만 남겨둡니다.
      </ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">예정된 흐름</ThemedText>
        <ThemedText>1. 학교 선택</ThemedText>
        <ThemedText>2. 학생증 또는 재학 증빙 업로드</ThemedText>
        <ThemedText>3. 운영 검토 후 승인/반려</ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">운영 기준 메모</ThemedText>
        <ThemedText>{MANUAL_VERIFICATION_SLA.acknowledgement}</ThemedText>
        <ThemedText>{MANUAL_VERIFICATION_SLA.resolution}</ThemedText>
        <ThemedText>{EVIDENCE_RETENTION.default}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.actions}>
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
  actions: {
    gap: 12,
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
