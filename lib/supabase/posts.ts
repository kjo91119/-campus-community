import type {
  PostCategory,
  PostRow,
  PostStatus,
  PostType,
} from '@/types/domain';
import { getSupabaseClient } from '@/lib/supabase/client';
import { SUPABASE_TABLES } from '@/lib/supabase/tables';

type SupabasePostRow = {
  id: string;
  board_id: string;
  author_profile_id: string;
  title: string;
  body: string;
  category: PostCategory;
  post_type: PostType;
  status: PostStatus;
  major_group_id: string | null;
  university_id: string | null;
  recruitment_id: string | null;
  is_anonymous: boolean;
  comment_count: number;
  created_at: string;
};

type CreatePostInput = {
  boardId: string;
  authorProfileId: string;
  title: string;
  body: string;
  category: PostCategory;
  postType: PostType;
  status?: PostStatus;
  majorGroupId?: string;
  universityId?: string;
  recruitmentId?: string;
  isAnonymous?: boolean;
  commentCount?: number;
};

type PostsResult = {
  ok: boolean;
  posts?: PostRow[];
  error?: string;
};

type PostResult = {
  ok: boolean;
  post?: PostRow;
  error?: string;
};

const POST_SELECT_COLUMNS =
  'id, board_id, author_profile_id, title, body, category, post_type, status, major_group_id, university_id, recruitment_id, is_anonymous, comment_count, created_at';

function normalizePostError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return '게시글 저장소에서 알 수 없는 오류가 발생했습니다.';
}

function mapSupabasePostRow(row: SupabasePostRow): PostRow {
  return {
    id: row.id,
    boardId: row.board_id,
    authorProfileId: row.author_profile_id,
    title: row.title,
    body: row.body,
    category: row.category,
    postType: row.post_type,
    status: row.status,
    majorGroupId: row.major_group_id ?? undefined,
    universityId: row.university_id ?? undefined,
    recruitmentId: row.recruitment_id ?? undefined,
    isAnonymous: row.is_anonymous,
    commentCount: row.comment_count,
    createdAt: row.created_at,
  };
}

function mapCreatePostInput(input: CreatePostInput) {
  return {
    board_id: input.boardId,
    author_profile_id: input.authorProfileId,
    title: input.title,
    body: input.body,
    category: input.category,
    post_type: input.postType,
    status: input.status ?? 'published',
    major_group_id: input.majorGroupId ?? null,
    university_id: input.universityId ?? null,
    recruitment_id: input.recruitmentId ?? null,
    is_anonymous: input.isAnonymous ?? true,
    comment_count: input.commentCount ?? 0,
  };
}

export function postsQuery() {
  return getSupabaseClient().from(SUPABASE_TABLES.posts);
}

export async function listPublishedPosts(): Promise<PostsResult> {
  try {
    const { data, error } = await postsQuery()
      .select(POST_SELECT_COLUMNS)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      return { ok: false, error: normalizePostError(error) };
    }

    return {
      ok: true,
      posts: ((data ?? []) as SupabasePostRow[]).map(mapSupabasePostRow),
    };
  } catch (error) {
    return { ok: false, error: normalizePostError(error) };
  }
}

export async function getPostRowById(postId: string): Promise<PostResult> {
  try {
    const { data, error } = await postsQuery()
      .select(POST_SELECT_COLUMNS)
      .eq('id', postId)
      .maybeSingle();

    if (error) {
      return { ok: false, error: normalizePostError(error) };
    }

    if (!data) {
      return { ok: true };
    }

    return {
      ok: true,
      post: mapSupabasePostRow(data as SupabasePostRow),
    };
  } catch (error) {
    return { ok: false, error: normalizePostError(error) };
  }
}

export async function insertPost(input: CreatePostInput): Promise<PostResult> {
  try {
    const { data, error } = await postsQuery()
      .insert(mapCreatePostInput(input))
      .select(POST_SELECT_COLUMNS)
      .single();

    if (error) {
      return { ok: false, error: normalizePostError(error) };
    }

    return {
      ok: true,
      post: mapSupabasePostRow(data as SupabasePostRow),
    };
  } catch (error) {
    return { ok: false, error: normalizePostError(error) };
  }
}
