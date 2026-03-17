import { SUPPORTED_MAJOR_GROUPS, SUPPORTED_UNIVERSITIES } from '@/lib/community/metadata';
import type {
  AppSessionScenario,
  Board,
  Comment,
  CommunityPost,
  Major,
  Profile,
  RecruitmentCard,
  University,
  VerificationRecord,
} from '@/types/domain';

export const MOCK_UNIVERSITIES: University[] = SUPPORTED_UNIVERSITIES.map((university) => ({
  ...university,
}));

export const MOCK_MAJORS: Major[] = [
  {
    id: 'major-yonsei-physical-therapy',
    majorGroupId: 'physical-therapy',
    universityId: 'yonsei',
    name: '물리치료학과',
    isActive: true,
  },
  {
    id: 'major-konyang-occupational-therapy',
    majorGroupId: 'occupational-therapy',
    universityId: 'konyang',
    name: '작업치료학과',
    isActive: true,
  },
  {
    id: 'major-daegu-radiology',
    majorGroupId: 'radiology',
    universityId: 'daegu-health',
    name: '방사선과',
    isActive: true,
  },
  {
    id: 'major-eulji-clinical-pathology',
    majorGroupId: 'clinical-pathology',
    universityId: 'eulji',
    name: '임상병리학과',
    isActive: true,
  },
  {
    id: 'major-general-rehab-science',
    majorGroupId: 'physical-therapy',
    name: '재활과학과',
    isActive: true,
  },
  {
    id: 'major-general-occupational-science',
    majorGroupId: 'occupational-therapy',
    name: '작업치료재활학과',
    isActive: true,
  },
];

const NETWORK_BOARD: Board = {
  id: 'network-home',
  slug: 'home',
  title: '통합 홈',
  description: '보건의료기사 계열 4개 전공군의 최신 글을 한 번에 보는 피드',
  scopeType: 'network',
  visibility: 'verified_all',
  postTypeDefault: 'general',
  isActive: true,
};

export const MOCK_MAJOR_BOARDS: Board[] = SUPPORTED_MAJOR_GROUPS.map((group) => ({
  id: `major-${group.id}`,
  slug: group.slug,
  title: `${group.label} 게시판`,
  description: `${group.label} 전공군 중심 질문, 실습, 국시 이야기를 모아보는 보드`,
  scopeType: 'major_group',
  visibility: 'verified_all',
  majorGroupId: group.id,
  postTypeDefault: 'general',
  isActive: true,
}));

export const MOCK_UNIVERSITY_BOARDS: Board[] = MOCK_UNIVERSITIES.map((university) => ({
  id: `school-${university.id}`,
  slug: university.slug,
  title: `${university.name} 게시판`,
  description: '같은 학교 인증 사용자만 볼 수 있는 제한형 보드',
  scopeType: 'university',
  visibility: 'verified_same_university',
  universityId: university.id,
  postTypeDefault: 'general',
  isActive: true,
}));

export const MOCK_BOARDS: Board[] = [NETWORK_BOARD, ...MOCK_MAJOR_BOARDS, ...MOCK_UNIVERSITY_BOARDS];

