import type {
  Board,
  BoardScopeType,
  BoardVisibility,
  PostType,
} from '@/types/domain';
import { getSupabaseClient } from '@/lib/supabase/client';
import { SUPABASE_TABLES } from '@/lib/supabase/tables';

type SupabaseBoardRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  scope_type: BoardScopeType;
  visibility: BoardVisibility;
  major_group_id: string | null;
  university_id: string | null;
  post_type_default: PostType | null;
  is_active: boolean;
};

type BoardsResult = {
  ok: boolean;
  boards?: Board[];
  error?: string;
};

type BoardResult = {
  ok: boolean;
  board?: Board;
  error?: string;
};

const BOARD_SELECT_COLUMNS =
  'id, slug, title, description, scope_type, visibility, major_group_id, university_id, post_type_default, is_active';

function normalizeBoardError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return '게시판 저장소에서 알 수 없는 오류가 발생했습니다.';
}

function mapSupabaseBoardRow(row: SupabaseBoardRow): Board {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    scopeType: row.scope_type,
    visibility: row.visibility,
    majorGroupId: row.major_group_id ?? undefined,
    universityId: row.university_id ?? undefined,
    postTypeDefault: row.post_type_default ?? undefined,
    isActive: row.is_active,
  };
}

export function boardsQuery() {
  return getSupabaseClient().from(SUPABASE_TABLES.boards);
}

export async function listActiveBoards(): Promise<BoardsResult> {
  try {
    const { data, error } = await boardsQuery()
      .select(BOARD_SELECT_COLUMNS)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      return { ok: false, error: normalizeBoardError(error) };
    }

    return {
      ok: true,
      boards: ((data ?? []) as SupabaseBoardRow[]).map(mapSupabaseBoardRow),
    };
  } catch (error) {
    return { ok: false, error: normalizeBoardError(error) };
  }
}

export async function getBoardRowById(boardId: string): Promise<BoardResult> {
  try {
    const { data, error } = await boardsQuery()
      .select(BOARD_SELECT_COLUMNS)
      .eq('id', boardId)
      .maybeSingle();

    if (error) {
      return { ok: false, error: normalizeBoardError(error) };
    }

    if (!data) {
      return { ok: true };
    }

    return {
      ok: true,
      board: mapSupabaseBoardRow(data as SupabaseBoardRow),
    };
  } catch (error) {
    return { ok: false, error: normalizeBoardError(error) };
  }
}
