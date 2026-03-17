import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  COMMUNITY_VALIDATION,
  POST_CATEGORY_OPTIONS,
  POST_TYPE_OPTIONS,
} from '@/constants/community';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAnalytics } from '@/hooks/use-analytics';
import { useCommunityData } from '@/hooks/use-community-data';
import { useThemeColor } from '@/hooks/use-theme-color';
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
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const board = getBoardById(boardId);
  const writeAccess = getWriteAccessForBoard(boardId);
  const university = getUniversityById(board?.universityId);
  const majorGroup = getMajorGroupById(board?.majorGroupId);
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
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.hero}>
        <ThemedText type="title">글쓰기</ThemedText>
        <ThemedText>{board.title}</ThemedText>
        {majorGroup ? <ThemedText>전공군: {majorGroup.label}</ThemedText> : null}
        {university ? <ThemedText>학교: {university.name}</ThemedText> : null}
        {!writeAccess.ok ? <ThemedText>{writeAccess.message}</ThemedText> : null}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">글 유형</ThemedText>
        <ThemedView style={styles.optionRow}>
          {POST_TYPE_OPTIONS.map((option) => {
            const selected = option.value === postType;

            return (
              <Pressable
                key={option.value}
                disabled={!writeAccess.ok}
                onPress={() => setPostType(option.value)}
                style={[styles.choice, selected && styles.selectedChoice]}>
                <ThemedText type="defaultSemiBold">{option.label}</ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">카테고리</ThemedText>
        <ThemedView style={styles.optionRow}>
          {POST_CATEGORY_OPTIONS.map((option) => {
            const selected = option.value === category;

            return (
              <Pressable
                key={option.value}
                disabled={!writeAccess.ok}
                onPress={() => setCategory(option.value)}
                style={[styles.choice, selected && styles.selectedChoice]}>
                <ThemedText type="defaultSemiBold">{option.label}</ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">본문 입력</ThemedText>
        <TextInput
          editable={writeAccess.ok && !isSubmitting}
          maxLength={80}
          onChangeText={setTitle}
          placeholder={`제목은 ${COMMUNITY_VALIDATION.titleMinLength}자 이상 입력해 주세요.`}
          placeholderTextColor={borderColor}
          style={[styles.input, { borderColor, color: textColor }]}
          value={title}
        />
        <TextInput
          editable={writeAccess.ok && !isSubmitting}
          multiline
          onChangeText={setBody}
          placeholder={`본문은 ${COMMUNITY_VALIDATION.bodyMinLength}자 이상 입력해 주세요.`}
          placeholderTextColor={borderColor}
          style={[styles.textarea, { borderColor, color: textColor }]}
          value={body}
        />
        {feedback ? <ThemedText>{feedback}</ThemedText> : null}
        <Pressable
          disabled={!writeAccess.ok || isSubmitting}
          style={[styles.primaryButton, (!writeAccess.ok || isSubmitting) && styles.disabledButton]}
          onPress={() => void handleSubmit()}>
          <ThemedText style={styles.primaryButtonText}>
            {isSubmitting ? '등록 중...' : '게시글 등록'}
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
    backgroundColor: 'rgba(170, 107, 45, 0.12)',
  },
  card: {
    gap: 12,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choice: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  selectedChoice: {
    backgroundColor: 'rgba(30, 95, 175, 0.14)',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  textarea: {
    minHeight: 180,
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