export const MOCK_PROFILES: Profile[] = [
  {
    id: 'demo-user',
    nickname: '새내기익명',
    role: 'user',
    verificationStatus: 'unverified',
    accountStatus: 'active',
    onboardingCompleted: false,
    createdAt: '2026-03-01T09:00:00+09:00',
  },
  {
    id: 'profile-practice-note',
    nickname: '실습준비러',
    role: 'user',
    verificationStatus: 'verified',
    accountStatus: 'active',
    onboardingCompleted: true,
    onboardingCompletedAt: '2026-03-02T10:00:00+09:00',
    primaryUniversityId: 'yonsei',
    primaryMajorGroupId: 'physical-therapy',
    majorLabel: '물리치료학과',
    createdAt: '2026-03-02T09:00:00+09:00',
  },
  {
    id: 'profile-study-mode',
    nickname: '국시모드',
    role: 'user',
    verificationStatus: 'verified',
    accountStatus: 'active',
    onboardingCompleted: true,
    onboardingCompletedAt: '2026-03-03T11:00:00+09:00',
    primaryUniversityId: 'konyang',
    primaryMajorGroupId: 'occupational-therapy',
    majorLabel: '작업치료학과',
    createdAt: '2026-03-03T10:00:00+09:00',
  },
  {
    id: 'profile-radiology-lab',
    nickname: '촬영연습중',
    role: 'user',
    verificationStatus: 'verified',
    accountStatus: 'active',
    onboardingCompleted: true,
    onboardingCompletedAt: '2026-03-04T12:00:00+09:00',
    primaryUniversityId: 'daegu-health',
    primaryMajorGroupId: 'radiology',
    majorLabel: '방사선과',
    createdAt: '2026-03-04T08:30:00+09:00',
  },
  {
    id: 'profile-career-memo',
    nickname: '취업메모',
    role: 'user',
    verificationStatus: 'verified',
    accountStatus: 'active',
    onboardingCompleted: true,
    onboardingCompletedAt: '2026-03-05T15:00:00+09:00',
    primaryUniversityId: 'eulji',
    primaryMajorGroupId: 'clinical-pathology',
    majorLabel: '임상병리학과',
    createdAt: '2026-03-05T09:30:00+09:00',
  },
  {
    id: 'profile-team-lead',
    nickname: '발표팀장',
    role: 'user',
    verificationStatus: 'verified',
    accountStatus: 'active',
    onboardingCompleted: true,
    onboardingCompletedAt: '2026-03-06T13:00:00+09:00',
    primaryUniversityId: 'yonsei',
    primaryMajorGroupId: 'physical-therapy',
    majorLabel: '재활과학과',
    createdAt: '2026-03-06T09:00:00+09:00',
  },
  {
    id: 'profile-school-anon',
    nickname: '같은학교익명',
    role: 'user',
    verificationStatus: 'verified',
    accountStatus: 'active',
    onboardingCompleted: true,
    onboardingCompletedAt: '2026-03-07T11:30:00+09:00',
    primaryUniversityId: 'yonsei',
    primaryMajorGroupId: 'physical-therapy',
    majorLabel: '물리치료학과',
    createdAt: '2026-03-07T08:10:00+09:00',
  },
  {
    id: 'profile-class-picker',
    nickname: '수강신청고민',
    role: 'user',
    verificationStatus: 'verified',
    accountStatus: 'active',
    onboardingCompleted: true,
    onboardingCompletedAt: '2026-03-08T10:15:00+09:00',
    primaryUniversityId: 'konyang',
    primaryMajorGroupId: 'occupational-therapy',
    majorLabel: '작업치료학과',
    createdAt: '2026-03-08T08:45:00+09:00',
  },
  {
    id: 'profile-uniform-guide',
    nickname: '실습복찾기',
    role: 'user',
    verificationStatus: 'verified',
    accountStatus: 'active',
    onboardingCompleted: true,
    onboardingCompletedAt: '2026-03-09T10:30:00+09:00',
    primaryUniversityId: 'daegu-health',
    primaryMajorGroupId: 'radiology',
    majorLabel: '방사선과',
    createdAt: '2026-03-09T09:10:00+09:00',
  },
  {
    id: 'profile-school-project',
    nickname: '학교팀플',
    role: 'user',
    verificationStatus: 'verified',
    accountStatus: 'active',
    onboardingCompleted: true,
    onboardingCompletedAt: '2026-03-10T16:00:00+09:00',
    primaryUniversityId: 'eulji',
    primaryMajorGroupId: 'clinical-pathology',
    majorLabel: '임상병리학과',
    createdAt: '2026-03-10T09:20:00+09:00',
  },
  {
    id: 'profile-pending-review',
    nickname: '검토대기중',
    role: 'user',
    verificationStatus: 'pending',
    accountStatus: 'active',
    onboardingCompleted: false,
    primaryUniversityId: 'yonsei',
    primaryMajorGroupId: 'physical-therapy',
    majorLabel: '물리치료학과',
    createdAt: '2026-03-11T10:00:00+09:00',
  },
  {
    id: 'profile-retry-case',
    nickname: '재제출준비',
    role: 'user',
    verificationStatus: 'rejected',
    accountStatus: 'active',
    onboardingCompleted: false,
    primaryUniversityId: 'konyang',
    primaryMajorGroupId: 'occupational-therapy',
    majorLabel: '작업치료학과',
    createdAt: '2026-03-12T10:00:00+09:00',
  },
  {
    id: 'profile-readonly',
    nickname: '읽기전용사용자',
    role: 'user',
    verificationStatus: 'verified',
    accountStatus: 'restricted',
    onboardingCompleted: true,
    onboardingCompletedAt: '2026-03-13T10:00:00+09:00',
    primaryUniversityId: 'yonsei',
    primaryMajorGroupId: 'physical-therapy',
    majorLabel: '물리치료학과',
    createdAt: '2026-03-13T08:00:00+09:00',
  },
];

