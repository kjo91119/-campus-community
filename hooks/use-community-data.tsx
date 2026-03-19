import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  COMMUNITY_VALIDATION,
  REPORT_REASON_OPTIONS,
  RECRUITMENT_COMMENT_PROMPTS,
} from '@/constants/community';
import {
  buildAuthorProfilesAfterRemoteHydrate,
  buildPersistedAuthorProfiles,
  collectAuthorProfileIdsFromRows,
  filterUuidProfileIds,
} from '@/lib/community/author-profile-cache';
import { buildCommunityStateAfterRemoteHydrate, cloneCommunityState } from '@/lib/community/community-state-cache';
import {
  buildBlockedProfileEntries,
  buildBlockedProfileIds,
  prependBlockRecord,
  prependReportRecord,
} from '@/lib/community/report-block-state';
import {
  MOCK_BOARDS,
  MOCK_COMMENTS,
  MOCK_PROFILES,
  MOCK_POSTS,
  MOCK_RECRUITMENTS,
} from '@/data/mock-community';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAppSession } from '@/hooks/use-app-session';
import { listActiveBoards } from '@/lib/supabase/boards';
import { fetchCommunitySnapshot } from '@/lib/supabase/community';
import { getSupabaseBootstrap } from '@/lib/supabase/client';
import { insertComment } from '@/lib/supabase/comments';
import {
  blockProfileRemote,
  listMyBlocks,
  listMyReports,
  submitReport,
  unblockProfileRemote,
} from '@/lib/supabase/moderation';
import { insertPost } from '@/lib/supabase/posts';
import {
  listProfileSummariesByIds,
  toProfileSummary,
} from '@/lib/supabase/profiles';
import { createRecruitmentWithPost } from '@/lib/supabase/recruitments';
import type {
  Board,
  BlockRecord,
  BlockedProfileEntry,
  Comment,
  CommentRow,
  CommunityPost,
  PostCategory,
  PostRow,
  PostType,
  ProfileSummary,
  ReportReason,
  ReportRecord,
  ReportTargetType,
  RecruitmentCard,
  RecruitmentMode,
  RecruitmentRow,
  RecruitmentType,
} from '@/types/domain';

type CreatePostInput = {
  boardId: string;
  title: string;
  body: string;
  category: Exclude<PostCategory, 'recruitment'>;
  postType: Exclude<PostType, 'recruitment'>;
};

type CreateRecruitmentInput = {
  boardId: string;
  title: string;
  body: string;
  recruitmentType: RecruitmentType;
  mode: RecruitmentMode;
  headcount: string;
  deadlineDays?: number;
  preferredMajorGroupId?: string;
};

type CreateCommentInput = {
  postId: string;
  body: string;
};

type ReportTargetInput = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  targetProfileId?: string;
};

type CommunityActionResult = {
  ok: boolean;
  message?: string;
  postId?: string;
  commentId?: string;
  recruitmentId?: string;
  reportId?: string;
  blockId?: string;
};

type AccessResult = {
  ok: boolean;
  message?: string;
};

type CommunityContextValue = {
  isHydrating: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  getBoardById: (boardId?: string) => Board | undefined;
  getNetworkBoard: () => Board | undefined;
  getMajorBoards: () => Board[];
  getMajorBoardByMajorGroupId: (majorGroupId?: string) => Board | undefined;
  getSchoolBoardByUniversityId: (universityId?: string) => Board | undefined;
  getPostById: (postId?: string) => CommunityPost | undefined;
  getPostsByBoardId: (boardId?: string) => CommunityPost[];
  getCommentsByPostId: (postId?: string) => Comment[];
  getRecruitments: (majorGroupId?: string) => RecruitmentCard[];
  getRecruitmentById: (recruitmentId?: string) => RecruitmentCard | undefined;
  getReadAccessForBoard: (boardId?: string) => AccessResult;
  getReadAccessForPost: (postId?: string) => AccessResult;
  getReadAccessForRecruitment: (recruitmentId?: string) => AccessResult;
  getWriteAccessForBoard: (boardId?: string) => AccessResult;
  getCommentAccessForPost: (postId?: string) => AccessResult;
  getBlockedProfiles: () => BlockedProfileEntry[];
  isBlockedProfile: (profileId?: string) => boolean;
  createPost: (input: CreatePostInput) => Promise<CommunityActionResult>;
  createRecruitment: (input: CreateRecruitmentInput) => Promise<CommunityActionResult>;
  createComment: (input: CreateCommentInput) => Promise<CommunityActionResult>;
  reportTarget: (input: ReportTargetInput) => Promise<CommunityActionResult>;
  blockProfile: (profileId?: string) => Promise<CommunityActionResult>;
  unblockProfile: (profileId?: string) => Promise<CommunityActionResult>;
};

type CommunityState = {
  posts: PostRow[];
  comments: CommentRow[];
  recruitments: RecruitmentRow[];
};

type PersistedCommunityState = {
  version: number;
  state: CommunityState;
  boards?: Board[];
  authorProfiles?: ProfileSummary[];
  reports?: ReportRecord[];
  blocks?: BlockRecord[];
};

const COMMUNITY_STORAGE_KEY = 'campus-community:community-store';
const COMMUNITY_STORAGE_VERSION = 7;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const INITIAL_COMMUNITY_STATE: CommunityState = {
  posts: MOCK_POSTS.map((post) => ({
    id: post.id,
    boardId: post.boardId,
    authorProfileId: post.authorProfileId,
    title: post.title,
    body: post.body,
    category: post.category,
    postType: post.postType,
    status: post.status,
    majorGroupId: post.majorGroupId,
    universityId: post.universityId,
    recruitmentId: post.recruitmentId,
    isAnonymous: post.isAnonymous,
    commentCount: post.commentCount,
    createdAt: post.createdAt,
  })),
  comments: MOCK_COMMENTS.map((comment) => ({
    id: comment.id,
    postId: comment.postId,
    authorProfileId: comment.authorProfileId,
    parentCommentId: comment.parentCommentId,
    depth: comment.depth,
    body: comment.body,
    status: comment.status,
    kind: comment.kind,
    isAnonymous: comment.isAnonymous,
    createdAt: comment.createdAt,
  })),
  recruitments: MOCK_RECRUITMENTS.map((recruitment) => ({
    id: recruitment.id,
    postId: recruitment.postId,
    recruitmentType: recruitment.recruitmentType,
    status: recruitment.status,
    headcount: recruitment.headcount,
    mode: recruitment.mode,
    deadlineAt: recruitment.deadlineAt,
    preferredMajorGroupId: recruitment.preferredMajorGroupId,
    createdAt: recruitment.createdAt,
  })),
};

