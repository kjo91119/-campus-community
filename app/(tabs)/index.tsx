import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';

import { MAJOR_GROUPS } from '@/constants/major-groups';
import {
  getMajorGroupById,
  getUniversityById,
  MOCK_MAJOR_BOARDS,
} from '@/data/mock-community';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCommunityData } from '@/hooks/use-community-data';
import { useAppSession } from '@/hooks/use-app-session';

export default function HomeScreen() {
  const router = useRouter();
  const { profile, isReadOnly } = useAppSession();
  const { getPostsByBoardId, isHydrating } = useCommunityData();
  const [selectedMajorId, setSelectedMajorId] = useState<string>('all');
  const currentUniversity = getUniversityById(profile.primaryUniversityId);
  const currentMajorGroup = getMajorGroupById(profile.primaryMajorGroupId);
  const networkPosts = getPostsByBoardId('network-home').filter(
    (post) => post.postType !== 'recruitment'
  );
  const filteredPosts =
    selectedMajorId === 'all'
      ? networkPosts
      : networkPosts.filter((post) => post.majorGroupId === selectedMajorId);

  if (isHydrating) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.hero}>
        <ThemedText type="title">통합 홈</ThemedText>
        <ThemedText>
          {profile.nickname} 님, {currentUniversity?.name ?? '학교 미지정'} ·{' '}
          {currentMajorGroup?.label ?? '전공군 미선택'} 기준으로 네트워크 골격을 준비했습니다.
        </ThemedText>
        {isReadOnly ? (
          <ThemedText>현재 읽기 전용 상태라 목록만 볼 수 있고 작성 기능은 잠겨 있습니다.</ThemedText>
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
        <ThemedText type="subtitle">빠른 진입</ThemedText>
        <ThemedView style={styles.quickActions}>
          <Pressable
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/write?boardId=network-home' as never)}>
            <ThemedText type="defaultSemiBold">통합 홈에 글쓰기</ThemedText>
            <ThemedText>네트워크 전체에 보이는 일반글/질문글을 먼저 작성합니다.</ThemedText>
          </Pressable>
          <Pressable style={styles.quickAction} onPress={() => router.push('./school')}>
            <ThemedText type="defaultSemiBold">학교 게시판으로 이동</ThemedText>
            <ThemedText>같은 학교 인증 사용자만 보는 보드와 댓글 흐름을 확인합니다.</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">전공 게시판 진입</ThemedText>
        {MOCK_MAJOR_BOARDS.map((board) => (
          <Pressable
            key={board.id}
            style={styles.quickAction}
            onPress={() => router.push(`/(tabs)/boards/${board.id}` as never)}>
            <ThemedText type="defaultSemiBold">{board.title}</ThemedText>
            <ThemedText>{board.description}</ThemedText>
          </Pressable>
        ))}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">전공군 집중 보기</ThemedText>
        <ThemedText>
          현재 선택: {selectedMajorId === 'all' ? '전체 전공군' : getMajorGroupById(selectedMajorId)?.label}
        </ThemedText>
        <ThemedText>
          MVP에서는 별도 전공 탭 대신, 홈 내부 필터와 집중 보기 상태로 전공 탐색을 처리합니다.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">통합 홈 피드</ThemedText>
        {filteredPosts.length === 0 ? (
          <ThemedText>아직 조건에 맞는 글이 없습니다. 첫 글을 작성해 보세요.</ThemedText>
        ) : (
          filteredPosts.map((post) => (
            <Pressable
              key={post.id}
              style={styles.feedItem}
              onPress={() => router.push(`/(tabs)/posts/${post.id}` as never)}>
              <ThemedText type="defaultSemiBold">{post.title}</ThemedText>
              <ThemedText>{post.summary}</ThemedText>
              <ThemedText>
                {getMajorGroupById(post.majorGroupId)?.label ?? '통합'} · 댓글 {post.commentCount} ·{' '}
                {post.createdLabel}
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
    backgroundColor: 'rgba(75, 130, 195, 0.10)',
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
    backgroundColor: 'rgba(30, 95, 175, 0.14)',
  },
  quickActions: {
    gap: 10,
  },
  quickAction: {
    gap: 6,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  feedItem: {
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.10)',
  },
});