function requireProfile(profileId: string): Profile {
  const profile = MOCK_PROFILES.find((item) => item.id === profileId);

  if (!profile) {
    throw new Error(`Missing mock profile: ${profileId}`);
  }

  return profile;
}

function buildPost(
  input: Omit<
    CommunityPost,
    'authorNickname' | 'authorMajorGroupId' | 'authorUniversityId' | 'status' | 'isAnonymous'
  > &
    Partial<Pick<CommunityPost, 'status' | 'isAnonymous'>>
): CommunityPost {
  const author = requireProfile(input.authorProfileId);

  return {
    status: 'published',
    isAnonymous: true,
    ...input,
    authorNickname: author.nickname,
    authorMajorGroupId: author.primaryMajorGroupId,
    authorUniversityId: author.primaryUniversityId,
  };
}

function buildComment(
  input: Omit<Comment, 'authorNickname' | 'status' | 'isAnonymous'> &
    Partial<Pick<Comment, 'status' | 'isAnonymous'>>
): Comment {
  const author = requireProfile(input.authorProfileId);

  return {
    status: 'published',
    isAnonymous: true,
    ...input,
    authorNickname: author.nickname,
  };
}

export const MOCK_VERIFICATIONS: VerificationRecord[] = [
  {
    id: 'verification-email-practice-note',
    profileId: 'profile-practice-note',
    method: 'email',
    universityId: 'yonsei',
    status: 'approved',
    submittedAt: '2026-03-02T09:30:00+09:00',
    reviewedAt: '2026-03-02T09:31:00+09:00',
    submittedLabel: '학교 이메일 자동 인증',
  },
  {
    id: 'verification-manual-pending',
    profileId: 'profile-pending-review',
    method: 'student_id_manual',
    universityId: 'yonsei',
    status: 'pending',
    submittedAt: '2026-03-11T10:20:00+09:00',
    evidenceUrl: 'storage/mock/manual/pending-review.jpg',
    submittedLabel: '학생증 수동 인증 제출',
  },
  {
    id: 'verification-manual-rejected',
    profileId: 'profile-retry-case',
    method: 'student_id_manual',
    universityId: 'konyang',
    status: 'rejected',
    submittedAt: '2026-03-12T10:20:00+09:00',
    reviewedAt: '2026-03-12T17:10:00+09:00',
    rejectionReason: '학생증 사진에서 학교명과 재학 정보 확인이 어렵습니다.',
    evidenceUrl: 'storage/mock/manual/retry-case.jpg',
    submittedLabel: '학생증 수동 인증 제출',
  },
];

