import type {
  CommentKind,
  CommentRow,
  CommentStatus,
} from '@/types/domain';
import { getSupabaseClient } from '@/lib/supabase/client';
import { SUPABASE_TABLES } from '@/lib/supabase/tables';

type SupabaseCommentRow = {
  id: string;
  post_id: string;
  author_profile_id: string;
  parent_comment_id: string | null;
  depth: 1 | 2;
  body: string;
  status: CommentStatus;
  kind: CommentKind;
  is_anonymous: boolean;
  created_at: string;
};

type CreateCommentInput = {
  postId: string;
  authorProfileId: string;
  parentCommentId?: string;
  depth?: 1 | 2;
  body: string;
  status?: CommentStatus;
  kind?: CommentKind;
  isAnonymous?: boolean;
};

type CommentsResult = {
  ok: boolean;
  comments?: CommentRow[];
  error?: string;
};

type CommentResult = {
  ok: boolean;
  comment?: CommentRow;
  error?: string;
};

const COMMENT_SELECT_COLUMNS =
  'id, post_id, author_profile_id, parent_comment_id, depth, body, status, kind, is_anonymous, created_at';

function normalizeCommentError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return '댓글 저장소에서 알 수 없는 오류가 발생했습니다.';
}

function mapSupabaseCommentRow(row: SupabaseCommentRow): CommentRow {
  return {
    id: row.id,
    postId: row.post_id,
    authorProfileId: row.author_profile_id,
    parentCommentId: row.parent_comment_id ?? undefined,
    depth: row.depth,
    body: row.body,
    status: row.status,
    kind: row.kind,
    isAnonymous: row.is_anonymous,
    createdAt: row.created_at,
  };
}

function mapCreateCommentInput(input: CreateCommentInput) {
  return {
    post_id: input.postId,
    author_profile_id: input.authorProfileId,
    parent_comment_id: input.parentCommentId ?? null,
    depth: input.depth ?? 1,
    body: input.body,
    status: input.status ?? 'published',
    kind: input.kind ?? 'general',
    is_anonymous: input.isAnonymous ?? true,
  };
}

export function commentsQuery() {
  return getSupabaseClient().from(SUPABASE_TABLES.comments);
}

export async function listPublishedComments(): Promise<CommentsResult> {
  try {
    const { data, error } = await commentsQuery()
      .select(COMMENT_SELECT_COLUMNS)
      .eq('status', 'published')
      .order('created_at', { ascending: true });

    if (error) {
      return { ok: false, error: normalizeCommentError(error) };
    }

    return {
      ok: true,
      comments: ((data ?? []) as SupabaseCommentRow[]).map(mapSupabaseCommentRow),
    };
  } catch (error) {
    return { ok: false, error: normalizeCommentError(error) };
  }
}

export async function insertComment(input: CreateCommentInput): Promise<CommentResult> {
  try {
    const { data, error } = await commentsQuery()
      .insert(mapCreateCommentInput(input))
      .select(COMMENT_SELECT_COLUMNS)
      .single();

    if (error) {
      return { ok: false, error: normalizeCommentError(error) };
    }

    return {
      ok: true,
      comment: mapSupabaseCommentRow(data as SupabaseCommentRow),
    };
  } catch (error) {
    return { ok: false, error: normalizeCommentError(error) };
  }
}
