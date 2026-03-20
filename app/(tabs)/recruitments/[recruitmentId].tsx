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
  REPORT_REASON_OPTIONS,
  RECRUITMENT_INTENT_TEMPLATES,
  RECRUITMENT_MODE_LABELS,
  RECRUITMENT_STATUS_LABELS,
  RECRUITMENT_TYPE_LABELS,
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

export default function RecruitmentDetailScreen() {
  const router = useRouter();
  const { track } = useAnalytics();
  const params = useLocalSearchParams<{ recruitmentId: string }>();
  const recruitmentId = getParamValue(params.recruitmentId);
  const { profile } = useAppSession();
  const {
    blockProfile,
    createComment,
    getBoardById,
    getCommentAccessForPost,
    getCommentsByPostId,
    getPostById,
    getReadAccessForRecruitment,
    getRecruitmentById,
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
  const readAccess = getReadAccessForRecruitment(recruitmentId);
  const recruitment = getRecruitmentById(recruitmentId);
  const post = getPostById(recruitment?.postId);
  const comments = getCommentsByPostId(recruitment?.postId).filter(
    (comment) => comment.kind === 'recruitment_intent'
  );
  const commentAccess = getCommentAccessForPost(recruitment?.postId);
  const board = getBoardById(post?.boardId);
  const majorGroup = getMajorGroupById(recruitment?.preferredMajorGroupId);
  const university = getUniversityById(post?.universityId);
  const authorUniversity = getUniversityById(post?.authorUniversityId);
  const authorMajorGroup = getMajorGroupById(post?.authorMajorGroupId);
  const isOwnRecruitment = post?.authorProfileId === profile.id;
  const isAuthorBlocked = isBlockedProfile(post?.authorProfileId);
  const hasTrackedOpenRef = useRef(false);

  useEffect(() => {
    if (!recruitment || !post || hasTrackedOpenRef.current) {
      return;
    }

    track('recruitment_opened', {
      recruitment_type: recruitment.recruitmentType,
      board_scope: board?.scopeType ?? null,
      university_id: post.universityId ?? null,
      major_group: recruitment.preferredMajorGroupId ?? post.majorGroupId ?? null,
    });
    hasTrackedOpenRef.current = true;
  }, [board?.scopeType, post, recruitment, track]);

  if (isHydrating) {
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
        <SkeletonDetail />
      </ScrollView>
    );
  }

  if (!readAccess.ok && readAccess.message !== '모집글을 찾을 수 없습니다.') {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="title">이 모집글은 볼 수 없습니다.</ThemedText>
        <ThemedText style={{ color: colors.textSecondary }}>{readAccess.message}</ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => router.replace('/(tabs)' as never)}>
          <ThemedText type="defaultSemiBold">모집 탭으로 돌아가기</ThemedText>
        </Pressable>
      </View>
    );
  }

  if (!recruitment || !post) {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="title">모집글을 찾을 수 없습니다.</ThemedText>
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

  const handleIntentTemplate = () => {
    setCommentBody(RECRUITMENT_INTENT_TEMPLATES[recruitment.recruitmentType]);
  };

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
        showToast('참여 의사가 등록되었습니다.', 'success');
      } else {
        showToast(result.message ?? '등록에 실패했습니다.', 'error');
      }
    } catch {
      showToast('네트워크 오류가 발생했습니다. 다시 시도해 주세요.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportRecruitment = async () => {
    if (!recruitment || !post) {
      return;
    }

    const result = await reportTarget({
      targetType: 'recruitment',
      targetId: recruitment.id,
      targetProfileId: post.authorProfileId,
      reason: selectedReason,
    });

    setFeedback(result.message);
  };

  const handleReportAuthor = async () => {
    if (!post || isOwnRecruitment) {
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
      router.replace('/(tabs)/recruit' as never);
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
      router.replace('/(tabs)/recruit' as never);
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
        <ThemedText type="title">{recruitment.title}</ThemedText>
        <ThemedText>{post.body}</ThemedText>

        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: Brand.primaryMuted }]}>
            <ThemedText type="caption" style={{ color: Brand.primary }}>
              {RECRUITMENT_TYPE_LABELS[recruitment.recruitmentType]}
            </ThemedText>
          </View>
          <View style={[styles.badge, { backgroundColor: Brand.secondaryMuted }]}>
            <ThemedText type="caption" style={{ color: Brand.secondary }}>
              {RECRUITMENT_MODE_LABELS[recruitment.mode ?? 'online']}
            </ThemedText>
          </View>
          <View style={[styles.badge, { backgroundColor: Brand.successMuted }]}>
            <ThemedText type="caption" style={{ color: Brand.success }}>
              {RECRUITMENT_STATUS_LABELS[recruitment.status]}
            </ThemedText>
          </View>
        </View>

        <View style={styles.metaRow}>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            {majorGroup?.label ?? '통합 모집'}
          </ThemedText>
          <ThemedText type="caption" style={{ color: colors.textTertiary }}> · </ThemedText>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            {recruitment.headcountLabel}
          </ThemedText>
          <ThemedText type="caption" style={{ color: colors.textTertiary }}> · </ThemedText>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            {recruitment.deadlineLabel}
          </ThemedText>
        </View>

        {board ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>게시 위치: {board.title}</ThemedText>
        ) : null}
        {university ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>학교 연계: {university.name}</ThemedText>
        ) : null}
      </ThemedView>

      {/* Author info */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">작성자 정보 요약</ThemedText>
        {post.isAnonymous ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            익명 모집글이라 작성자 요약 정보는 공개되지 않습니다.
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
          사유를 고른 뒤 모집글이나 작성자를 신고하고, 필요하면 바로 차단할 수 있습니다.
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
          onPress={() => void handleReportRecruitment()}>
          <ThemedText type="defaultSemiBold">모집글 신고</ThemedText>
        </Pressable>
        {isOwnRecruitment ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            내 모집글은 별도 신고/차단 대상에서 제외됩니다.
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

      {/* Participation guide */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">참여 방식</ThemedText>
        <ThemedText>{recruitment.commentPrompt}</ThemedText>
        <Pressable
          disabled={!commentAccess.ok || isSubmitting}
          style={({ pressed }) => [
            styles.secondaryButton,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            (!commentAccess.ok || isSubmitting) && styles.disabledButton,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleIntentTemplate}>
          <ThemedText type="defaultSemiBold">참여 의사 템플릿 넣기</ThemedText>
        </Pressable>
      </ThemedView>

      {/* Intent comments */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">참여 의사 댓글</ThemedText>
        {comments.length === 0 ? (
          <EmptyState icon="chatbubbles-outline" title="아직 댓글이 없습니다" description="첫 댓글을 남겨 대화를 시작해 보세요." />
        ) : (
          comments.map((comment, index) => (
            <View
              key={comment.id}
              style={[
                styles.commentItem,
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
        <ThemedText type="sectionHeader">참여 의사 남기기</ThemedText>
        {!commentAccess.ok ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>{commentAccess.message}</ThemedText>
        ) : null}
        <TextInput
          accessibilityLabel="참여 의사 댓글 입력"
          editable={commentAccess.ok && !isSubmitting}
          multiline
          onChangeText={setCommentBody}
          placeholder="참여 가능 시간, 역할, 경험을 한 번에 남겨 주세요."
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
            <ThemedText style={styles.primaryButtonText}>참여 의사 댓글 등록</ThemedText>
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
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  commentItem: {
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  commentSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    minHeight: 120,
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
  secondaryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
