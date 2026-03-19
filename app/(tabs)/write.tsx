import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInput as TextInputType,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  COMMUNITY_VALIDATION,
  POST_CATEGORY_OPTIONS,
  POST_TYPE_OPTIONS,
} from '@/constants/community';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { SkeletonDetail } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAnalytics } from '@/hooks/use-analytics';
import { useCommunityData } from '@/hooks/use-community-data';
import { useThemeColors } from '@/hooks/use-theme-color';
import { getMajorGroupById, getUniversityById } from '@/lib/community/metadata';
import type {
  PostCategory,
  PostType,
} from '@/types/domain';

function getParamValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function WriteScreen() {
  const router = useRouter();
  const { track } = useAnalytics();
  const params = useLocalSearchParams<{ boardId: string }>();
  const boardId = getParamValue(params.boardId);
  const { createPost, getBoardById, getWriteAccessForBoard, isHydrating } = useCommunityData();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<Exclude<PostCategory, 'recruitment'>>('free');
  const [postType, setPostType] = useState<Exclude<PostType, 'recruitment'>>('general');
  const [feedback, setFeedback] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const board = getBoardById(boardId);
  const writeAccess = getWriteAccessForBoard(boardId);
  const university = getUniversityById(board?.universityId);
  const majorGroup = getMajorGroupById(board?.majorGroupId);
  const titleRef = useRef<TextInputType>(null);
  const bodyRef = useRef<TextInputType>(null);
  const hasTrackedCreateStartRef = useRef(false);

  useEffect(() => {
    if (!board || hasTrackedCreateStartRef.current) {
      return;
    }

    track('post_create_started', {
      board_scope: board.scopeType,
      university_id: board.universityId ?? null,
      major_group: board.majorGroupId ?? null,
    });
    hasTrackedCreateStartRef.current = true;
  }, [board, track]);

  if (isHydrating) {
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
        <SkeletonDetail />
      </ScrollView>
    );
  }

  if (!board) {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="title">게시판을 찾을 수 없습니다.</ThemedText>
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

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const result = await createPost({
      boardId: board.id,
      title,
      body,
      category,
      postType,
    });

    setIsSubmitting(false);
    setFeedback(result.message);

    if (result.ok && result.postId) {
      router.replace(`/(tabs)/posts/${result.postId}` as never);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled">
      {/* Header */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="title">글쓰기</ThemedText>
        <ThemedText>{board.title}</ThemedText>
        {majorGroup ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>전공군: {majorGroup.label}</ThemedText>
        ) : null}
        {university ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>학교: {university.name}</ThemedText>
        ) : null}
        {!writeAccess.ok ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>{writeAccess.message}</ThemedText>
        ) : null}
      </ThemedView>

      {/* Post type */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">글 유형</ThemedText>
        <View style={styles.optionRow}>
          {POST_TYPE_OPTIONS.map((option) => {
            const selected = option.value === postType;

            return (
              <Pressable
                key={option.value}
                disabled={!writeAccess.ok}
                onPress={() => setPostType(option.value)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: colors.chipBackground,
                    borderColor: colors.chipBorder,
                  },
                  selected && {
                    backgroundColor: colors.chipSelectedBackground,
                    borderColor: colors.chipSelectedBorder,
                  },
                  !writeAccess.ok && { opacity: 0.5 },
                  pressed && { opacity: 0.7 },
                ]}>
                <ThemedText
                  type="caption"
                  style={
                    selected
                      ? { color: colors.chipSelectedText, fontWeight: '600' }
                      : { color: colors.text, fontWeight: '600' }
                  }>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ThemedView>

      {/* Category */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">카테고리</ThemedText>
        <View style={styles.optionRow}>
          {POST_CATEGORY_OPTIONS.map((option) => {
            const selected = option.value === category;

            return (
              <Pressable
                key={option.value}
                disabled={!writeAccess.ok}
                onPress={() => setCategory(option.value)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: colors.chipBackground,
                    borderColor: colors.chipBorder,
                  },
                  selected && {
                    backgroundColor: colors.chipSelectedBackground,
                    borderColor: colors.chipSelectedBorder,
                  },
                  !writeAccess.ok && { opacity: 0.5 },
                  pressed && { opacity: 0.7 },
                ]}>
                <ThemedText
                  type="caption"
                  style={
                    selected
                      ? { color: colors.chipSelectedText, fontWeight: '600' }
                      : { color: colors.text, fontWeight: '600' }
                  }>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ThemedView>

      {/* Body input */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">본문 입력</ThemedText>
        <TextInput
          ref={titleRef}
          autoFocus
          editable={writeAccess.ok && !isSubmitting}
          maxLength={80}
          onChangeText={setTitle}
          onSubmitEditing={() => bodyRef.current?.focus()}
          placeholder={`제목은 ${COMMUNITY_VALIDATION.titleMinLength}자 이상 입력해 주세요.`}
          placeholderTextColor={colors.inputPlaceholder}
          returnKeyType="next"
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.text,
            },
          ]}
          value={title}
        />
        <ThemedText type="caption" style={{ color: title.length >= 70 ? Brand.primary : colors.textTertiary, alignSelf: 'flex-end' }}>
          {title.length}/80
        </ThemedText>
        <TextInput
          ref={bodyRef}
          editable={writeAccess.ok && !isSubmitting}
          multiline
          onChangeText={setBody}
          placeholder={`본문은 ${COMMUNITY_VALIDATION.bodyMinLength}자 이상 입력해 주세요.`}
          placeholderTextColor={colors.inputPlaceholder}
          style={[
            styles.textarea,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.text,
            },
          ]}
          value={body}
        />
        <ThemedText type="caption" style={{ color: colors.textTertiary, alignSelf: 'flex-end' }}>
          {body.length}자
        </ThemedText>
        {feedback ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>{feedback}</ThemedText>
        ) : null}
        <Pressable
          accessibilityLabel="게시글 등록"
          accessibilityRole="button"
          disabled={!writeAccess.ok || isSubmitting}
          style={({ pressed }) => [
            styles.primaryButton,
            (!writeAccess.ok || isSubmitting) && styles.disabledButton,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => void handleSubmit()}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>게시글 등록</ThemedText>
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
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    fontSize: 15,
  },
  textarea: {
    minHeight: 180,
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
