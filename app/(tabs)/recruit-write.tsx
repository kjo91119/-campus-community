import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';

import {
  COMMUNITY_VALIDATION,
  RECRUITMENT_DEADLINE_OPTIONS,
  RECRUITMENT_MODE_OPTIONS,
  RECRUITMENT_TYPE_OPTIONS,
} from '@/constants/community';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAppSession } from '@/hooks/use-app-session';
import { useCommunityData } from '@/hooks/use-community-data';
import { useThemeColor } from '@/hooks/use-theme-color';
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
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
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
    return null;
  }

  if (boardChoices.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView style={styles.hero}>
          <ThemedText type="title">모집글 작성</ThemedText>
          <ThemedText>현재 작성 가능한 모집 보드가 없습니다.</ThemedText>
        </ThemedView>
        <ThemedView style={styles.card}>
          <ThemedText>
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
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.hero}>
        <ThemedText type="title">모집글 작성</ThemedText>
        <ThemedText>
          모집글은 일반 게시글과 달리 본문과 함께 모집 메타데이터를 따로 저장합니다.
        </ThemedText>
        {!writeAccess.ok ? <ThemedText>{writeAccess.message}</ThemedText> : null}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">노출 위치</ThemedText>
        {boardChoices.map((choice) => {
          const selected = choice.id === boardId;

          return (
            <Pressable
              key={choice.id}
              disabled={!getWriteAccessForBoard(choice.id).ok}
              onPress={() => setBoardId(choice.id)}
              style={[styles.choice, selected && styles.selectedChoice]}>
              <ThemedText type="defaultSemiBold">{choice.label}</ThemedText>
              <ThemedText>{choice.description}</ThemedText>
            </Pressable>
          );
        })}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">모집 유형</ThemedText>
        <ThemedView style={styles.optionRow}>
          {RECRUITMENT_TYPE_OPTIONS.map((option) => {
            const selected = option.value === recruitmentType;

            return (
              <Pressable
                key={option.value}
                disabled={!writeAccess.ok}
                onPress={() => setRecruitmentType(option.value)}
                style={[styles.choice, selected && styles.selectedChoice]}>
                <ThemedText type="defaultSemiBold">{option.label}</ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">모집 설정</ThemedText>
        <TextInput
          editable={writeAccess.ok && !isSubmitting}
          keyboardType="number-pad"
          onChangeText={setHeadcount}
          placeholder={`${COMMUNITY_VALIDATION.recruitmentHeadcountMin}명 이상 모집 인원`}
          placeholderTextColor={borderColor}
          style={[styles.input, { borderColor, color: textColor }]}
          value={headcount}
        />
        <ThemedView style={styles.optionRow}>
          {RECRUITMENT_MODE_OPTIONS.map((option) => {
            const selected = option.value === mode;

            return (
              <Pressable
                key={option.value}
                disabled={!writeAccess.ok}
                onPress={() => setMode(option.value)}
                style={[styles.choice, selected && styles.selectedChoice]}>
                <ThemedText type="defaultSemiBold">{option.label}</ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>
        <ThemedText type="defaultSemiBold">마감 기한</ThemedText>
        <ThemedView style={styles.optionRow}>
          {RECRUITMENT_DEADLINE_OPTIONS.map((option) => {
            const selected = option.value === deadlineDays;

            return (
              <Pressable
                key={option.value}
                disabled={!writeAccess.ok}
                onPress={() => setDeadlineDays(option.value)}
                style={[styles.choice, selected && styles.selectedChoice]}>
                <ThemedText type="defaultSemiBold">{option.label}</ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">전공군 설정</ThemedText>
        <ThemedText>
          통합 모집에서는 전공군 전체 공개 또는 특정 전공군 중심 모집을 고를 수 있습니다.
        </ThemedText>
        {lockedMajorGroupId ? (
          <ThemedText>
            현재 선택한 위치는 {getMajorGroupById(lockedMajorGroupId)?.label ?? '전공'} 게시판이라 전공군이
            자동으로 고정됩니다.
          </ThemedText>
        ) : (
          <ThemedView style={styles.optionRow}>
            <Pressable
              disabled={!writeAccess.ok}
              onPress={() => setPreferredMajorGroupId('')}
              style={[styles.choice, !preferredMajorGroupId && styles.selectedChoice]}>
              <ThemedText type="defaultSemiBold">전공군 전체</ThemedText>
            </Pressable>
            {SUPPORTED_MAJOR_GROUPS.map((group) => {
              const selected = preferredMajorGroupId === group.id;

              return (
                <Pressable
                  key={group.id}
                  disabled={!writeAccess.ok}
                  onPress={() => setPreferredMajorGroupId(group.id)}
                  style={[styles.choice, selected && styles.selectedChoice]}>
                  <ThemedText type="defaultSemiBold">{group.label}</ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>
        )}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">모집 본문</ThemedText>
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
        <ThemedText>
          현재 설정: {selectedBoard?.title ?? '미선택'} ·{' '}
          {getMajorGroupById(effectiveMajorGroupId)?.label ?? '전공군 전체'}
        </ThemedText>
        {feedback ? <ThemedText>{feedback}</ThemedText> : null}
        <Pressable
          disabled={!writeAccess.ok || isSubmitting}
          style={[styles.primaryButton, (!writeAccess.ok || isSubmitting) && styles.disabledButton]}
          onPress={() => void handleSubmit()}>
          <ThemedText style={styles.primaryButtonText}>
            {isSubmitting ? '등록 중...' : '모집글 등록'}
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
  hero: {
    gap: 8,
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(44, 154, 122, 0.12)',
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
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  selectedChoice: {
    backgroundColor: 'rgba(44, 154, 122, 0.16)',
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
});