export const MOCK_POSTS: CommunityPost[] = [
  buildPost({
    id: 'post-1',
    title: '실습 첫 주 체크리스트 정리',
    body: '실습 첫 주에 꼭 챙겨야 할 준비물과 병동 메모 방식을 정리했습니다.',
    summary: '실습복, 병동 메모 방식, 사전 질문거리까지 한 번에 정리한 글입니다.',
    boardId: 'network-home',
    authorProfileId: 'profile-practice-note',
    category: 'practice',
    postType: 'general',
    majorGroupId: 'physical-therapy',
    commentCount: 3,
    createdAt: '2026-03-14T10:00:00+09:00',
    createdLabel: '2시간 전',
  }),
  buildPost({
    id: 'post-2',
    title: '작업치료 국시 공부 루틴 공유',
    body: '과목별 회독 순서와 실기 대비 루틴을 정리해 두었습니다.',
    summary: '과목별 회독 순서와 시험 직전 2주 루틴을 공유합니다.',
    boardId: 'network-home',
    authorProfileId: 'profile-study-mode',
    category: 'exam',
    postType: 'question',
    majorGroupId: 'occupational-therapy',
    commentCount: 2,
    createdAt: '2026-03-14T08:30:00+09:00',
    createdLabel: '오늘',
  }),
  buildPost({
    id: 'post-3',
    title: '방사선과 실습 병원 분위기 질문',
    body: '수도권과 지방 실습 병원의 분위기 차이가 어느 정도인지 질문하는 글입니다.',
    summary: '수도권 병원 실습 분위기가 학교마다 많이 다른지 궁금합니다.',
    boardId: 'network-home',
    authorProfileId: 'profile-radiology-lab',
    category: 'qna',
    postType: 'question',
    majorGroupId: 'radiology',
    commentCount: 1,
    createdAt: '2026-03-13T18:00:00+09:00',
    createdLabel: '1일 전',
  }),
  buildPost({
    id: 'post-4',
    title: '임상병리 취업 준비할 때 본 포인트',
    body: '상급종합병원과 중소병원 지원서에서 봐야 할 포인트를 구분해 적었습니다.',
    summary: '상급종합병원과 중소병원 준비 포인트 차이를 간단히 정리했습니다.',
    boardId: 'network-home',
    authorProfileId: 'profile-career-memo',
    category: 'career',
    postType: 'general',
    majorGroupId: 'clinical-pathology',
    commentCount: 1,
    createdAt: '2026-03-13T13:00:00+09:00',
    createdLabel: '1일 전',
  }),
  buildPost({
    id: 'post-5',
    title: '보건의료기사 계열 팀프로젝트 아이디어 모음',
    body: '실습 기록, 케이스 스터디, 발표 자료 제작에 쓸 수 있는 아이디어를 정리했습니다.',
    summary: '실습 기록, 케이스 스터디, 발표 자료를 준비할 때 쓸 수 있는 아이디어입니다.',
    boardId: 'network-home',
    authorProfileId: 'profile-team-lead',
    category: 'free',
    postType: 'general',
    commentCount: 0,
    createdAt: '2026-03-12T10:30:00+09:00',
    createdLabel: '3일 전',
  }),
  buildPost({
    id: 'school-1',
    title: '이번 주 실습 OT 장소 질문',
    body: 'OT 강의실 위치와 집합 시간을 헷갈려서 묻는 글입니다.',
    summary: 'OT 강의실이 본관인지 의료관인지 헷갈리는 사람 있나요?',
    boardId: 'school-yonsei',
    authorProfileId: 'profile-school-anon',
    category: 'qna',
    postType: 'question',
    majorGroupId: 'physical-therapy',
    universityId: 'yonsei',
    commentCount: 2,
    createdAt: '2026-03-15T08:55:00+09:00',
    createdLabel: '방금',
  }),
  buildPost({
    id: 'school-2',
    title: '작치 전공 선택과목 후기',
    body: '이번 학기 수강신청 전에 참고할 만한 선택과목 난이도와 후기를 묻습니다.',
    summary: '이번 학기 선택과목 중 난이도 괜찮은 과목 공유 부탁드립니다.',
    boardId: 'school-konyang',
    authorProfileId: 'profile-class-picker',
    category: 'free',
    postType: 'general',
    majorGroupId: 'occupational-therapy',
    universityId: 'konyang',
    commentCount: 0,
    createdAt: '2026-03-14T21:00:00+09:00',
    createdLabel: '어제',
  }),
  buildPost({
    id: 'school-3',
    title: '방사선 실습복 구매 팁',
    body: '학교 근처에서 실습복을 맞춘 경험과 가격대를 공유하는 글입니다.',
    summary: '학교 근처에서 맞춘 사람들 후기 모아봅시다.',
    boardId: 'school-daegu-health',
    authorProfileId: 'profile-uniform-guide',
    category: 'practice',
    postType: 'general',
    majorGroupId: 'radiology',
    universityId: 'daegu-health',
    commentCount: 0,
    createdAt: '2026-03-13T09:00:00+09:00',
    createdLabel: '2일 전',
  }),
  buildPost({
    id: 'school-4',
    title: '임상병리 팀플 인원 구해요',
    body: '이번 주 발표 자료 정리와 역할 분담을 함께할 팀원을 구하는 모집 글입니다.',
    summary: '이번 주 발표용 자료 정리 같이 할 사람 2명 구합니다.',
    boardId: 'school-eulji',
    authorProfileId: 'profile-school-project',
    category: 'recruitment',
    postType: 'recruitment',
    majorGroupId: 'clinical-pathology',
    universityId: 'eulji',
    recruitmentId: 'recruit-4',
    commentCount: 1,
    createdAt: '2026-03-12T14:30:00+09:00',
    createdLabel: '3일 전',
  }),
  buildPost({
    id: 'post-6',
    title: '물리치료 케이스 스터디 팀원 모집',
    body: '주 1회 온라인으로 케이스 발표를 하고 기록을 공유할 팀원을 찾습니다.',
    summary: '주 1회 온라인으로 케이스 발표할 팀원을 찾습니다.',
    boardId: 'network-home',
    authorProfileId: 'profile-practice-note',
    category: 'recruitment',
    postType: 'recruitment',
    majorGroupId: 'physical-therapy',
    recruitmentId: 'recruit-1',
    commentCount: 2,
    createdAt: '2026-03-15T07:30:00+09:00',
    createdLabel: '오늘',
  }),
  buildPost({
    id: 'post-7',
    title: '보건의료 계열 공모전 발표 자료 팀 빌딩',
    body: '전공 혼합 팀으로 역할을 나누고 발표 자료를 빠르게 만드는 공모전 준비 글입니다.',
    summary: '전공 혼합 팀으로 발표 자료와 역할 분담을 빠르게 맞출 예정입니다.',
    boardId: 'network-home',
    authorProfileId: 'profile-team-lead',
    category: 'recruitment',
    postType: 'recruitment',
    recruitmentId: 'recruit-2',
    commentCount: 1,
    createdAt: '2026-03-14T15:00:00+09:00',
    createdLabel: '어제',
  }),
  buildPost({
    id: 'post-8',
    title: '임상병리 국시 회독 스터디',
    body: '문제풀이 인증과 과목별 회독 체크를 중심으로 운영할 국시 스터디입니다.',
    summary: '국시 과목별 회독 체크와 문제풀이 인증 중심 스터디입니다.',
    boardId: 'network-home',
    authorProfileId: 'profile-career-memo',
    category: 'recruitment',
    postType: 'recruitment',
    majorGroupId: 'clinical-pathology',
    recruitmentId: 'recruit-3',
    commentCount: 0,
    createdAt: '2026-03-13T19:00:00+09:00',
    createdLabel: '2일 전',
  }),
];

