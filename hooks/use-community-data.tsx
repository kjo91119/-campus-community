import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import { COMMUNITY_VALIDATION } from '@/constants/community';
import {
  getBoardById,
  getProfileById as getMockProfileById,
  MOCK_COMMENTS,
  MOCK_POSTS,
} from '@/data/mock-community';
import { useAppSession } from '@/hooks/use-app-session';
import type {
  Board,
  Comment,
  CommentRow,
  CommunityPost,
  PostCategory,
  PostRow,
  PostType,
  Profile,
} from '@/types/domain';

type CreatePostInput = {
  boardId: string;
  title: string;
  body: string;
  category: Exclude<PostCategory, 'recruitment'>;
  postType: Exclude<PostType, 'recruitment'>;
};

type CreateCommentInput = {
  postId: string;
  body: string;
};

type CommunityActionResult = {
  ok: boolean;
  message?: string;
  postId?: string;
  commentId?: string;
};

type AccessResult = {
  ok: boolean;
  message?: string;
};

type CommunityContextValue = {
  isHydrating: boolean;
  getPostById: (postId?: string) => CommunityPost | undefined;
  getPostsByBoardId: (boardId?: string) => CommunityPost[];
  getCommentsByPostId: (postId?: string) => Comment[];
  getReadAccessForBoard: (boardId?: string) => AccessResult;
  getReadAccessForPost: (postId?: string) => AccessResult;
  getWriteAccessForBoard: (boardId?: string) => AccessResult;
  getCommentAccessForPost: (postId?: string) => AccessResult;
  createPost: (input: CreatePostInput) => Promise<CommunityActionResult>;
  createComment: (input: CreateCommentInput) => Promise<CommunityActionResult>;
};

type CommunityState = {
  posts: PostRow[];
  comments: CommentRow[];
};

type PersistedCommunityState = {
  version: number;
  state: CommunityState;
};

const COMMUNITY_STORAGE_KEY = 'campus-community:community-store';
const COMMUNITY_STORAGE_VERSION = 2;

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
};

const CommunityContext = createContext<CommunityContextValue | null>(null);

function sortPostsDescending(posts: PostRow[]) {
  return [...posts].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

function sortCommentsAscending(comments: CommentRow[]) {
  return [...comments].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));
}

function createPostId() {
  return `local-post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createCommentId() {
  return `local-comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

function mergeRowsById<Row extends { id: string }>(seedRows: Row[], storedRows: Row[]) {
  const rowMap = new Map<string, Row>();

  seedRows.forEach((row) => {
    rowMap.set(row.id, row);
  });

  storedRows.forEach((row) => {
    rowMap.set(row.id, row);
  });

  return [...rowMap.values()];
}

function mergeWithSeed(state: CommunityState): CommunityState {
  return {
    posts: mergeRowsById(INITIAL_COMMUNITY_STATE.posts, state.posts),
    comments: mergeRowsById(INITIAL_COMMUNITY_STATE.comments, state.comments),
  };
}

function parseCommunityState(rawValue: string | null) {
  if (!rawValue) {
    return { state: INITIAL_COMMUNITY_STATE };
  }

  try {
    const parsed = JSON.parse(rawValue) as
      | PersistedCommunityState
      | {
          posts?: unknown[];
          comments?: unknown[];
        };
    const legacyParsed = parsed as {
      posts?: unknown[];
      comments?: unknown[];
    };

    const rawState: {
      posts?: unknown[];
      comments?: unknown[];
    } =
      'state' in parsed && parsed.state
        ? parsed.state
        : {
            posts: legacyParsed.posts,
            comments: legacyParsed.comments,
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
    };

    return {
      state: mergeWithSeed(nextState),
    };
  } catch {
    return { state: INITIAL_COMMUNITY_STATE };
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
  const { canAccessCommunity, isAuthenticated, isReadOnly, profile } = useAppSession();
  const [state, setState] = useState<CommunityState>(INITIAL_COMMUNITY_STATE);
  const [isHydrating, setIsHydrating] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      const storedValue = await AsyncStorage.getItem(COMMUNITY_STORAGE_KEY);
      const parsed = parseCommunityState(storedValue);

      if (!active) {
        return;
      }

      setState(parsed.state);
      setIsHydrating(false);
      setHasLoaded(true);
    };

    void hydrate();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    const payload: PersistedCommunityState = {
      version: COMMUNITY_STORAGE_VERSION,
      state,
    };

    void AsyncStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(payload));
  }, [hasLoaded, state]);

  const getAuthorProfile = (authorProfileId: string): Profile | undefined => {
    if (authorProfileId === profile.id) {
      return profile;
    }

    return getMockProfileById(authorProfileId);
  };

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

  const getReadAccessForBoard = (boardId?: string) =>
    getBoardReadAccess({
      board: getBoardById(boardId),
      canAccessCommunity,
      isAuthenticated,
      primaryUniversityId: profile.primaryUniversityId,
    });

  const getReadAccessForPost = (postId?: string) => {
    const post = getPostRowById(postId);

    if (!post) {
      return { ok: false, message: '게시글을 찾을 수 없습니다.' };
    }

    return getReadAccessForBoard(post.boardId);
  };

  const getWriteAccessForBoard = (boardId?: string) =>
    getBoardWriteAccess({
      board: getBoardById(boardId),
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

    return getWriteAccessForBoard(post.boardId);
  };

  const getPostsByBoardId = (boardId?: string) => {
    if (!getReadAccessForBoard(boardId).ok) {
      return [];
    }

    return sortPostsDescending(
      state.posts.filter((post) => post.boardId === boardId && post.status === 'published')
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
      state.comments.filter((comment) => comment.postId === postId && comment.status === 'published')
    ).map(mapCommentRowToView);
  };

  const createPost = async ({
    boardId,
    title,
    body,
    category,
    postType,
  }: CreatePostInput): Promise<CommunityActionResult> => {
    const board = getBoardById(boardId);
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

    return {
      ok: true,
      message: '게시글이 등록되었습니다.',
      postId: nextPost.id,
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
    }));

    return {
      ok: true,
      message: '댓글이 등록되었습니다.',
      commentId: nextComment.id,
    };
  };

  return (
    <CommunityContext.Provider
      value={{
        isHydrating,
        getPostById,
        getPostsByBoardId,
        getCommentsByPostId,
        getReadAccessForBoard,
        getReadAccessForPost,
        getWriteAccessForBoard,
        getCommentAccessForPost,
        createPost,
        createComment,
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