const INITIAL_BOARDS = MOCK_BOARDS.filter((board) => board.isActive);
const FALLBACK_AUTHOR_PROFILES = MOCK_PROFILES.map((profile) => toProfileSummary(profile));
const FALLBACK_AUTHOR_PROFILE_MAP = new Map(
  FALLBACK_AUTHOR_PROFILES.map((profile) => [profile.id, profile])
);

const CommunityContext = createContext<CommunityContextValue | null>(null);

function sortPostsDescending(posts: PostRow[]) {
  return [...posts].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

function sortCommentsAscending(comments: CommentRow[]) {
  return [...comments].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));
}

function sortRecruitmentsDescending(recruitments: RecruitmentRow[]) {
  return [...recruitments].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)
  );
}

function sortBoardsForDisplay(boards: Board[]) {
  const scopeOrder: Record<Board['scopeType'], number> = {
    network: 0,
    major_group: 1,
    university: 2,
  };

  return [...boards].sort((left, right) => {
    const scopeDiff = scopeOrder[left.scopeType] - scopeOrder[right.scopeType];

    if (scopeDiff !== 0) {
      return scopeDiff;
    }

    return left.title.localeCompare(right.title, 'ko');
  });
}

function createPostId() {
  return `local-post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createCommentId() {
  return `local-comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createRecruitmentId() {
  return `local-recruit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createReportId() {
  return `local-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createBlockId() {
  return `local-block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isUuidLike(value?: string) {
  return Boolean(value && UUID_PATTERN.test(value));
}

function buildRelativeLabel(createdAt: string) {
  const diffMs = Date.now() - Date.parse(createdAt);
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return '방금';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  const diffDays = Math.floor(diffHours / 24);

  return `${diffDays}일 전`;
}

function buildSummary(body: string) {
  const normalized = body.trim().replace(/\s+/g, ' ');

  if (normalized.length <= COMMUNITY_VALIDATION.summaryMaxLength) {
    return normalized;
  }

  return `${normalized.slice(0, COMMUNITY_VALIDATION.summaryMaxLength - 1)}...`;
}

function buildHeadcountLabel(headcount?: number) {
  if (!headcount) {
    return '인원 미정';
  }

  return `${headcount}명 모집`;
}

function buildDeadlineLabel(deadlineAt?: string) {
  if (!deadlineAt) {
    return '상시 모집';
  }

  const diffMs = Date.parse(deadlineAt) - Date.now();

  if (diffMs <= 0) {
    return '마감됨';
  }

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) {
    return '하루 이내 마감';
  }

  return `마감 ${diffDays}일 전`;
}

function buildDeadlineAt(days?: number) {
  if (!days) {
    return undefined;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + days);
  nextDate.setHours(23, 59, 0, 0);

  return nextDate.toISOString();
}

function getRecruitmentClosedMessage(status: RecruitmentRow['status']) {
  if (status === 'completed') {
    return '완료된 모집이라 참여 의사 댓글을 남길 수 없습니다.';
  }

  return '이미 마감된 모집이라 참여 의사 댓글을 남길 수 없습니다.';
}

function getLocalFallbackWriteMessage(contentLabel: '게시글' | '모집글' | '댓글') {
  return `${contentLabel}이 로컬 임시 상태에만 반영되었습니다. 이후 서버 snapshot 동기화가 성공하면 이 임시 데이터는 사라질 수 있습니다.`;
}

function getLocalModerationMessage(actionLabel: '신고' | '차단' | '차단 해제') {
  return `${actionLabel}가 로컬 데모 상태에만 반영되었습니다. 운영 검토 큐와 서버 동기화는 다음 단계에서 연결됩니다.`;
}

function normalizePostRow(value: unknown): PostRow | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const candidate = value as Partial<CommunityPost> & Partial<PostRow>;

  if (
    !candidate.id ||
    !candidate.boardId ||
    !candidate.authorProfileId ||
    !candidate.title ||
    !candidate.body ||
    !candidate.category ||
    !candidate.postType ||
    !candidate.status ||
    typeof candidate.isAnonymous !== 'boolean' ||
    typeof candidate.commentCount !== 'number' ||
    !candidate.createdAt
  ) {
    return undefined;
  }

  return {
    id: candidate.id,
    boardId: candidate.boardId,
    authorProfileId: candidate.authorProfileId,
    title: candidate.title,
    body: candidate.body,
    category: candidate.category,
    postType: candidate.postType,
    status: candidate.status,
    majorGroupId: candidate.majorGroupId,
    universityId: candidate.universityId,
    recruitmentId: candidate.recruitmentId,
    isAnonymous: candidate.isAnonymous,
    commentCount: candidate.commentCount,
    createdAt: candidate.createdAt,
  };
}

function normalizeCommentRow(value: unknown): CommentRow | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const candidate = value as Partial<Comment> & Partial<CommentRow>;

  if (
    !candidate.id ||
    !candidate.postId ||
    !candidate.authorProfileId ||
    !candidate.body ||
    !candidate.status ||
    !candidate.kind ||
    typeof candidate.isAnonymous !== 'boolean' ||
    !candidate.createdAt ||
    (candidate.depth !== 1 && candidate.depth !== 2)
  ) {
    return undefined;
  }

  return {
    id: candidate.id,
    postId: candidate.postId,
    authorProfileId: candidate.authorProfileId,
    parentCommentId: candidate.parentCommentId,
    depth: candidate.depth,
    body: candidate.body,
    status: candidate.status,
    kind: candidate.kind,
    isAnonymous: candidate.isAnonymous,
    createdAt: candidate.createdAt,
  };
}

function normalizeRecruitmentRow(value: unknown): RecruitmentRow | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const candidate = value as Partial<RecruitmentCard> & Partial<RecruitmentRow>;

  if (
    !candidate.id ||
    !candidate.postId ||
    !candidate.recruitmentType ||
    !candidate.status ||
    !candidate.createdAt
  ) {
    return undefined;
  }

  return {
    id: candidate.id,
    postId: candidate.postId,
    recruitmentType: candidate.recruitmentType,
    status: candidate.status,
    headcount: candidate.headcount,
    mode: candidate.mode,
    deadlineAt: candidate.deadlineAt,
    preferredMajorGroupId: candidate.preferredMajorGroupId,
    createdAt: candidate.createdAt,
  };
}

function normalizeBoard(value: unknown): Board | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const candidate = value as Partial<Board>;

  if (
    !candidate.id ||
    !candidate.slug ||
    !candidate.title ||
    !candidate.description ||
    !candidate.scopeType ||
    !candidate.visibility ||
    typeof candidate.isActive !== 'boolean'
  ) {
    return undefined;
  }

  return {
    id: candidate.id,
    slug: candidate.slug,
    title: candidate.title,
    description: candidate.description,
    scopeType: candidate.scopeType,
    visibility: candidate.visibility,
    majorGroupId: candidate.majorGroupId,
    universityId: candidate.universityId,
    postTypeDefault: candidate.postTypeDefault,
    isActive: candidate.isActive,
  };
}

function normalizeProfileSummary(value: unknown): ProfileSummary | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const candidate = value as Partial<ProfileSummary>;

  if (!candidate.id || !candidate.nickname || !candidate.verificationStatus) {
    return undefined;
  }

  return {
    id: candidate.id,
    nickname: candidate.nickname,
    primaryUniversityId: candidate.primaryUniversityId,
    primaryMajorGroupId: candidate.primaryMajorGroupId,
    verificationStatus: candidate.verificationStatus,
  };
}

function normalizeReportRecord(value: unknown): ReportRecord | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const candidate = value as Partial<ReportRecord>;

  if (
    !candidate.id ||
    !candidate.reporterProfileId ||
    !candidate.targetType ||
    !candidate.targetId ||
    !candidate.reason ||
    !candidate.createdAt
  ) {
    return undefined;
  }

  return {
    id: candidate.id,
    reporterProfileId: candidate.reporterProfileId,
    targetType: candidate.targetType,
    targetId: candidate.targetId,
    targetProfileId: candidate.targetProfileId,
    reason: candidate.reason,
    detail: candidate.detail,
    status: candidate.status,
    reviewerProfileId: candidate.reviewerProfileId,
    reviewedAt: candidate.reviewedAt,
    createdAt: candidate.createdAt,
  };
}

function normalizeBlockRecord(value: unknown): BlockRecord | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const candidate = value as Partial<BlockRecord>;

  if (
    !candidate.id ||
    !candidate.blockerProfileId ||
    !candidate.blockedProfileId ||
    !candidate.createdAt
  ) {
    return undefined;
  }

  return {
    id: candidate.id,
    blockerProfileId: candidate.blockerProfileId,
    blockedProfileId: candidate.blockedProfileId,
    createdAt: candidate.createdAt,
  };
}

function prependOrReplaceRow<Row extends { id: string }>(rows: Row[], nextRow: Row) {
  return [nextRow, ...rows.filter((row) => row.id !== nextRow.id)];
}

function parseCommunityState(rawValue: string | null) {
  if (!rawValue) {
    return {
      state: cloneCommunityState(INITIAL_COMMUNITY_STATE),
      boards: INITIAL_BOARDS,
      authorProfiles: [],
      reports: [],
      blocks: [],
    };
  }

  try {
    const parsed = JSON.parse(rawValue) as
      | PersistedCommunityState
      | {
          posts?: unknown[];
          comments?: unknown[];
          recruitments?: unknown[];
          boards?: unknown[];
          authorProfiles?: unknown[];
        };
    const legacyParsed = parsed as {
      posts?: unknown[];
      comments?: unknown[];
      recruitments?: unknown[];
      boards?: unknown[];
      authorProfiles?: unknown[];
    };
    const storedVersion =
      'version' in parsed && typeof parsed.version === 'number' ? parsed.version : 0;

    const rawState: {
      posts?: unknown[];
      comments?: unknown[];
      recruitments?: unknown[];
    } =
      'state' in parsed && parsed.state
        ? parsed.state
        : {
            posts: legacyParsed.posts,
            comments: legacyParsed.comments,
            recruitments: legacyParsed.recruitments,
          };

    const nextState: CommunityState = {
      posts: Array.isArray(rawState.posts)
        ? rawState.posts.map(normalizePostRow).filter((item): item is PostRow => Boolean(item))
        : [],
      comments: Array.isArray(rawState.comments)
        ? rawState.comments
            .map(normalizeCommentRow)
            .filter((item): item is CommentRow => Boolean(item))
        : [],
      recruitments: Array.isArray(rawState.recruitments)
        ? rawState.recruitments
            .map(normalizeRecruitmentRow)
            .filter((item): item is RecruitmentRow => Boolean(item))
        : [],
    };

    const rawBoards =
      'boards' in parsed && Array.isArray(parsed.boards) ? parsed.boards : legacyParsed.boards;
    const hasStoredBoards = Array.isArray(rawBoards);
    const nextBoards = hasStoredBoards
      ? rawBoards.map(normalizeBoard).filter((item): item is Board => Boolean(item))
      : INITIAL_BOARDS;
    const rawAuthorProfiles =
      storedVersion >= COMMUNITY_STORAGE_VERSION &&
      'authorProfiles' in parsed &&
      Array.isArray(parsed.authorProfiles)
        ? parsed.authorProfiles
        : [];
    const nextAuthorProfiles = Array.isArray(rawAuthorProfiles)
      ? rawAuthorProfiles
          .map(normalizeProfileSummary)
          .filter((item): item is ProfileSummary => Boolean(item))
      : [];
    const nextReports =
      'reports' in parsed && Array.isArray(parsed.reports)
        ? parsed.reports
            .map(normalizeReportRecord)
            .filter((item): item is ReportRecord => Boolean(item))
        : [];
    const nextBlocks =
      'blocks' in parsed && Array.isArray(parsed.blocks)
        ? parsed.blocks
            .map(normalizeBlockRecord)
            .filter((item): item is BlockRecord => Boolean(item))
        : [];

    return {
      state: cloneCommunityState(nextState),
      boards: sortBoardsForDisplay(nextBoards.filter((board) => board.isActive)),
      authorProfiles: nextAuthorProfiles,
      reports: nextReports,
      blocks: nextBlocks,
    };
  } catch {
    return {
      state: cloneCommunityState(INITIAL_COMMUNITY_STATE),
      boards: INITIAL_BOARDS,
      authorProfiles: [],
      reports: [],
      blocks: [],
    };
  }
}

function getBoardReadAccess({
  board,
  canAccessCommunity,
  isAuthenticated,
  primaryUniversityId,
}: {
  board?: Board;
  canAccessCommunity: boolean;
  isAuthenticated: boolean;
  primaryUniversityId?: string;
}): AccessResult {
  if (!board) {
    return { ok: false, message: '게시판 정보를 찾을 수 없습니다.' };
  }

  if (!isAuthenticated || !canAccessCommunity) {
    return { ok: false, message: '로그인과 온보딩 완료 후 게시판을 볼 수 있습니다.' };
  }

  if (board.scopeType === 'university' && board.universityId !== primaryUniversityId) {
    return { ok: false, message: '같은 학교 인증 사용자만 이 학교 게시판을 볼 수 있습니다.' };
  }

  return { ok: true };
}

function getBoardWriteAccess({
  board,
  canAccessCommunity,
  isAuthenticated,
  isReadOnly,
  primaryUniversityId,
}: {
  board?: Board;
  canAccessCommunity: boolean;
  isAuthenticated: boolean;
  isReadOnly: boolean;
  primaryUniversityId?: string;
}): AccessResult {
  const readAccess = getBoardReadAccess({
    board,
    canAccessCommunity,
    isAuthenticated,
    primaryUniversityId,
  });

  if (!readAccess.ok) {
    return readAccess;
  }

  if (isReadOnly) {
    return { ok: false, message: '읽기 전용 상태에서는 글쓰기와 댓글 작성이 잠겨 있습니다.' };
  }

  return { ok: true };
}

export function CommunityProvider({ children }: PropsWithChildren) {
  const { track } = useAnalytics();
  const { canAccessCommunity, isAuthenticated, isReadOnly, profile } = useAppSession();
  const [boards, setBoards] = useState<Board[]>(INITIAL_BOARDS);
  const [authorProfiles, setAuthorProfiles] = useState<ProfileSummary[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [blocks, setBlocks] = useState<BlockRecord[]>([]);
  const [state, setState] = useState<CommunityState>(INITIAL_COMMUNITY_STATE);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const isSupabaseReady = getSupabaseBootstrap().status === 'ready_for_client_wiring';
  const currentProfileSummary = toProfileSummary(profile);

  const activeRef = useRef(true);

  const performHydrate = useCallback(async () => {
    const storedValue = await AsyncStorage.getItem(COMMUNITY_STORAGE_KEY);
    const parsed = parseCommunityState(storedValue);
    let nextState = parsed.state;
    let nextBoards = parsed.boards;
    let nextAuthorProfiles = buildPersistedAuthorProfiles({
      currentProfileSummary,
      existingProfiles: parsed.authorProfiles,
    });
    let nextReports = parsed.reports;
    let nextBlocks = parsed.blocks;

    if (isSupabaseReady && canAccessCommunity && isAuthenticated) {
      const [
        remoteSnapshot,
        remoteBoardsResult,
        remoteReportsResult,
        remoteBlocksResult,
      ] = await Promise.all([
        fetchCommunitySnapshot(),
        listActiveBoards(),
        listMyReports(),
        listMyBlocks(),
      ]);

      if (remoteSnapshot.ok && remoteSnapshot.state) {
        nextState = buildCommunityStateAfterRemoteHydrate({
          remoteState: remoteSnapshot.state,
        });
      }

      if (remoteBoardsResult.ok && remoteBoardsResult.boards) {
        nextBoards = sortBoardsForDisplay(
          remoteBoardsResult.boards.filter((board) => board.isActive)
        );
      }

      if (remoteReportsResult.ok && remoteReportsResult.reports) {
        nextReports = remoteReportsResult.reports;
      }

      if (remoteBlocksResult.ok && remoteBlocksResult.blocks) {
        nextBlocks = remoteBlocksResult.blocks;
      }

      const nextAuthorProfileIds = [
        ...new Set([
          ...collectAuthorProfileIdsFromRows(nextState.posts, nextState.comments),
          ...nextBlocks.map((block) => block.blockedProfileId),
        ]),
      ];

      const remoteAuthorProfilesResult = await listProfileSummariesByIds(
        filterUuidProfileIds(nextAuthorProfileIds)
      );

      if (remoteAuthorProfilesResult.ok && remoteAuthorProfilesResult.profiles) {
        nextAuthorProfiles = buildAuthorProfilesAfterRemoteHydrate({
          currentProfileSummary,
          remoteProfiles: remoteAuthorProfilesResult.profiles,
        });
      } else {
        nextAuthorProfiles = buildPersistedAuthorProfiles({
          currentProfileSummary,
          existingProfiles: nextAuthorProfiles,
        });
      }
    } else {
      nextAuthorProfiles = buildPersistedAuthorProfiles({
        currentProfileSummary,
        existingProfiles: nextAuthorProfiles,
      });
    }

    if (!activeRef.current) {
      return;
    }

    setBoards(nextBoards);
    setAuthorProfiles(nextAuthorProfiles);
    setReports(nextReports);
    setBlocks(nextBlocks);
    setState(nextState);
    setIsHydrating(false);
    setHasLoaded(true);
  }, [canAccessCommunity, currentProfileSummary, isAuthenticated, isSupabaseReady]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await performHydrate();
    setIsRefreshing(false);
  }, [performHydrate]);

  useEffect(() => {
    activeRef.current = true;
    void performHydrate();

    return () => {
      activeRef.current = false;
    };
  }, [
    performHydrate,
    profile.id,
    profile.primaryUniversityId,
  ]);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    const payload: PersistedCommunityState = {
      version: COMMUNITY_STORAGE_VERSION,
      state,
      boards,
      authorProfiles,
      reports,
      blocks,
    };

    void AsyncStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(payload));
  }, [authorProfiles, blocks, boards, hasLoaded, reports, state]);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    setAuthorProfiles((current) =>
      buildPersistedAuthorProfiles({
        currentProfileSummary,
        existingProfiles: current,
      })
    );
  }, [currentProfileSummary, hasLoaded]);

  const findBoardById = (boardId?: string) => boards.find((board) => board.id === boardId);
  const getNetworkBoard = () => boards.find((board) => board.scopeType === 'network');
  const getMajorBoards = () => boards.filter((board) => board.scopeType === 'major_group');
  const getMajorBoardByMajorGroupId = (majorGroupId?: string) =>
    boards.find(
      (board) => board.scopeType === 'major_group' && board.majorGroupId === majorGroupId
    );
  const getSchoolBoardByUniversityId = (universityId?: string) =>
    boards.find(
      (board) => board.scopeType === 'university' && board.universityId === universityId
    );
  const blockedProfileIds = buildBlockedProfileIds({
    blocks,
    blockerProfileId: profile.id,
  });

  const getAuthorProfile = (authorProfileId: string) =>
    authorProfileId === profile.id
      ? currentProfileSummary
      : authorProfiles.find((item) => item.id === authorProfileId) ??
        FALLBACK_AUTHOR_PROFILE_MAP.get(authorProfileId);

  const getBlockedProfiles = () =>
    buildBlockedProfileEntries({
      blocks,
      blockerProfileId: profile.id,
      resolveProfile: getAuthorProfile,
    });

  const isBlockedProfile = (profileId?: string) =>
    Boolean(profileId && blockedProfileIds.has(profileId));

  const mapPostRowToView = (post: PostRow): CommunityPost => {
    const author = getAuthorProfile(post.authorProfileId);

    return {
      ...post,
      summary: buildSummary(post.body),
      createdLabel: buildRelativeLabel(post.createdAt),
      authorNickname: author?.nickname ?? '알 수 없는 사용자',
      authorMajorGroupId: author?.primaryMajorGroupId,
      authorUniversityId: author?.primaryUniversityId,
    };
  };

  const mapCommentRowToView = (comment: CommentRow): Comment => {
    const author = getAuthorProfile(comment.authorProfileId);

    return {
      ...comment,
      createdLabel: buildRelativeLabel(comment.createdAt),
      authorNickname: author?.nickname ?? '알 수 없는 사용자',
    };
  };

  const getPostRowById = (postId?: string) => state.posts.find((post) => post.id === postId);
  const getRecruitmentRowById = (recruitmentId?: string) =>
    state.recruitments.find((recruitment) => recruitment.id === recruitmentId);

  const getReadAccessForBoard = (boardId?: string) =>
    getBoardReadAccess({
      board: findBoardById(boardId),
      canAccessCommunity,
      isAuthenticated,
      primaryUniversityId: profile.primaryUniversityId,
    });

  const getReadAccessForPost = (postId?: string) => {
    const post = getPostRowById(postId);

    if (!post) {
      return { ok: false, message: '게시글을 찾을 수 없습니다.' };
    }

    if (blockedProfileIds.has(post.authorProfileId)) {
      return { ok: false, message: '차단한 사용자의 글이라 숨겨졌습니다.' };
    }

    return getReadAccessForBoard(post.boardId);
  };

  const getReadAccessForRecruitment = (recruitmentId?: string) => {
    const recruitment = getRecruitmentRowById(recruitmentId);

    if (!recruitment) {
      return { ok: false, message: '모집글을 찾을 수 없습니다.' };
    }

    return getReadAccessForPost(recruitment.postId);
  };

  const getWriteAccessForBoard = (boardId?: string) =>
    getBoardWriteAccess({
      board: findBoardById(boardId),
      canAccessCommunity,
      isAuthenticated,
      isReadOnly,
      primaryUniversityId: profile.primaryUniversityId,
    });

  const getCommentAccessForPost = (postId?: string) => {
    const post = getPostRowById(postId);

    if (!post) {
      return { ok: false, message: '게시글을 찾을 수 없습니다.' };
    }

    const writeAccess = getWriteAccessForBoard(post.boardId);

    if (!writeAccess.ok) {
      return writeAccess;
    }

    if (post.postType === 'recruitment') {
      const recruitment = state.recruitments.find((item) => item.postId === post.id);

      if (!recruitment) {
        return { ok: false, message: '모집 정보를 다시 확인해 주세요.' };
      }

      if (recruitment.status !== 'open') {
        return {
          ok: false,
          message: getRecruitmentClosedMessage(recruitment.status),
        };
      }
    }

    return writeAccess;
  };

  const mapRecruitmentRowToView = (recruitment: RecruitmentRow): RecruitmentCard | undefined => {
    const post = getPostRowById(recruitment.postId);

    if (!post || !getReadAccessForPost(post.id).ok) {
      return undefined;
    }

    return {
      ...recruitment,
      title: post.title,
      summary: buildSummary(post.body),
      headcountLabel: buildHeadcountLabel(recruitment.headcount),
      deadlineLabel: buildDeadlineLabel(recruitment.deadlineAt),
      commentPrompt: RECRUITMENT_COMMENT_PROMPTS[recruitment.recruitmentType],
    };
  };

  const getPostsByBoardId = (boardId?: string) => {
    if (!getReadAccessForBoard(boardId).ok) {
      return [];
    }

    return sortPostsDescending(
      state.posts.filter(
        (post) =>
          post.boardId === boardId &&
          post.status === 'published' &&
          !blockedProfileIds.has(post.authorProfileId)
      )
    ).map(mapPostRowToView);
  };

  const getPostById = (postId?: string) => {
    if (!getReadAccessForPost(postId).ok) {
      return undefined;
    }

    const post = getPostRowById(postId);

    return post ? mapPostRowToView(post) : undefined;
  };

  const getCommentsByPostId = (postId?: string) => {
    if (!getReadAccessForPost(postId).ok) {
      return [];
    }

    return sortCommentsAscending(
      state.comments.filter(
        (comment) =>
          comment.postId === postId &&
          comment.status === 'published' &&
          !blockedProfileIds.has(comment.authorProfileId)
      )
    ).map(mapCommentRowToView);
  };

  const getRecruitments = (majorGroupId?: string) =>
    sortRecruitmentsDescending(
      state.recruitments.filter((recruitment) => {
        if (!getReadAccessForRecruitment(recruitment.id).ok) {
          return false;
        }

        if (!majorGroupId || majorGroupId === 'all') {
          return true;
        }

        return recruitment.preferredMajorGroupId === majorGroupId;
      })
    )
      .map(mapRecruitmentRowToView)
      .filter((item): item is RecruitmentCard => Boolean(item));

  const getRecruitmentById = (recruitmentId?: string) => {
    if (!getReadAccessForRecruitment(recruitmentId).ok) {
      return undefined;
    }

    const recruitment = getRecruitmentRowById(recruitmentId);

    return recruitment ? mapRecruitmentRowToView(recruitment) : undefined;
  };

  const createPost = async ({
    boardId,
    title,
    body,
    category,
    postType,
  }: CreatePostInput): Promise<CommunityActionResult> => {
    const board = findBoardById(boardId);
    const writeAccess = getWriteAccessForBoard(boardId);
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!writeAccess.ok) {
      return writeAccess;
    }

    if (!board) {
      return { ok: false, message: '게시판 정보를 다시 확인해 주세요.' };
    }

    if (trimmedTitle.length < COMMUNITY_VALIDATION.titleMinLength) {
      return {
        ok: false,
        message: `제목은 ${COMMUNITY_VALIDATION.titleMinLength}자 이상 입력해 주세요.`,
      };
    }

    if (trimmedBody.length < COMMUNITY_VALIDATION.bodyMinLength) {
      return {
        ok: false,
        message: `본문은 ${COMMUNITY_VALIDATION.bodyMinLength}자 이상 입력해 주세요.`,
      };
    }

    if (isSupabaseReady && canAccessCommunity) {
      const remoteResult = await insertPost({
        boardId: board.id,
        authorProfileId: profile.id,
        title: trimmedTitle,
        body: trimmedBody,
        category,
        postType,
        majorGroupId:
          board.scopeType === 'major_group' ? board.majorGroupId : profile.primaryMajorGroupId,
        universityId:
          board.scopeType === 'university'
            ? board.universityId ?? profile.primaryUniversityId
            : undefined,
        isAnonymous: true,
        commentCount: 0,
      });

      if (!remoteResult.ok || !remoteResult.post) {
        return {
          ok: false,
          message: remoteResult.error ?? '게시글을 저장하지 못했습니다.',
        };
      }
      const remotePost = remoteResult.post;

      setState((current) => ({
        ...current,
        posts: prependOrReplaceRow<PostRow>(current.posts, remotePost),
      }));
      track('post_created', {
        board_scope: board.scopeType,
        post_category: category,
        post_type: postType,
        university_id: remotePost.universityId ?? null,
        major_group: remotePost.majorGroupId ?? null,
        storage_mode: 'supabase',
      });

      return {
        ok: true,
        message: '게시글이 등록되었습니다.',
        postId: remotePost.id,
      };
    }

    const createdAt = new Date().toISOString();
    const nextPost: PostRow = {
      id: createPostId(),
      boardId: board.id,
      authorProfileId: profile.id,
      title: trimmedTitle,
      body: trimmedBody,
      category,
      postType,
      status: 'published',
      majorGroupId:
        board.scopeType === 'major_group' ? board.majorGroupId : profile.primaryMajorGroupId,
      universityId:
        board.scopeType === 'university' ? board.universityId ?? profile.primaryUniversityId : undefined,
      isAnonymous: true,
      commentCount: 0,
      createdAt,
    };

    setState((current) => ({
      ...current,
      posts: [nextPost, ...current.posts],
    }));
    track('post_created', {
      board_scope: board.scopeType,
      post_category: category,
      post_type: postType,
      university_id: nextPost.universityId ?? null,
      major_group: nextPost.majorGroupId ?? null,
      storage_mode: 'local_cache',
    });

    return {
      ok: true,
      message: getLocalFallbackWriteMessage('게시글'),
      postId: nextPost.id,
    };
  };

  const createRecruitment = async ({
    boardId,
    title,
    body,
    recruitmentType,
    mode,
    headcount,
    deadlineDays,
    preferredMajorGroupId,
  }: CreateRecruitmentInput): Promise<CommunityActionResult> => {
    const board = findBoardById(boardId);
    const writeAccess = getWriteAccessForBoard(boardId);
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    const parsedHeadcount = Number.parseInt(headcount, 10);

    if (!writeAccess.ok) {
      return writeAccess;
    }

    if (!board) {
      return { ok: false, message: '모집 위치를 다시 선택해 주세요.' };
    }

    if (trimmedTitle.length < COMMUNITY_VALIDATION.titleMinLength) {
      return {
        ok: false,
        message: `제목은 ${COMMUNITY_VALIDATION.titleMinLength}자 이상 입력해 주세요.`,
      };
    }

    if (trimmedBody.length < COMMUNITY_VALIDATION.bodyMinLength) {
      return {
        ok: false,
        message: `본문은 ${COMMUNITY_VALIDATION.bodyMinLength}자 이상 입력해 주세요.`,
      };
    }

    if (
      Number.isNaN(parsedHeadcount) ||
      parsedHeadcount < COMMUNITY_VALIDATION.recruitmentHeadcountMin ||
      parsedHeadcount > COMMUNITY_VALIDATION.recruitmentHeadcountMax
    ) {
      return {
        ok: false,
        message: `${COMMUNITY_VALIDATION.recruitmentHeadcountMin}명 이상 ${COMMUNITY_VALIDATION.recruitmentHeadcountMax}명 이하로 모집 인원을 입력해 주세요.`,
      };
    }

    const normalizedPreferredMajorGroupId = preferredMajorGroupId?.trim() || undefined;
    const effectiveMajorGroupId =
      board.scopeType === 'major_group' ? board.majorGroupId : normalizedPreferredMajorGroupId;

    if (isSupabaseReady && canAccessCommunity) {
      const remoteResult = await createRecruitmentWithPost({
        boardId: board.id,
        title: trimmedTitle,
        body: trimmedBody,
        majorGroupId:
          board.scopeType === 'major_group' ? board.majorGroupId : profile.primaryMajorGroupId,
        universityId:
          board.scopeType === 'university'
            ? board.universityId ?? profile.primaryUniversityId
            : undefined,
        isAnonymous: true,
        recruitmentType,
        headcount: parsedHeadcount,
        mode,
        deadlineAt: buildDeadlineAt(deadlineDays),
        preferredMajorGroupId: effectiveMajorGroupId,
      });

      if (!remoteResult.ok || !remoteResult.recruitment || !remoteResult.postId || !remoteResult.post) {
        return {
          ok: false,
          message: remoteResult.error ?? '모집글을 저장하지 못했습니다.',
        };
      }
      const remotePost = remoteResult.post;
      const remoteRecruitment = remoteResult.recruitment;

      setState((current) => ({
        ...current,
        posts: prependOrReplaceRow<PostRow>(current.posts, remotePost),
        recruitments: prependOrReplaceRow<RecruitmentRow>(
          current.recruitments,
          remoteRecruitment
        ),
      }));
      track('recruitment_created', {
        board_scope: board.scopeType,
        university_id: remotePost.universityId ?? null,
        major_group: remoteRecruitment.preferredMajorGroupId ?? remotePost.majorGroupId ?? null,
        recruitment_type: recruitmentType,
        storage_mode: 'supabase',
      });

      return {
        ok: true,
        message: '모집글이 등록되었습니다.',
        postId: remoteResult.postId,
        recruitmentId: remoteRecruitment.id,
      };
    }

    const createdAt = new Date().toISOString();
    const recruitmentId = createRecruitmentId();
    const postId = createPostId();
    const nextPost: PostRow = {
      id: postId,
      boardId: board.id,
      authorProfileId: profile.id,
      title: trimmedTitle,
      body: trimmedBody,
      category: 'recruitment',
      postType: 'recruitment',
      status: 'published',
      majorGroupId:
        board.scopeType === 'major_group' ? board.majorGroupId : profile.primaryMajorGroupId,
      universityId:
        board.scopeType === 'university' ? board.universityId ?? profile.primaryUniversityId : undefined,
      recruitmentId,
      isAnonymous: true,
      commentCount: 0,
      createdAt,
    };
    const nextRecruitment: RecruitmentRow = {
      id: recruitmentId,
      postId,
      recruitmentType,
      status: 'open',
      headcount: parsedHeadcount,
      mode,
      deadlineAt: buildDeadlineAt(deadlineDays),
      preferredMajorGroupId: effectiveMajorGroupId,
      createdAt,
    };

    setState((current) => ({
      ...current,
      posts: [nextPost, ...current.posts],
      recruitments: [nextRecruitment, ...current.recruitments],
    }));
    track('recruitment_created', {
      board_scope: board.scopeType,
      university_id: nextPost.universityId ?? null,
      major_group: nextRecruitment.preferredMajorGroupId ?? nextPost.majorGroupId ?? null,
      recruitment_type: recruitmentType,
      storage_mode: 'local_cache',
    });

    return {
      ok: true,
      message: getLocalFallbackWriteMessage('모집글'),
      postId,
      recruitmentId,
    };
  };

  const createComment = async ({
    postId,
    body,
  }: CreateCommentInput): Promise<CommunityActionResult> => {
    const post = getPostRowById(postId);
    const commentAccess = getCommentAccessForPost(postId);
    const trimmedBody = body.trim();

    if (!commentAccess.ok) {
      return commentAccess;
    }

    if (!post) {
      return { ok: false, message: '댓글을 달 게시글을 찾을 수 없습니다.' };
    }

    if (trimmedBody.length < COMMUNITY_VALIDATION.commentMinLength) {
      return {
        ok: false,
        message: `댓글은 ${COMMUNITY_VALIDATION.commentMinLength}자 이상 입력해 주세요.`,
      };
    }

    if (isSupabaseReady && canAccessCommunity) {
      const remoteResult = await insertComment({
        postId: post.id,
        authorProfileId: profile.id,
        body: trimmedBody,
        kind: post.postType === 'recruitment' ? 'recruitment_intent' : 'general',
        isAnonymous: true,
      });

      if (!remoteResult.ok || !remoteResult.comment) {
        return {
          ok: false,
          message: remoteResult.error ?? '댓글을 저장하지 못했습니다.',
        };
      }
      const remoteComment = remoteResult.comment;

      setState((current) => ({
        posts: current.posts.map((item) =>
          item.id === post.id
            ? {
                ...item,
                commentCount: item.commentCount + 1,
              }
            : item
        ),
        comments: prependOrReplaceRow<CommentRow>(current.comments, remoteComment),
        recruitments: current.recruitments,
      }));
      track(
        post.postType === 'recruitment' ? 'recruitment_interest_commented' : 'comment_created',
        {
          post_type: post.postType,
          board_scope: findBoardById(post.boardId)?.scopeType ?? null,
          university_id: post.universityId ?? null,
          major_group: post.majorGroupId ?? null,
          storage_mode: 'supabase',
        }
      );

      return {
        ok: true,
        message: '댓글이 등록되었습니다.',
        commentId: remoteComment.id,
      };
    }

    const createdAt = new Date().toISOString();
    const nextComment: CommentRow = {
      id: createCommentId(),
      postId: post.id,
      authorProfileId: profile.id,
      depth: 1,
      body: trimmedBody,
      status: 'published',
      kind: post.postType === 'recruitment' ? 'recruitment_intent' : 'general',
      isAnonymous: true,
      createdAt,
    };

    setState((current) => ({
      posts: current.posts.map((item) =>
        item.id === post.id
          ? {
              ...item,
              commentCount: item.commentCount + 1,
            }
          : item
      ),
      comments: [...current.comments, nextComment],
      recruitments: current.recruitments.map((recruitment) =>
        recruitment.postId === post.id && recruitment.status === 'open'
          ? {
              ...recruitment,
            }
          : recruitment
      ),
    }));
    track(
      post.postType === 'recruitment' ? 'recruitment_interest_commented' : 'comment_created',
      {
        post_type: post.postType,
        board_scope: findBoardById(post.boardId)?.scopeType ?? null,
        university_id: post.universityId ?? null,
        major_group: post.majorGroupId ?? null,
        storage_mode: 'local_cache',
      }
    );

    return {
      ok: true,
      message: getLocalFallbackWriteMessage('댓글'),
      commentId: nextComment.id,
    };
  };

  const reportTarget = async ({
    targetType,
    targetId,
    reason,
    targetProfileId,
  }: ReportTargetInput): Promise<CommunityActionResult> => {
    const normalizedReason = REPORT_REASON_OPTIONS.find((option) => option.value === reason)?.value;
    let resolvedTargetProfileId = targetProfileId;

    if (!normalizedReason) {
      return { ok: false, message: '신고 사유를 다시 선택해 주세요.' };
    }

    if (!targetId.trim()) {
      return { ok: false, message: '신고 대상을 다시 확인해 주세요.' };
    }

    if (targetType === 'post') {
      const post = getPostRowById(targetId);

      if (!post) {
        return { ok: false, message: '신고할 게시글을 찾을 수 없습니다.' };
      }

      resolvedTargetProfileId = post.authorProfileId;
    }

    if (targetType === 'comment') {
      const comment = state.comments.find((item) => item.id === targetId);

      if (!comment) {
        return { ok: false, message: '신고할 댓글을 찾을 수 없습니다.' };
      }

      resolvedTargetProfileId = comment.authorProfileId;
    }

    if (targetType === 'recruitment') {
      const recruitment = state.recruitments.find((item) => item.id === targetId);

      if (!recruitment) {
        return { ok: false, message: '신고할 모집글을 찾을 수 없습니다.' };
      }

      const recruitmentPost = getPostRowById(recruitment.postId);
      resolvedTargetProfileId = recruitmentPost?.authorProfileId;
    }

    if (targetType === 'profile') {
      resolvedTargetProfileId = targetProfileId ?? targetId;
    }

    if (!resolvedTargetProfileId) {
      return { ok: false, message: '신고할 작성자 정보를 다시 확인해 주세요.' };
    }

    if (resolvedTargetProfileId === profile.id) {
      return { ok: false, message: '내 글, 내 댓글, 내 모집글, 내 프로필은 신고할 수 없습니다.' };
    }

    if (
      isSupabaseReady &&
      canAccessCommunity &&
      isUuidLike(targetId) &&
      isUuidLike(resolvedTargetProfileId)
    ) {
      const remoteResult = await submitReport({
        targetType,
        targetId,
        reason: normalizedReason,
        targetProfileId: resolvedTargetProfileId,
      });

      if (remoteResult.ok && remoteResult.report) {
        setReports((current) => prependReportRecord(current, remoteResult.report!));
        track('report_submitted', {
          target_type: targetType,
          reason: normalizedReason,
          storage_mode: 'supabase',
        });

        return {
          ok: true,
          message: '신고가 접수되었습니다.',
          reportId: remoteResult.report.id,
        };
      }

      if (remoteResult.errorKind !== 'network') {
        return {
          ok: false,
          message: remoteResult.error ?? '신고를 접수하지 못했습니다.',
        };
      }
    }

    const nextReport: ReportRecord = {
      id: createReportId(),
      reporterProfileId: profile.id,
      targetType,
      targetId,
      targetProfileId: resolvedTargetProfileId,
      reason: normalizedReason,
      createdAt: new Date().toISOString(),
    };

    setReports((current) => prependReportRecord(current, nextReport));
    track('report_submitted', {
      target_type: targetType,
      reason: normalizedReason,
      storage_mode: 'local_cache',
    });

    return {
      ok: true,
      message: getLocalModerationMessage('신고'),
      reportId: nextReport.id,
    };
  };

  const blockProfile = async (profileId?: string): Promise<CommunityActionResult> => {
    if (!profileId) {
      return { ok: false, message: '차단할 작성자 정보를 찾을 수 없습니다.' };
    }

    if (profileId === profile.id) {
      return { ok: false, message: '자기 자신은 차단할 수 없습니다.' };
    }

    if (blockedProfileIds.has(profileId)) {
      return { ok: true, message: '이미 차단한 사용자입니다.' };
    }

    if (isSupabaseReady && canAccessCommunity && isUuidLike(profileId)) {
      const remoteResult = await blockProfileRemote(profileId);

      if (remoteResult.ok && remoteResult.block) {
        setBlocks((current) => prependBlockRecord(current, remoteResult.block!));
        track('user_blocked', {
          storage_mode: 'supabase',
        });

        return {
          ok: true,
          message: '사용자를 차단했습니다.',
          blockId: remoteResult.block.id,
        };
      }

      if (remoteResult.errorKind !== 'network') {
        return {
          ok: false,
          message: remoteResult.error ?? '사용자를 차단하지 못했습니다.',
        };
      }
    }

    const nextBlock: BlockRecord = {
      id: createBlockId(),
      blockerProfileId: profile.id,
      blockedProfileId: profileId,
      createdAt: new Date().toISOString(),
    };

    setBlocks((current) => prependBlockRecord(current, nextBlock));
    track('user_blocked', {
      storage_mode: 'local_cache',
    });

    return {
      ok: true,
      message: getLocalModerationMessage('차단'),
      blockId: nextBlock.id,
    };
  };

  const unblockProfile = async (profileId?: string): Promise<CommunityActionResult> => {
    if (!profileId) {
      return { ok: false, message: '차단 해제할 작성자 정보를 찾을 수 없습니다.' };
    }

    if (!blockedProfileIds.has(profileId)) {
      return { ok: true, message: '현재 차단 목록에 없는 사용자입니다.' };
    }

    if (isSupabaseReady && canAccessCommunity && isUuidLike(profileId)) {
      const remoteResult = await unblockProfileRemote(profileId);

      if (remoteResult.ok) {
        setBlocks((current) =>
          current.filter(
            (block) =>
              !(block.blockerProfileId === profile.id && block.blockedProfileId === profileId)
          )
        );
        track('user_unblocked', {
          storage_mode: 'supabase',
        });

        return {
          ok: true,
          message: '차단을 해제했습니다.',
        };
      }

      if (remoteResult.errorKind !== 'network') {
        return {
          ok: false,
          message: remoteResult.error ?? '차단을 해제하지 못했습니다.',
        };
      }
    }

    setBlocks((current) =>
      current.filter(
        (block) =>
          !(block.blockerProfileId === profile.id && block.blockedProfileId === profileId)
      )
    );
    track('user_unblocked', {
      storage_mode: 'local_cache',
    });

    return {
      ok: true,
      message: getLocalModerationMessage('차단 해제'),
    };
  };

  return (
    <CommunityContext.Provider
      value={{
        isHydrating,
        isRefreshing,
        refresh,
        getBoardById: findBoardById,
        getNetworkBoard,
        getMajorBoards,
        getMajorBoardByMajorGroupId,
        getSchoolBoardByUniversityId,
        getPostById,
        getPostsByBoardId,
        getCommentsByPostId,
        getRecruitments,
        getRecruitmentById,
        getReadAccessForBoard,
        getReadAccessForPost,
        getReadAccessForRecruitment,
        getWriteAccessForBoard,
        getCommentAccessForPost,
        getBlockedProfiles,
        isBlockedProfile,
        createPost,
        createRecruitment,
        createComment,
        reportTarget,
        blockProfile,
        unblockProfile,
      }}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunityData() {
  const context = useContext(CommunityContext);

  if (!context) {
    throw new Error('useCommunityData must be used within CommunityProvider');
  }

  return context;
}