export const MOCK_COMMENTS: Comment[] = [
  buildComment({
    id: 'comment-1',
    postId: 'post-1',
    authorProfileId: 'profile-study-mode',
    depth: 1,
    body: '체크리스트에 실습 병동별 금기사항도 같이 넣으면 더 좋을 것 같아요.',
    kind: 'general',
    createdAt: '2026-03-15T09:10:00+09:00',
    createdLabel: '1시간 전',
  }),
  buildComment({
    id: 'comment-2',
    postId: 'post-1',
    authorProfileId: 'profile-team-lead',
    depth: 1,
    body: '실습 첫 주엔 질문거리 메모칸이 진짜 도움이 되더라고요.',
    kind: 'general',
    createdAt: '2026-03-15T09:20:00+09:00',
    createdLabel: '58분 전',
  }),
  buildComment({
    id: 'comment-3',
    postId: 'post-1',
    authorProfileId: 'profile-practice-note',
    parentCommentId: 'comment-2',
    depth: 2,
    body: '맞아요. 다음 버전에 병동별 체크 포인트도 추가해볼게요.',
    kind: 'general',
    createdAt: '2026-03-15T09:32:00+09:00',
    createdLabel: '46분 전',
  }),
  buildComment({
    id: 'comment-4',
    postId: 'post-2',
    authorProfileId: 'profile-career-memo',
    depth: 1,
    body: '작치 국시는 암기보다 회독 주기가 중요한 것 같아요.',
    kind: 'general',
    createdAt: '2026-03-14T11:10:00+09:00',
    createdLabel: '오늘',
  }),
  buildComment({
    id: 'comment-5',
    postId: 'post-2',
    authorProfileId: 'profile-study-mode',
    parentCommentId: 'comment-4',
    depth: 2,
    body: '맞아요. 실기 직전엔 케이스형 문제만 따로 보는 루틴도 추천해요.',
    kind: 'general',
    createdAt: '2026-03-14T11:25:00+09:00',
    createdLabel: '오늘',
  }),
  buildComment({
    id: 'comment-6',
    postId: 'post-3',
    authorProfileId: 'profile-uniform-guide',
    depth: 1,
    body: '대구권은 실습 지도자 스타일 차이가 꽤 커서 미리 후기 찾는 게 좋아요.',
    kind: 'general',
    createdAt: '2026-03-13T18:40:00+09:00',
    createdLabel: '1일 전',
  }),
  buildComment({
    id: 'comment-7',
    postId: 'school-1',
    authorProfileId: 'profile-practice-note',
    depth: 1,
    body: '이번 주는 의료관 302호라고 공지 다시 올라왔어요.',
    kind: 'general',
    createdAt: '2026-03-15T09:02:00+09:00',
    createdLabel: '방금',
  }),
  buildComment({
    id: 'comment-8',
    postId: 'school-1',
    authorProfileId: 'profile-school-anon',
    parentCommentId: 'comment-7',
    depth: 2,
    body: '감사합니다. OT 시간도 같이 적어둘게요.',
    kind: 'general',
    createdAt: '2026-03-15T09:04:00+09:00',
    createdLabel: '방금',
  }),
  buildComment({
    id: 'comment-9',
    postId: 'post-6',
    authorProfileId: 'profile-team-lead',
    depth: 1,
    body: '참여 가능해요. 주중 저녁 8시 이후로는 꾸준히 들어갈 수 있습니다.',
    kind: 'recruitment_intent',
    createdAt: '2026-03-15T08:10:00+09:00',
    createdLabel: '1시간 전',
  }),
  buildComment({
    id: 'comment-10',
    postId: 'post-6',
    authorProfileId: 'profile-readonly',
    depth: 1,
    body: '읽기 전용 데모에서는 실제 작성이 잠기지만, 이런 형식의 참여 댓글을 가정합니다.',
    kind: 'recruitment_intent',
    createdAt: '2026-03-15T08:20:00+09:00',
    createdLabel: '1시간 전',
  }),
  buildComment({
    id: 'comment-11',
    postId: 'post-7',
    authorProfileId: 'profile-radiology-lab',
    depth: 1,
    body: '방사선 쪽 데이터 파트 맡을 수 있습니다. 참여 희망합니다.',
    kind: 'recruitment_intent',
    createdAt: '2026-03-14T15:40:00+09:00',
    createdLabel: '어제',
  }),
  buildComment({
    id: 'comment-12',
    postId: 'school-4',
    authorProfileId: 'profile-career-memo',
    depth: 1,
    body: '발표 자료 쪽 맡을 수 있어요. 학교 게시판 안에서 먼저 얘기해도 괜찮습니다.',
    kind: 'recruitment_intent',
    createdAt: '2026-03-12T15:10:00+09:00',
    createdLabel: '3일 전',
  }),
];

