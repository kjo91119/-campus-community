import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  POST_CATEGORY_LABELS,
  POST_TYPE_LABELS,
  REPORT_REASON_OPTIONS,
} from '@/constants/community';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAppSession } from '@/hooks/use-app-session';
import { useCommunityData } from '@/hooks/use-community-data';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getMajorGroupById, getUniversityById } from '@/lib/community/metadata';
import type { ReportReason } from '@/types/domain';

function getParamValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function PostDetailScreen() {
  const router = useRouter();
  const { track } = useAnalytics();
  const params = useLocalSearchParams<{ postId: string }>();
  const postId = getParamValue(params.postId);
  const { profile } = useAppSession();
  const {
    blockProfile,
    createComment,
    getBoardById,
    getCommentAccessForPost,
    getCommentsByPostId,
    getPostById,
    getReadAccessForPost,
    isBlockedProfile,
    isHydrating,
    reportTarget,
    unblockProfile,
  } = useCommunityData();
  const [commentBody, setCommentBody] = useState('');
  const [selectedReason, setSelectedReason] = useState<ReportReason>(REPORT_REASON_OPTIONS[0]!.value);
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
  const authorUniversity = getUniversityById(post?.authorUniversityId);
  const authorMajorGroup = getMajorGroupById(post?.authorMajorGroupId);
  const isOwnPost = post?.authorProfileId === profile.id;
  const isAuthorBlocked = isBlockedProfile(post?.authorProfileId);
  const hasTrackedOpenRef = useRef(false);

  useEffect(() => {
    if (!post || hasTrackedOpenRef.current) {
      return;
    }

    track('post_opened', {
      board_scope: board?.scopeType ?? null,
      post_category: post.category,
      post_type: post.postType,
      university_id: post.universityId ?? null,
      major_group: post.majorGroupId ?? null,
    });
    hasTrackedOpenRef.current = true;
  }, [board?.scopeType, post, track]);

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

  const handleReportPost = async () => {
    if (!post) {
      return;
    }

    const result = await reportTarget({
      targetType: 'post',
      targetId: post.id,
      targetProfileId: post.authorProfileId,
      reason: selectedReason,
    });

    setFeedback(result.message);
  };

  const handleReportAuthor = async () => {
    if (!post || isOwnPost) {
      return;
    }

    const result = await reportTarget({
      targetType: 'profile',
      targetId: post.authorProfileId,
      targetProfileId: post.authorProfileId,
      reason: selectedReason,
    });

    setFeedback(result.message);
  };

  const handleToggleAuthorBlock = async (authorProfileId?: string) => {
    if (!authorProfileId) {
      return;
    }

    const wasBlocked = isBlockedProfile(authorProfileId);
    const result = wasBlocked
      ? await unblockProfile(authorProfileId)
      : await blockProfile(authorProfileId);

    setFeedback(result.message);

    if (result.ok && !wasBlocked) {
      router.replace('/(tabs)' as never);
    }
  };

  const handleReportComment = async (commentId: string, authorProfileId: string) => {
    const result = await reportTarget({
      targetType: 'comment',
      targetId: commentId,
      targetProfileId: authorProfileId,
      reason: selectedReason,
    });

    setFeedback(result.message);
  };

  const handleBlockCommentAuthor = async (authorProfileId: string) => {
    const wasBlocked = isBlockedProfile(authorProfileId);
    const result = wasBlocked
      ? await unblockProfile(authorProfileId)
      : await blockProfile(authorProfileId);

    setFeedback(result.message);

    if (result.ok && !wasBlocked && authorProfileId === post.authorProfileId) {
      router.replace('/(tabs)' as never);
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
        <ThemedText type="subtitle">작성자 정보</ThemedText>
        {post.isAnonymous ? (
          <ThemedText>익명 작성글이라 작성자 요약 정보는 공개되지 않습니다.</ThemedText>
        ) : (
          <>
            <ThemedText>닉네임: {post.authorNickname}</ThemedText>
            {authorMajorGroup ? <ThemedText>전공군: {authorMajorGroup.label}</ThemedText> : null}
            {authorUniversity ? <ThemedText>학교: {authorUniversity.name}</ThemedText> : null}
          </>
        )}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">신고 / 차단</ThemedText>
        <ThemedText>사유를 고른 뒤 게시글이나 작성자를 신고하고, 필요하면 바로 차단할 수 있습니다.</ThemedText>
        <ThemedView style={styles.reasonRow}>
          {REPORT_REASON_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.reasonChip,
                selectedReason === option.value && styles.reasonChipSelected,
              ]}
              onPress={() => setSelectedReason(option.value)}>
              <ThemedText type="defaultSemiBold">{option.label}</ThemedText>
            </Pressable>
          ))}
        </ThemedView>
        <Pressable style={styles.secondaryButton} onPress={() => void handleReportPost()}>
          <ThemedText type="defaultSemiBold">게시글 신고</ThemedText>
        </Pressable>
        {isOwnPost ? (
          <ThemedText>내 글은 별도 신고/차단 대상에서 제외됩니다.</ThemedText>
        ) : (
          <>
            <Pressable style={styles.secondaryButton} onPress={() => void handleReportAuthor()}>
              <ThemedText type="defaultSemiBold">작성자 신고</ThemedText>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => void handleToggleAuthorBlock(post.authorProfileId)}>
              <ThemedText type="defaultSemiBold">
                {isAuthorBlocked ? '작성자 차단 해제' : '작성자 차단'}
              </ThemedText>
            </Pressable>
          </>
        )}
        {feedback ? <ThemedText>{feedback}</ThemedText> : null}
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
              {comment.authorProfileId !== profile.id ? (
                <ThemedView style={styles.inlineActions}>
                  <Pressable onPress={() => void handleReportComment(comment.id, comment.authorProfileId)}>
                    <ThemedText type="defaultSemiBold">댓글 신고</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => void handleBlockCommentAuthor(comment.authorProfileId)}>
                    <ThemedText type="defaultSemiBold">
                      {isBlockedProfile(comment.authorProfileId) ? '작성자 차단 해제' : '작성자 차단'}
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              ) : null}
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
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  reasonChipSelected: {
    backgroundColor: 'rgba(30, 95, 175, 0.16)',
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 6,
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
