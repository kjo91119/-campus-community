import type {
  RecruitmentMode,
  PostRow,
  RecruitmentRow,
  RecruitmentStatus,
  RecruitmentType,
} from '@/types/domain';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getPostRowById } from '@/lib/supabase/posts';
import { SUPABASE_TABLES } from '@/lib/supabase/tables';

type SupabaseRecruitmentRow = {
  id: string;
  post_id: string;
  recruitment_type: RecruitmentType;
  status: RecruitmentStatus;
  headcount: number | null;
  mode: RecruitmentMode | null;
  deadline_at: string | null;
  preferred_major_group_id: string | null;
  created_at: string;
};

type CreateRecruitmentWithPostInput = {
  boardId: string;
  title: string;
  body: string;
  majorGroupId?: string;
  universityId?: string;
  isAnonymous?: boolean;
  recruitmentType: RecruitmentType;
  headcount: number;
  mode: RecruitmentMode;
  deadlineAt?: string;
  preferredMajorGroupId?: string;
};

type RecruitmentsResult = {
  ok: boolean;
  recruitments?: RecruitmentRow[];
  error?: string;
};

type RecruitmentResult = {
  ok: boolean;
  recruitment?: RecruitmentRow;
  error?: string;
};

type RecruitmentWithPostResult = {
  ok: boolean;
  post?: PostRow;
  recruitment?: RecruitmentRow;
  postId?: string;
  error?: string;
};

type CreateRecruitmentRpcResult = {
  post_id: string;
  recruitment_id: string;
};

const RECRUITMENT_SELECT_COLUMNS =
  'id, post_id, recruitment_type, status, headcount, mode, deadline_at, preferred_major_group_id, created_at';

function normalizeRecruitmentError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return '모집글 저장소에서 알 수 없는 오류가 발생했습니다.';
}

function mapSupabaseRecruitmentRow(row: SupabaseRecruitmentRow): RecruitmentRow {
  return {
    id: row.id,
    postId: row.post_id,
    recruitmentType: row.recruitment_type,
    status: row.status,
    headcount: row.headcount ?? undefined,
    mode: row.mode ?? undefined,
    deadlineAt: row.deadline_at ?? undefined,
    preferredMajorGroupId: row.preferred_major_group_id ?? undefined,
    createdAt: row.created_at,
  };
}

export function recruitmentsQuery() {
  return getSupabaseClient().from(SUPABASE_TABLES.recruitments);
}

export async function listRecruitments(): Promise<RecruitmentsResult> {
  try {
    const { data, error } = await recruitmentsQuery()
      .select(RECRUITMENT_SELECT_COLUMNS)
      .order('created_at', { ascending: false });

    if (error) {
      return { ok: false, error: normalizeRecruitmentError(error) };
    }

    return {
      ok: true,
      recruitments: ((data ?? []) as SupabaseRecruitmentRow[]).map(mapSupabaseRecruitmentRow),
    };
  } catch (error) {
    return { ok: false, error: normalizeRecruitmentError(error) };
  }
}

export async function getRecruitmentRowById(recruitmentId: string): Promise<RecruitmentResult> {
  try {
    const { data, error } = await recruitmentsQuery()
      .select(RECRUITMENT_SELECT_COLUMNS)
      .eq('id', recruitmentId)
      .maybeSingle();

    if (error) {
      return { ok: false, error: normalizeRecruitmentError(error) };
    }

    if (!data) {
      return { ok: true };
    }

    return {
      ok: true,
      recruitment: mapSupabaseRecruitmentRow(data as SupabaseRecruitmentRow),
    };
  } catch (error) {
    return { ok: false, error: normalizeRecruitmentError(error) };
  }
}

export async function createRecruitmentWithPost(
  input: CreateRecruitmentWithPostInput
): Promise<RecruitmentWithPostResult> {
  try {
    const { data, error } = await getSupabaseClient().rpc('create_recruitment_with_post', {
      p_board_id: input.boardId,
      p_title: input.title,
      p_body: input.body,
      p_major_group_id: input.majorGroupId ?? null,
      p_university_id: input.universityId ?? null,
      p_is_anonymous: input.isAnonymous ?? true,
      p_recruitment_type: input.recruitmentType,
      p_headcount: input.headcount,
      p_mode: input.mode,
      p_deadline_at: input.deadlineAt ?? null,
      p_preferred_major_group_id: input.preferredMajorGroupId ?? null,
    });

    if (error) {
      return { ok: false, error: normalizeRecruitmentError(error) };
    }

    const rpcRow = Array.isArray(data) ? data[0] : data;

    if (!rpcRow) {
      return { ok: false, error: '모집글 생성 결과를 확인하지 못했습니다.' };
    }

    const created = rpcRow as CreateRecruitmentRpcResult;
    const recruitmentResult = await getRecruitmentRowById(created.recruitment_id);
    const postResult = await getPostRowById(created.post_id);

    if (!recruitmentResult.ok) {
      return { ok: false, error: recruitmentResult.error };
    }

    if (!postResult.ok) {
      return { ok: false, error: postResult.error };
    }

    if (!recruitmentResult.recruitment || !postResult.post) {
      return { ok: false, error: '생성된 모집글을 다시 읽어오지 못했습니다.' };
    }

    return {
      ok: true,
      post: postResult.post,
      recruitment: recruitmentResult.recruitment,
      postId: postResult.post.id,
    };
  } catch (error) {
    return { ok: false, error: normalizeRecruitmentError(error) };
  }
}
