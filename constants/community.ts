import type {
  BoardScopeType,
  PostCategory,
  PostType,
} from '@/types/domain';

export const POST_TYPE_OPTIONS: Array<{
  value: Exclude<PostType, 'recruitment'>;
  label: string;
}> = [
  { value: 'general', label: '일반글' },
  { value: 'question', label: '질문글' },
];

export const POST_CATEGORY_OPTIONS: Array<{
  value: Exclude<PostCategory, 'recruitment'>;
  label: string;
}> = [
  { value: 'practice', label: '실습' },
  { value: 'exam', label: '국시' },
  { value: 'career', label: '취업' },
  { value: 'qna', label: '질문답변' },
  { value: 'free', label: '자유' },
];

export const POST_CATEGORY_LABELS: Record<Exclude<PostCategory, 'recruitment'>, string> = {
  practice: '실습',
  exam: '국시',
  career: '취업',
  qna: '질문답변',
  free: '자유',
};

export const POST_TYPE_LABELS: Record<Exclude<PostType, 'recruitment'>, string> = {
  general: '일반글',
  question: '질문글',
};

export const BOARD_SCOPE_LABELS: Record<BoardScopeType, string> = {
  network: '통합 네트워크',
  major_group: '전공 게시판',
  university: '학교 게시판',
};

export const COMMUNITY_VALIDATION = {
  titleMinLength: 4,
  bodyMinLength: 12,
  commentMinLength: 2,
  summaryMaxLength: 88,
} as const;
