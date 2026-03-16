import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { POST_CATEGORY_LABELS, POST_TYPE_LABELS } from '@/constants/community';
import {
  getBoardById,
  getMajorGroupById,
  getUniversityById,
} from '@/data/mock-community';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCommunityData } from '@/hooks/use-community-data';
import { useThemeColor } from '@/hooks/use-theme-color';

function getParamValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function PostDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ postId: string }>();
  const postId = getParamValue(params.postId);
  const {
    createComment,
    getCommentAccessForPost,
    getCommentsByPostId,
    getPostById,
    getReadAccessForPost,
    isHydrating,
  } = useCommunityData();
  const [commentBody, setCommentBody] = useState('');
  const [feedback, setFeedback] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const readAccess = getReadAccessForPost(postId);
  const post = getPostById(postId);
  const comments = getCommentsByPostId(postId);
  const commentAccess = getCommentAccessForPost(postId);
  const board = getBoardById(post?.boardId);
  const university = getUniversityById(post?.universityId);
  const majorGroup = getMajorGroupById(post?.majorGroupId);

  if (isHydrating) {
    return null;
  }

  if (!readAccess.ok && readAccess.message !== '게시글을 찾을 수 없습니다.') {
    return (
      <ThemedView style={styles.fallback}>
        <ThemedText type="title">이 게시글은 볼 수 없습니다.</ThemedText>
        <ThemedText>{readAccess.message}</ThemedText>
        <Pressable style={styles.secondaryButton} onPress={() => router.replace('/(tabs)' as never)}>
          <ThemedText type="defaultSemiBold">홈으로 돌아가기</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (!post) {
    return (
      <ThemedView style={styles.fallback}>
        <ThemedText type="title">게시글을 찾을 수 없습니다.</ThemedText>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <ThemedText type="defaultSemiBold">이전 화면으로 돌아가기</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const result = await createComment({
      postId: post.id,
      body: commentBody,
    });

    setIsSubmitting(false);
    setFeedback(result.message);

    if (result.ok) {
      setCommentBody('');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.hero}>
        <ThemedText type="title">{post.title}</ThemedText>
        <ThemedText>{post.body}</ThemedText>
        <ThemedText>
          {POST_TYPE_LABELS[post.postType as keyof typeof POST_TYPE_LABELS] ?? post.postType} ·{' '}
          {POST_CATEGORY_LABELS[post.category as keyof typeof POST_CATEGORY_LABELS] ?? post.category}
        </ThemedText>
        {board ? <ThemedText>게시판: {board.title}</ThemedText> : null}
        {majorGroup ? <ThemedText>전공군: {majorGroup.label}</ThemedText> : null}
        {university ? <ThemedText>학교: {university.name}</ThemedText> : null}
        <ThemedText>댓글 {post.commentCount} · {post.createdLabel}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">댓글</ThemedText>
        {comments.length === 0 ? (
          <ThemedText>아직 댓글이 없습니다. 첫 댓글로 흐름을 확인해 보세요.</ThemedText>
        ) : (
          comments.map((comment) => (
            <ThemedView
              key={comment.id}
              style={[styles.commentItem, comment.depth === 2 && styles.replyItem]}>
              <ThemedText type="defaultSemiBold">
                {comment.isAnonymous ? '익명' : comment.authorNickname}
              </ThemedText>
              <ThemedText>{comment.body}</ThemedText>
              <ThemedText>{comment.createdLabel}</ThemedText>
            </ThemedView>
          ))
        )}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">댓글 작성</ThemedText>
        {!commentAccess.ok ? <ThemedText>{commentAccess.message}</ThemedText> : null}
        <TextInput
          editable={commentAccess.ok && !isSubmitting}
          multiline
          onChangeText={setCommentBody}
          placeholder="댓글을 입력해 주세요."
          placeholderTextColor={borderColor}
          style={[styles.input, { borderColor, color: textColor }]}
          value={commentBody}
        />
        {feedback ? <ThemedText>{feedback}</ThemedText> : null}
        <Pressable
          disabled={!commentAccess.ok || isSubmitting}
          style={[styles.primaryButton, (!commentAccess.ok || isSubmitting) && styles.disabledButton]}
          onPress={() => void handleSubmit()}>
          <ThemedText style={styles.primaryButtonText}>
            {isSubmitting ? '등록 중...' : '댓글 등록'}
          </ThemedText>
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
    backgroundColor: 'rgba(44, 154, 122, 0.12)',
  },
  card: {
    gap: 10,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  commentItem: {
    gap: 4,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.10)',
  },
  replyItem: {
    paddingLeft: 16,
  },
  input: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    textAlignVertical: 'top',
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
  disabledButton: {
    opacity: 0.5,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
});
