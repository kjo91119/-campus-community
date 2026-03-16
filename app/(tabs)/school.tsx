import {
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';

import {
  getSchoolBoardByUniversityId,
  getUniversityById,
} from '@/data/mock-community';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCommunityData } from '@/hooks/use-community-data';
import { useAppSession } from '@/hooks/use-app-session';

export default function SchoolScreen() {
  const router = useRouter();
  const { profile, isReadOnly } = useAppSession();
  const { getPostsByBoardId, getWriteAccessForBoard, isHydrating } = useCommunityData();
  const university = getUniversityById(profile.primaryUniversityId);
  const schoolBoard = getSchoolBoardByUniversityId(profile.primaryUniversityId);
  const schoolPosts = getPostsByBoardId(schoolBoard?.id);
  const writeAccess = getWriteAccessForBoard(schoolBoard?.id);

  if (isHydrating) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.hero}>
        <ThemedText type="title">학교 게시판</ThemedText>
        <ThemedText>
          같은 학교 인증 사용자만 보는 제한형 게시판 골격입니다. MVP에서는 학교별 1개 보드만
          유지합니다.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">접근 상태</ThemedText>
        <ThemedText>학교: {university?.name ?? '학교 미지정'}</ThemedText>
        <ThemedText>인증 상태: {profile.verificationStatus}</ThemedText>
        {isReadOnly ? (
          <ThemedText>읽기 전용 상태에서는 학교 게시판 글쓰기도 잠깁니다.</ThemedText>
        ) : null}
        {schoolBoard ? <ThemedText>현재 학교 보드: {schoolBoard.title}</ThemedText> : null}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">학교 보드 액션</ThemedText>
        {schoolBoard ? (
          <>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push(`/(tabs)/boards/${schoolBoard.id}` as never)}>
              <ThemedText style={styles.primaryButtonText}>학교 게시판 열기</ThemedText>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push(`/(tabs)/write?boardId=${schoolBoard.id}` as never)}>
              <ThemedText type="defaultSemiBold">학교 게시판에 글쓰기</ThemedText>
            </Pressable>
            {!writeAccess.ok ? <ThemedText>{writeAccess.message}</ThemedText> : null}
          </>
        ) : (
          <ThemedText>학교 보드 설정이 아직 없습니다.</ThemedText>
        )}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">학교 피드</ThemedText>
        {schoolPosts.length === 0 ? (
          <ThemedText>
            현재 선택한 학교 게시판에는 글이 없습니다. 첫 글을 올려 같은 학교 흐름을 확인해 보세요.
          </ThemedText>
        ) : (
          schoolPosts.map((post) => (
            <Pressable
              key={post.id}
              style={styles.listItem}
              onPress={() => router.push(`/(tabs)/posts/${post.id}` as never)}>
              <ThemedText type="defaultSemiBold">{post.title}</ThemedText>
              <ThemedText>{post.summary}</ThemedText>
              <ThemedText>
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
  hero: {
    gap: 10,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(170, 107, 45, 0.12)',
  },
  card: {
    gap: 10,
    padding: 18,
    borderRadius: 18,
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
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  listItem: {
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.10)',
  },
});
