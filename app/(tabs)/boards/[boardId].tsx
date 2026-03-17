import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { BOARD_SCOPE_LABELS, POST_CATEGORY_LABELS } from '@/constants/community';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCommunityData } from '@/hooks/use-community-data';
import { getMajorGroupById, getUniversityById } from '@/lib/community/metadata';

function getParamValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function BoardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ boardId: string }>();
  const boardId = getParamValue(params.boardId);
  const {
    getBoardById,
    getPostsByBoardId,
    getReadAccessForBoard,
    getWriteAccessForBoard,
    isHydrating,
  } = useCommunityData();
  const board = getBoardById(boardId);
  const readAccess = getReadAccessForBoard(boardId);
  const posts = getPostsByBoardId(boardId);
  const writeAccess = getWriteAccessForBoard(boardId);
  const university = getUniversityById(board?.universityId);
  const majorGroup = getMajorGroupById(board?.majorGroupId);

  if (isHydrating) {
    return null;
  }

  if (!board) {
    return (
      <ThemedView style={styles.fallback}>
        <ThemedText type="title">게시판을 찾을 수 없습니다.</ThemedText>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <ThemedText type="defaultSemiBold">이전 화면으로 돌아가기</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (!readAccess.ok) {
    return (
      <ThemedView style={styles.fallback}>
        <ThemedText type="title">이 게시판은 볼 수 없습니다.</ThemedText>
        <ThemedText>{readAccess.message}</ThemedText>
        <Pressable style={styles.secondaryButton} onPress={() => router.replace('/(tabs)' as never)}>
          <ThemedText type="defaultSemiBold">홈으로 돌아가기</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.hero}>
        <ThemedText type="title">{board.title}</ThemedText>
        <ThemedText>{board.description}</ThemedText>
        <ThemedText>보드 유형: {BOARD_SCOPE_LABELS[board.scopeType]}</ThemedText>
        {majorGroup ? <ThemedText>전공군: {majorGroup.label}</ThemedText> : null}
        {university ? <ThemedText>학교: {university.name}</ThemedText> : null}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">작성 상태</ThemedText>
        {writeAccess.ok ? (
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push(`/(tabs)/write?boardId=${board.id}` as never)}>
            <ThemedText style={styles.primaryButtonText}>이 게시판에 글쓰기</ThemedText>
          </Pressable>
        ) : (
          <ThemedText>{writeAccess.message}</ThemedText>
        )}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">게시글 목록</ThemedText>
        {posts.length === 0 ? (
          <ThemedText>
            아직 이 게시판에 글이 없습니다. 첫 글을 올려 흐름을 확인해 보세요.
          </ThemedText>
        ) : (
          posts.map((post) => (
            <Pressable
              key={post.id}
              style={styles.postItem}
              onPress={() =>
                router.push(
                  post.recruitmentId
                    ? (`/(tabs)/recruitments/${post.recruitmentId}` as never)
                    : (`/(tabs)/posts/${post.id}` as never)
                )
              }>
              <ThemedText type="defaultSemiBold">{post.title}</ThemedText>
              <ThemedText>{post.summary}</ThemedText>
              <ThemedText>
                {POST_CATEGORY_LABELS[post.category as keyof typeof POST_CATEGORY_LABELS] ?? post.category} ·
                댓글 {post.commentCount} · {post.createdLabel}
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
  fallback: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  hero: {
    gap: 8,
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
  postItem: {
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.10)',
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
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
});