export const MOCK_RECRUITMENTS: RecruitmentCard[] = [
  {
    id: 'recruit-1',
    postId: 'post-6',
    title: '물리치료 케이스 스터디 팀원 모집',
    summary: '주 1회 온라인으로 케이스 발표할 팀원을 찾습니다.',
    recruitmentType: 'study',
    status: 'open',
    headcount: 3,
    headcountLabel: '3명 모집',
    mode: 'online',
    deadlineAt: '2026-03-18T23:59:00+09:00',
    deadlineLabel: '마감 3일 전',
    preferredMajorGroupId: 'physical-therapy',
    commentPrompt: '참여 가능 시간과 경험을 댓글로 남겨 주세요.',
    createdAt: '2026-03-15T07:30:00+09:00',
  },
  {
    id: 'recruit-2',
    postId: 'post-7',
    title: '보건의료 계열 공모전 발표 자료 팀 빌딩',
    summary: '전공 혼합 팀으로 발표 자료와 역할 분담을 빠르게 맞출 예정입니다.',
    recruitmentType: 'contest',
    status: 'open',
    headcount: 4,
    headcountLabel: '4명 모집',
    mode: 'hybrid',
    deadlineAt: '2026-03-16T23:59:00+09:00',
    deadlineLabel: '이번 주 마감',
    commentPrompt: '지원 대신 댓글로 맡고 싶은 역할을 먼저 남기는 흐름입니다.',
    createdAt: '2026-03-14T15:00:00+09:00',
  },
  {
    id: 'recruit-3',
    postId: 'post-8',
    title: '임상병리 국시 회독 스터디',
    summary: '국시 과목별 회독 체크와 문제풀이 인증 중심 스터디입니다.',
    recruitmentType: 'study',
    status: 'open',
    headcount: 5,
    headcountLabel: '5명 모집',
    mode: 'online',
    deadlineAt: '2026-03-20T23:59:00+09:00',
    deadlineLabel: '마감 5일 전',
    preferredMajorGroupId: 'clinical-pathology',
    commentPrompt: '참여 의사 댓글과 가능한 회독 루틴을 함께 남겨 주세요.',
    createdAt: '2026-03-13T19:00:00+09:00',
  },
  {
    id: 'recruit-4',
    postId: 'school-4',
    title: '임상병리 팀플 인원 구해요',
    summary: '이번 주 발표용 자료 정리 같이 할 사람 2명 구합니다.',
    recruitmentType: 'project',
    status: 'open',
    headcount: 2,
    headcountLabel: '2명 모집',
    mode: 'offline',
    deadlineAt: '2026-03-17T18:00:00+09:00',
    deadlineLabel: '내일 오후 마감',
    preferredMajorGroupId: 'clinical-pathology',
    commentPrompt: '같은 학교 보드 안에서 시간표와 맡을 파트를 댓글로 맞춥니다.',
    createdAt: '2026-03-12T14:30:00+09:00',
  },
];

