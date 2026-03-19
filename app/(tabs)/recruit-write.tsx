import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInput as TextInputType,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  COMMUNITY_VALIDATION,
  RECRUITMENT_DEADLINE_OPTIONS,
  RECRUITMENT_MODE_OPTIONS,
  RECRUITMENT_TYPE_OPTIONS,
} from '@/constants/community';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { SkeletonDetail } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAppSession } from '@/hooks/use-app-session';
import { useCommunityData } from '@/hooks/use-community-data';
import { useThemeColors } from '@/hooks/use-theme-color';
import {
  SUPPORTED_MAJOR_GROUPS,
  getMajorGroupById,
  getUniversityById,
} from '@/lib/community/metadata';
import type {
  RecruitmentMode,
  RecruitmentType,
} from '@/types/domain';

type BoardChoice = {
  id: string;
  label: string;
  description: string;
};

export default function RecruitWriteScreen() {
  const router = useRouter();
  const { track } = useAnalytics();
  const { profile } = useAppSession();
  const {
    createRecruitment,
    getBoardById,
    getMajorBoardByMajorGroupId,
    getNetworkBoard,
    getSchoolBoardByUniversityId,
    getWriteAccessForBoard,
    isHydrating,
  } = useCommunityData();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const networkBoard = getNetworkBoard();
  const schoolBoard = getSchoolBoardByUniversityId(profile.primaryUniversityId);
  const majorBoard = getMajorBoardByMajorGroupId(profile.primaryMajorGroupId);
  const boardChoices = useMemo<BoardChoice[]>(() => {
    const nextChoices: BoardChoice[] = [];

    if (networkBoard) {
      nextChoices.push({
        id: networkBoard.id,
        label: '통합 모집',
        description: '전공군 전체가 함께 보는 통합 모집 탭에 올립니다.',
      });
    }

    if (majorBoard) {
      nextChoices.push({
        id: majorBoard.id,
        label: `${getMajorGroupById(majorBoard.majorGroupId)?.label ?? '내 전공'} 모집`,
        description: '내 전공군 게시판과 연동되는 모집글입니다.',
      });
    }

    if (schoolBoard) {
      nextChoices.push({
        id: schoolBoard.id,
        label: `${getUniversityById(schoolBoard.universityId)?.name ?? '학교'} 팀원 모집`,
        description: '같은 학교 인증 사용자만 보는 모집글입니다.',
      });
    }

    return nextChoices;
  }, [majorBoard, networkBoard, schoolBoard]);
  const [boardId, setBoardId] = useState(boardChoices[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [recruitmentType, setRecruitmentType] = useState<RecruitmentType>('study');
  const [mode, setMode] = useState<RecruitmentMode>('online');
  const [headcount, setHeadcount] = useState('3');
  const [deadlineDays, setDeadlineDays] = useState<number>(7);
  const [preferredMajorGroupId, setPreferredMajorGroupId] = useState(profile.primaryMajorGroupId ?? '');
  const [feedback, setFeedback] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedBoard = getBoardById(boardId);
  const writeAccess = getWriteAccessForBoard(boardId);
  const lockedMajorGroupId =
    selectedBoard?.scopeType === 'major_group' ? selectedBoard.majorGroupId : undefined;
  const effectiveMajorGroupId = lockedMajorGroupId ?? preferredMajorGroupId;
  const titleRef = useRef<TextInputType>(null);
  const bodyRef = useRef<TextInputType>(null);
  const hasTrackedCreateStartRef = useRef(false);

  useEffect(() => {
    if (boardChoices.some((choice) => choice.id === boardId)) {
      return;
    }

    setBoardId(boardChoices[0]?.id ?? '');
  }, [boardChoices, boardId]);

  useEffect(() => {
    if (!selectedBoard || hasTrackedCreateStartRef.current) {
      return;
    }

    track('post_create_started', {
      board_scope: selectedBoard.scopeType,
      university_id: selectedBoard.universityId ?? null,
      major_group: selectedBoard.majorGroupId ?? effectiveMajorGroupId ?? null,
      post_type: 'recruitment',
    });
    hasTrackedCreateStartRef.current = true;
  }, [effectiveMajorGroupId, selectedBoard, track]);

  if (isHydrating) {
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
        <SkeletonDetail />
      </ScrollView>
    );
  }

  if (boardChoices.length === 0) {
    return (
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedView variant="surface" style={styles.card}>
          <ThemedText type="title">모집글 작성</ThemedText>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            현재 작성 가능한 모집 보드가 없습니다.
          </ThemedText>
        </ThemedView>
        <ThemedView variant="surface" style={styles.card}>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            통합 모집 보드나 전공/학교 보드가 비활성화된 상태일 수 있습니다. 보드 설정을 다시 확인해 주세요.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    );
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const result = await createRecruitment({
      boardId,
      title,
      body,
      recruitmentType,
      mode,
      headcount,
      deadlineDays,
      preferredMajorGroupId: effectiveMajorGroupId,
    });

    setIsSubmitting(false);
    setFeedback(result.message);

    if (result.ok && result.recruitmentId) {
      router.replace(`/(tabs)/recruitments/${result.recruitmentId}` as never);
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
        <ThemedText type="title">모집글 작성</ThemedText>
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          모집글은 일반 게시글과 달리 본문과 함께 모집 메타데이터를 따로 저장합니다.
        </ThemedText>
        {!writeAccess.ok ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>{writeAccess.message}</ThemedText>
        ) : null}
      </ThemedView>

      {/* Board selection */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">노출 위치</ThemedText>
        {boardChoices.map((choice) => {
          const selected = choice.id === boardId;
          const choiceAccess = getWriteAccessForBoard(choice.id);

          return (
            <Pressable
              key={choice.id}
              disabled={!choiceAccess.ok}
              onPress={() => setBoardId(choice.id)}
              style={({ pressed }) => [
                styles.selectionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: selected ? colors.chipSelectedBorder : colors.cardBorder,
                },
                selected && { backgroundColor: colors.chipSelectedBackground },
                !choiceAccess.ok && styles.disabledButton,
                pressed && { opacity: 0.85 },
              ]}>
              <ThemedText
                type="defaultSemiBold"
                style={selected ? { color: colors.chipSelectedText } : undefined}>
                {choice.label}
              </ThemedText>
              <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                {choice.description}
              </ThemedText>
            </Pressable>
          );
        })}
      </ThemedView>

      {/* Recruitment type */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">모집 유형</ThemedText>
        <View style={styles.optionRow}>
          {RECRUITMENT_TYPE_OPTIONS.map((option) => {
            const selected = option.value === recruitmentType;

            return (
              <Pressable
                key={option.value}
                disabled={!writeAccess.ok}
                onPress={() => setRecruitmentType(option.value)}
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

      {/* Recruitment settings */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">모집 설정</ThemedText>
        <TextInput
          editable={writeAccess.ok && !isSubmitting}
          keyboardType="number-pad"
          onChangeText={setHeadcount}
          placeholder={`${COMMUNITY_VALIDATION.recruitmentHeadcountMin}명 이상 모집 인원`}
          placeholderTextColor={colors.inputPlaceholder}
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.text,
            },
          ]}
          value={headcount}
        />
        <View style={styles.optionRow}>
          {RECRUITMENT_MODE_OPTIONS.map((option) => {
            const selected = option.value === mode;

            return (
              <Pressable
                key={option.value}
                disabled={!writeAccess.ok}
                onPress={() => setMode(option.value)}
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
        <ThemedText type="sectionHeader">마감 기한</ThemedText>
        <View style={styles.optionRow}>
          {RECRUITMENT_DEADLINE_OPTIONS.map((option) => {
            const selected = option.value === deadlineDays;

            return (
              <Pressable
                key={option.value}
                disabled={!writeAccess.ok}
                onPress={() => setDeadlineDays(option.value)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: colors.chipBackground,
                    borderColor: colors.chipBorder,
                  },
                  !writeAccess.ok && { opacity: 0.5 },
                  pressed && { opacity: 0.7 },
                  selected && {
                    backgroundColor: colors.chipSelectedBackground,
                    borderColor: colors.chipSelectedBorder,
                  },
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

      {/* Major group */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">전공군 설정</ThemedText>
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          통합 모집에서는 전공군 전체 공개 또는 특정 전공군 중심 모집을 고를 수 있습니다.
        </ThemedText>
        {lockedMajorGroupId ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            현재 선택한 위치는 {getMajorGroupById(lockedMajorGroupId)?.label ?? '전공'} 게시판이라 전공군이
            자동으로 고정됩니다.
          </ThemedText>
        ) : (
          <View style={styles.optionRow}>
            <Pressable
              disabled={!writeAccess.ok}
              onPress={() => setPreferredMajorGroupId('')}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: colors.chipBackground,
                  borderColor: colors.chipBorder,
                },
                !preferredMajorGroupId && {
                  backgroundColor: colors.chipSelectedBackground,
                  borderColor: colors.chipSelectedBorder,
                },
                !writeAccess.ok && { opacity: 0.5 },
                pressed && { opacity: 0.7 },
              ]}>
              <ThemedText
                type="caption"
                style={
                  !preferredMajorGroupId
                    ? { color: colors.chipSelectedText, fontWeight: '600' }
                    : { color: colors.text, fontWeight: '600' }
                }>
                전공군 전체
              </ThemedText>
            </Pressable>
            {SUPPORTED_MAJOR_GROUPS.map((group) => {
              const selected = preferredMajorGroupId === group.id;

              return (
                <Pressable
                  key={group.id}
                  disabled={!writeAccess.ok}
                  onPress={() => setPreferredMajorGroupId(group.id)}
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
                    {group.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        )}
      </ThemedView>

      {/* Body */}
      <ThemedView variant="surface" style={styles.card}>
        <ThemedText type="sectionHeader">모집 본문</ThemedText>
        <TextInput
          ref={titleRef}
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
        <ThemedText type="caption" style={{ color: colors.textTertiary }}>
          현재 설정: {selectedBoard?.title ?? '미선택'} ·{' '}
          {getMajorGroupById(effectiveMajorGroupId)?.label ?? '전공군 전체'}
        </ThemedText>
        {feedback ? (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>{feedback}</ThemedText>
        ) : null}
        <Pressable
          accessibilityLabel="모집글 등록"
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
            <ThemedText style={styles.primaryButtonText}>모집글 등록</ThemedText>
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
  selectionCard: {
    gap: Spacing.xs,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
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
});
