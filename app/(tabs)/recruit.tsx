import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';

import {
  RECRUITMENT_MODE_LABELS,
  RECRUITMENT_STATUS_LABELS,
  RECRUITMENT_TYPE_OPTIONS,
  RECRUITMENT_TYPE_LABELS,
} from '@/constants/community';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAnalytics } from '@/hooks/use-analytics';
import { useCommunityData } from '@/hooks/use-community-data';
import { useAppSession } from '@/hooks/use-app-session';
import { SUPPORTED_MAJOR_GROUPS, getMajorGroupById } from '@/lib/community/metadata';

export default function RecruitScreen() {
  const router = useRouter();
  const { track } = useAnalytics();
  const { profile, isReadOnly } = useAppSession();
  const { getRecruitments, isHydrating } = useCommunityData();
  const [selectedMajorId, setSelectedMajorId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [includeClosed, setIncludeClosed] = useState(false);
  const recruitments = getRecruitments(selectedMajorId).filter((recruitment) => {
    if (selectedType !== 'all' && recruitment.recruitmentType !== selectedType) {
      return false;
    }

    if (!includeClosed && recruitment.status !== 'open') {
      return false;
    }

    return true;
  });

  const hasTrackedRecruitmentListRef = useRef(false);

  useEffect(() => {
    if (hasTrackedRecruitmentListRef.current) {
      return;
    }

    track('recruitment_list_viewed', {
      major_group: profile.primaryMajorGroupId ?? null,
    });
    hasTrackedRecruitmentListRef.current = true;
  }, [profile.primaryMajorGroupId, track]);

  if (isHydrating) {
    return null;
  }

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
        <ThemedText type="subtitle">빠른 진입</ThemedText>
        <Pressable
          style={styles.quickAction}
          onPress={() => router.push('/(tabs)/recruit-write' as never)}>
          <ThemedText type="defaultSemiBold">통합 모집 작성</ThemedText>
          <ThemedText>스터디, 과제, 공모전/대회, 팀 프로젝트 모집글을 등록합니다.</ThemedText>
        </Pressable>
        <Pressable
          style={styles.quickAction}
          onPress={() => setSelectedMajorId(profile.primaryMajorGroupId ?? 'all')}>
          <ThemedText type="defaultSemiBold">내 전공 모집만 보기</ThemedText>
          <ThemedText>
            {profile.primaryMajorGroupId
              ? `${getMajorGroupById(profile.primaryMajorGroupId)?.label ?? '내 전공'} 모집으로 바로 좁힙니다.`
              : '전공군을 아직 선택하지 않았다면 통합 모집부터 확인합니다.'}
          </ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">필터</ThemedText>
        <ThemedText type="defaultSemiBold">모집 유형</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ThemedView style={styles.filterRow}>
            <Pressable
              onPress={() => setSelectedType('all')}
              style={[styles.filterChip, selectedType === 'all' && styles.filterChipSelected]}>
              <ThemedText type="defaultSemiBold">전체 유형</ThemedText>
            </Pressable>
            {RECRUITMENT_TYPE_OPTIONS.map((option) => {
              const selected = selectedType === option.value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => setSelectedType(option.value)}
                  style={[styles.filterChip, selected && styles.filterChipSelected]}>
                  <ThemedText type="defaultSemiBold">{option.label}</ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>
        </ScrollView>
        <ThemedText type="defaultSemiBold">전공군</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ThemedView style={styles.filterRow}>
            <Pressable
              onPress={() => setSelectedMajorId('all')}
              style={[styles.filterChip, selectedMajorId === 'all' && styles.filterChipSelected]}>
              <ThemedText type="defaultSemiBold">전체</ThemedText>
            </Pressable>
            {SUPPORTED_MAJOR_GROUPS.map((group) => {
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
        <Pressable
          onPress={() => setIncludeClosed((current) => !current)}
          style={[styles.filterChip, includeClosed && styles.filterChipSelected]}>
          <ThemedText type="defaultSemiBold">
            {includeClosed ? '마감 포함' : '모집 중만 보기'}
          </ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">모집 목록</ThemedText>
        {recruitments.length === 0 ? (
          <ThemedText>
            아직 조건에 맞는 모집글이 없습니다. 통합 모집으로 첫 모집글을 작성해 보세요.
          </ThemedText>
        ) : (
          recruitments.map((recruitment) => (
            <Pressable
              key={recruitment.id}
              style={styles.listItem}
              onPress={() =>
                router.push(`/(tabs)/recruitments/${recruitment.id}` as never)
              }>
              <ThemedText type="defaultSemiBold">{recruitment.title}</ThemedText>
              <ThemedText>{recruitment.summary}</ThemedText>
              <ThemedText>
                {RECRUITMENT_TYPE_LABELS[recruitment.recruitmentType]} ·{' '}
                {RECRUITMENT_MODE_LABELS[recruitment.mode ?? 'online']} ·{' '}
                {RECRUITMENT_STATUS_LABELS[recruitment.status]}
              </ThemedText>
              <ThemedText>
                {getMajorGroupById(recruitment.preferredMajorGroupId)?.label ?? '통합 모집'} ·{' '}
                {recruitment.headcountLabel} · {recruitment.deadlineLabel}
              </ThemedText>
            </Pressable>
          ))
        )}
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
  quickAction: {
    gap: 6,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
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