export const MOCK_HOME_POSTS: CommunityPost[] = MOCK_POSTS.filter(
  (post) => post.boardId === 'network-home' && post.postType !== 'recruitment'
);

export const MOCK_SCHOOL_POSTS: CommunityPost[] = MOCK_POSTS.filter(
  (post) => post.universityId && post.boardId.startsWith('school-')
);

export const MOCK_SESSION_SCENARIOS: AppSessionScenario[] = [
  {
    id: 'unverified-start',
    label: '기본 시작 상태',
    description: '아직 인증을 시작하지 않은 사용자의 진입 상태',
    profile: requireProfile('demo-user'),
  },
  {
    id: 'email-verified-ready',
    label: '이메일 인증 후 온보딩 대기',
    description: '학교 이메일 인증은 끝났지만 온보딩은 아직 완료하지 않은 상태',
    profile: {
      ...requireProfile('profile-practice-note'),
      onboardingCompleted: false,
      onboardingCompletedAt: undefined,
    },
    verificationMethod: 'email',
    lastSubmittedEmail: 'demo@yonsei.ac.kr',
  },
  {
    id: 'manual-pending',
    label: '수동 인증 검토 대기',
    description: '학생증 수동 인증을 제출하고 검토 결과를 기다리는 상태',
    profile: requireProfile('profile-pending-review'),
    verificationMethod: 'student_id_manual',
  },
  {
    id: 'manual-rejected',
    label: '수동 인증 반려',
    description: '수동 인증이 반려되어 재제출 안내가 필요한 상태',
    profile: requireProfile('profile-retry-case'),
    verificationMethod: 'student_id_manual',
    rejectionReason: '학생증 사진에서 학교명과 재학 정보 확인이 어렵습니다.',
  },
  {
    id: 'restricted-reader',
    label: '읽기 전용 사용자',
    description: '커뮤니티 읽기는 가능하지만 작성은 막힌 제재 상태',
    profile: requireProfile('profile-readonly'),
    verificationMethod: 'email',
    lastSubmittedEmail: 'readonly@yonsei.ac.kr',
  },
];

