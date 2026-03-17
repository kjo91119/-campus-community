import type {
  BoardScopeType,
  PostCategory,
  PostType,
  ReportReason,
  RecruitmentMode,
  RecruitmentStatus,
  RecruitmentType,
} from '@/types/domain';

export const POST_TYPE_OPTIONS: {
  value: Exclude<PostType, 'recruitment'>;
  label: string;
}[] = [
  { value: 'general', label: '일반글' },
  { value: 'question', label: '질문글' },
];

export const POST_CATEGORY_OPTIONS: {
  value: Exclude<PostCategory, 'recruitment'>;
  label: string;
}[] = [
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

export const RECRUITMENT_TYPE_OPTIONS: {
  value: RecruitmentType;
  label: string;
}[] = [
  { value: 'study', label: '스터디' },
  { value: 'assignment', label: '과제' },
  { value: 'contest', label: '공모전/대회' },
  { value: 'project', label: '팀 프로젝트' },
];

export const RECRUITMENT_MODE_OPTIONS: {
  value: RecruitmentMode;
  label: string;
}[] = [
  { value: 'online', label: '온라인' },
  { value: 'offline', label: '오프라인' },
  { value: 'hybrid', label: '혼합' },
];

export const RECRUITMENT_DEADLINE_OPTIONS = [
  { value: 3, label: '3일 후' },
  { value: 7, label: '7일 후' },
  { value: 14, label: '14일 후' },
] as const;

export const RECRUITMENT_TYPE_LABELS: Record<RecruitmentType, string> = {
  study: '스터디',
  assignment: '과제',
  contest: '공모전/대회',
  project: '팀 프로젝트',
};

export const RECRUITMENT_MODE_LABELS: Record<RecruitmentMode, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '혼합',
};

export const RECRUITMENT_STATUS_LABELS: Record<RecruitmentStatus, string> = {
  open: '모집 중',
  closed: '마감',
  completed: '완료',
};

export const RECRUITMENT_COMMENT_PROMPTS: Record<RecruitmentType, string> = {
  study: '가능한 회독 루틴이나 참여 시간을 댓글로 남겨 주세요.',
  assignment: '가능한 시간과 맡을 수 있는 파트를 댓글로 남겨 주세요.',
  contest: '관심 분야와 맡고 싶은 역할을 댓글로 남겨 주세요.',
  project: '참여 가능한 일정과 맡고 싶은 역할을 댓글로 남겨 주세요.',
};

export const RECRUITMENT_INTENT_TEMPLATES: Record<RecruitmentType, string> = {
  study: '참여 희망합니다. 가능한 시간은 평일 저녁이고 함께 달성하고 싶은 목표가 있습니다.',
  assignment: '참여 가능합니다. 가능한 시간과 맡고 싶은 파트를 함께 조율하고 싶습니다.',
  contest: '참여 희망합니다. 관련 경험과 맡고 싶은 역할을 아래에 남깁니다.',
  project: '팀원으로 참여하고 싶습니다. 가능한 일정과 담당 가능 역할을 공유합니다.',
};

export const REPORT_REASON_OPTIONS: {
  value: ReportReason;
  label: string;
}[] = [
  { value: 'abuse', label: '욕설/비방' },
  { value: 'hate', label: '혐오/차별' },
  { value: 'sexual', label: '음란/부적절' },
  { value: 'spam', label: '광고/도배' },
  { value: 'misinformation', label: '허위 정보' },
  { value: 'impersonation', label: '사칭' },
  { value: 'scam', label: '사기 의심' },
];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  abuse: '욕설/비방',
  hate: '혐오/차별',
  sexual: '음란/부적절',
  spam: '광고/도배',
  misinformation: '허위 정보',
  impersonation: '사칭',
  scam: '사기 의심',
};

export const COMMUNITY_VALIDATION = {
  titleMinLength: 4,
  bodyMinLength: 12,
  commentMinLength: 2,
  summaryMaxLength: 88,
  recruitmentHeadcountMin: 2,
  recruitmentHeadcountMax: 20,
} as const;
