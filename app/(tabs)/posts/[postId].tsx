import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import {
  POST_CATEGORY_LABELS,
  POST_TYPE_LABELS,
  REPORT_REASON_OPTIONS,
} from '@/constants/community';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useToast } from '@/components/toast';
import { validateComment } from '@/lib/validation';
import { EmptyState } from '@/components/empty-state';
import { SkeletonDetail } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAppSession } from '@/hooks/use-app-session';
import { useCommunityData } from '@/hooks/use-community-data';
import { useThemeColors } from '@/hooks/use-theme-color';
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
    isRefreshing,
    refresh,
    reportTarget,
    unblockProfile,
  } = useCommunityData();
  const [commentBody, setCommentBody] = useState('');
  const [selectedReason, setSelectedReason] = useState<ReportReason>(REPORT_REASON_OPTIONS[0]!.value);
  const [feedback, setFeedback] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
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
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
        <SkeletonDetail />
      </ScrollView>
    );
  }

  if (!readAccess.ok && readAccess.message !== '게시글을 찾을 수 없습니다.') {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="title">이 게시글은 볼 수 없습니다.</ThemedText>
        <ThemedText style={{ color: colors.textSecondary }}>{readAccess.message}</ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => router.replace('/(tabs)' as never)}>
          <ThemedText type="defaultSemiBold">홈으로 돌아가기</ThemedText>
        </Pressable>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="title">게시글을 찾을 수 없습니다.</ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => router.back()}>
          <ThemedText type="defaultSemiBold">이전 화면으로 돌아가기</ThemedText>
        </Pressable>
      </View>
    );
  }

  const commentValidation = validateComment(commentBody);
  const canSubmitComment = commentAccess.ok && !isSubmitting && commentValidation.ok;

  const handleSubmit = async () => {
    if (!commentValidation.ok) {
      showToast(commentValidation.message ?? '댓글을 확인해 주세요.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createComment({
        postId: post.id,
        body: commentBody,
      });

      setFeedback(result.message);

      if (result.ok) {
        setCommentBody('');
        showToast('댓글이 등록되었습니다.', 'success');
      } else {
        showToast(result.message ?? '댓글 등록에 실패했습니다.', 'error');
      }
    } catch {
      showToast('네트워크 오류가 발생했습니다. 다시 시도해 주세요.', 'error');
    } finally {
      setIsSubmitting(false);
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
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.textTertiary} />}>
      {/* Hero card */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="title">{post.title}</ThemedText>
        <ThemedText>{post.body}</ThemedText>

        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: Brand.primaryMuted }]}>
            <ThemedText type="caption" style={{ color: Brand.primary }}>
              {POST_TYPE_LABELS[post.postType as keyof typeof POST_TYPE_LABELS] ?? post.postType}
            </ThemedText>
          </View>
          <View style={[styles.badge, { backgroundColor: Brand.secondaryMuted }]}>
            <ThemedText type="caption" style={{ color: Brand.secondary }}>
              {POST_CATEGORY_LABELS[post.category as keyof typeof POST_CATEGORY_LABELS] ?? post.category}
            </ThemedText>
          </View>
        </View>

        {board ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>게시판: {board.title}</ThemedText>
        ) : null}
        {majorGroup ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>전공군: {majorGroup.label}</ThemedText>
        ) : null}
        {university ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>학교: {university.name}</ThemedText>
        ) : null}
        <ThemedText type="caption" style={{ color: colors.textTertiary }}>
          댓글 {post.commentCount} · {post.createdLabel}
        </ThemedText>
      </ThemedView>

      {/* Author info */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">작성자 정보</ThemedText>
        {post.isAnonymous ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            익명 작성글이라 작성자 요약 정보는 공개되지 않습니다.
          </ThemedText>
        ) : (
          <>
            <ThemedText>닉네임: {post.authorNickname}</ThemedText>
            {authorMajorGroup ? (
              <ThemedText type="caption" style={{ color: colors.textSecondary }}>전공군: {authorMajorGroup.label}</ThemedText>
            ) : null}
            {authorUniversity ? (
              <ThemedText type="caption" style={{ color: colors.textSecondary }}>학교: {authorUniversity.name}</ThemedText>
            ) : null}
          </>
        )}
      </ThemedView>

      {/* Report / Block */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">신고 / 차단</ThemedText>
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          사유를 고른 뒤 게시글이나 작성자를 신고하고, 필요하면 바로 차단할 수 있습니다.
        </ThemedText>
        <View style={styles.reasonRow}>
          {REPORT_REASON_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.reasonChip,
                {
                  backgroundColor: colors.chipBackground,
                  borderColor: colors.chipBorder,
                },
                selectedReason === option.value && {
                  backgroundColor: colors.chipSelectedBackground,
                  borderColor: colors.chipSelectedBorder,
                },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => setSelectedReason(option.value)}>
              <ThemedText
                type="caption"
                style={
                  selectedReason === option.value
                    ? { color: colors.chipSelectedText, fontWeight: '600' }
                    : { color: colors.text, fontWeight: '600' }
                }>
                {option.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => void handleReportPost()}>
          <ThemedText type="defaultSemiBold">게시글 신고</ThemedText>
        </Pressable>
        {isOwnPost ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            내 글은 별도 신고/차단 대상에서 제외됩니다.
          </ThemedText>
        ) : (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => void handleReportAuthor()}>
              <ThemedText type="defaultSemiBold">작성자 신고</ThemedText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => void handleToggleAuthorBlock(post.authorProfileId)}>
              <ThemedText type="defaultSemiBold">
                {isAuthorBlocked ? '작성자 차단 해제' : '작성자 차단'}
              </ThemedText>
            </Pressable>
          </>
        )}
        {feedback ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>{feedback}</ThemedText>
        ) : null}
      </ThemedView>

      {/* Comments */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">댓글</ThemedText>
        {comments.length === 0 ? (
          <EmptyState icon="chatbubbles-outline" title="아직 댓글이 없습니다" description="첫 댓글을 남겨 대화를 시작해 보세요." />
        ) : (
          comments.map((comment, index) => (
            <View
              key={comment.id}
              style={[
                styles.commentItem,
                comment.depth === 2 && [styles.replyItem, { borderLeftColor: colors.border }],
                index < comments.length - 1 && [styles.commentSeparator, { borderBottomColor: colors.border }],
              ]}>
              <ThemedText type="defaultSemiBold">
                {comment.isAnonymous ? '익명' : comment.authorNickname}
              </ThemedText>
              <ThemedText>{comment.body}</ThemedText>
              <ThemedText type="caption" style={{ color: colors.textTertiary }}>
                {comment.createdLabel}
              </ThemedText>
              {comment.authorProfileId !== profile.id ? (
                <View style={styles.inlineActions}>
                  <Pressable
                    accessibilityLabel="댓글 신고"
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.inlineActionButton, pressed && { opacity: 0.5 }]}
                    onPress={() => void handleReportComment(comment.id, comment.authorProfileId)}>
                    <Ionicons name="flag-outline" size={12} color={colors.textTertiary} />
                    <ThemedText type="caption" style={{ color: colors.textTertiary }}>댓글 신고</ThemedText>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={isBlockedProfile(comment.authorProfileId) ? '작성자 차단 해제' : '작성자 차단'}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.inlineActionButton, pressed && { opacity: 0.5 }]}
                    onPress={() => void handleBlockCommentAuthor(comment.authorProfileId)}>
                    <Ionicons name="ban-outline" size={12} color={colors.textTertiary} />
                    <ThemedText type="caption" style={{ color: colors.textTertiary }}>
                      {isBlockedProfile(comment.authorProfileId) ? '작성자 차단 해제' : '작성자 차단'}
                    </ThemedText>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))
        )}
      </ThemedView>

      {/* Comment form */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">댓글 작성</ThemedText>
        {!commentAccess.ok ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>{commentAccess.message}</ThemedText>
        ) : null}
        <TextInput
          accessibilityLabel="댓글 입력"
          editable={commentAccess.ok && !isSubmitting}
          multiline
          onChangeText={setCommentBody}
          placeholder="댓글을 입력해 주세요."
          placeholderTextColor={colors.inputPlaceholder}
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.text,
            },
          ]}
          value={commentBody}
        />
        <ThemedText type="caption" style={{ color: colors.textTertiary, alignSelf: 'flex-end' }}>
          {commentBody.length}자
        </ThemedText>
        {feedback ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>{feedback}</ThemedText>
        ) : null}
        <Pressable
          disabled={!canSubmitComment}
          style={({ pressed }) => [
            styles.primaryButton,
            !canSubmitComment && styles.disabledButton,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => void handleSubmit()}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>댓글 등록</ThemedText>
          )}
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
    gap: Spacing.lg,
  },
  card: {
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  badge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
  },
  commentItem: {
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  commentSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  replyItem: {
    marginLeft: Spacing.xl,
    paddingLeft: Spacing.lg,
    borderLeftWidth: 2,
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  reasonChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    paddingTop: Spacing.xs,
  },
  inlineActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  input: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  primaryButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    backgroundColor: Brand.primary,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.5,
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
});