export const DEFAULT_SESSION_SCENARIO = MOCK_SESSION_SCENARIOS[0];

export function getSessionScenarioById(scenarioId?: string) {
  return MOCK_SESSION_SCENARIOS.find((scenario) => scenario.id === scenarioId);
}

export function getMajorById(majorId?: string) {
  return MOCK_MAJORS.find((major) => major.id === majorId);
}

export function getBoardById(boardId?: string) {
  return MOCK_BOARDS.find((board) => board.id === boardId);
}

export function getSchoolBoardByUniversityId(universityId?: string) {
  return MOCK_UNIVERSITY_BOARDS.find((board) => board.universityId === universityId);
}

export function getProfileById(profileId?: string) {
  return MOCK_PROFILES.find((profile) => profile.id === profileId);
}

export function getVerificationByProfileId(profileId?: string) {
  return MOCK_VERIFICATIONS.find((record) => record.profileId === profileId);
}

export function getPostById(postId?: string) {
  return MOCK_POSTS.find((post) => post.id === postId);
}

export function getPostsByBoardId(boardId?: string) {
  return MOCK_POSTS.filter((post) => post.boardId === boardId);
}

export function getCommentsByPostId(postId?: string) {
  return MOCK_COMMENTS.filter((comment) => comment.postId === postId);
}

export function getRecruitmentById(recruitmentId?: string) {
  return MOCK_RECRUITMENTS.find((recruitment) => recruitment.id === recruitmentId);
}

export function getRecruitmentByPostId(postId?: string) {
  return MOCK_RECRUITMENTS.find((recruitment) => recruitment.postId === postId);
}
