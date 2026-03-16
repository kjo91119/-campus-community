import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { MAJOR_GROUPS } from '@/constants/major-groups';
import { getMajorGroupById, MOCK_RECRUITMENTS } from '@/data/mock-community';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppSession } from '@/hooks/use-app-session';

export default function RecruitScreen() {
  const { profile, isReadOnly } = useAppSession();
  const [selectedMajorId, setSelectedMajorId] = useState<string>(
    profile.primaryMajorGroupId ?? 'all'
  );
  const recruitments =
    selectedMajorId === 'all'
      ? MOCK_RECRUITMENTS
      : MOCK_RECRUITMENTS.filter(
          (recruitment) =>
            !recruitment.preferredMajorGroupId || recruitment.preferredMajorGroupId === selectedMajorId
        );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.hero}>
        <ThemedText type="title">모집</ThemedText>
        <ThemedText>
          MVP에서는 별도 지원 시스템 없이, 모집 상세에서 참여 의사 댓글을 남기는 흐름으로
          시작합니다.
        </ThemedText>
        {isReadOnly ? (
          <ThemedText>읽기 전용 상태에서는 참여 댓글 작성이 잠기고 목록만 볼 수 있습니다.</ThemedText>
        ) : null}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">전공군 필터</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ThemedView style={styles.filterRow}>
            <Pressable
              onPress={() => setSelectedMajorId('all')}
              style={[styles.filterChip, selectedMajorId === 'all' && styles.filterChipSelected]}>
              <ThemedText type="defaultSemiBold">전체</ThemedText>
            </Pressable>
            {MAJOR_GROUPS.map((group) => {
              const selected = selectedMajorId === group.id;

              return (
                <Pressable
                  key={group.id}
                  onPress={() => setSelectedMajorId(group.id)}
                  style={[styles.filterChip, selected && styles.filterChipSelected]}>
                  <ThemedText type="defaultSemiBold">{group.label}</ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>
        </ScrollView>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">모집 더미 목록</ThemedText>
        {recruitments.map((recruitment) => (
          <ThemedView key={recruitment.id} style={styles.listItem}>
            <ThemedText type="defaultSemiBold">{recruitment.title}</ThemedText>
            <ThemedText>{recruitment.summary}</ThemedText>
            <ThemedText>
              {getMajorGroupById(recruitment.preferredMajorGroupId)?.label ?? '혼합'} ·{' '}
              {recruitment.headcountLabel} · {recruitment.deadlineLabel}
            </ThemedText>
            <ThemedText>
              상세 화면에서는 참여 의사 댓글 CTA와 기본 상태 배지, 모집 개요만 먼저 붙입니다.
            </ThemedText>
          </ThemedView>
        ))}
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
    backgroundColor: 'rgba(44, 154, 122, 0.12)',
  },
  card: {
    gap: 10,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  filterChipSelected: {
    backgroundColor: 'rgba(44, 154, 122, 0.16)',
  },
  listItem: {
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.10)',
  },
});
