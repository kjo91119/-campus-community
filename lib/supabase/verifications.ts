import type {
  VerificationRecord,
  VerificationReviewStatus,
} from '@/types/domain';
import { getSupabaseClient } from '@/lib/supabase/client';
import { SUPABASE_TABLES } from '@/lib/supabase/tables';

type SupabaseVerificationRow = {
  id: string;
  profile_id: string;
  method: VerificationRecord['method'];
  university_id: string | null;
  status: VerificationReviewStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_profile_id: string | null;
  evidence_url: string | null;
  rejection_reason: string | null;
};

type VerificationErrorKind = 'network' | 'server_rejected' | 'unknown';

type VerificationQueryResult = {
  ok: boolean;
  verification?: VerificationRecord;
  error?: string;
  errorKind?: VerificationErrorKind;
};

type CreateManualVerificationInput = {
  universityId: string;
};

function detectVerificationErrorKind(error: unknown): VerificationErrorKind {
  const networkPattern = /network request failed|failed to fetch|fetch failed|network/i;

  if (error instanceof Error) {
    return networkPattern.test(error.message) ? 'network' : 'unknown';
  }

  if (error && typeof error === 'object') {
    const record = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };
    const searchable = [record.message, record.details, record.hint, record.code]
      .filter(Boolean)
      .join(' ');

    if (networkPattern.test(searchable)) {
      return 'network';
    }

    if (searchable) {
      return 'server_rejected';
    }
  }

  return 'unknown';
}

function normalizeVerificationError(error: unknown) {
  const kind = detectVerificationErrorKind(error);

  if (error instanceof Error) {
    return {
      kind,
      message: error.message,
    };
  }

  if (error && typeof error === 'object') {
    const record = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };
    const message = [record.message, record.details, record.hint].filter(Boolean).join(' ').trim();

    if (message) {
      return {
        kind,
        message,
      };
    }
  }

  return {
    kind,
    message: '인증 요청 저장소에서 알 수 없는 오류가 발생했습니다.',
  };
}

function getSubmittedLabel(method: VerificationRecord['method']) {
  if (method === 'email') {
    return '학교 이메일 자동 인증';
  }

  return '학생증 수동 인증 제출';
}

function mapVerificationRowToRecord(row: SupabaseVerificationRow): VerificationRecord {
  return {
    id: row.id,
    profileId: row.profile_id,
    method: row.method,
    universityId: row.university_id ?? undefined,
    status: row.status,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewerProfileId: row.reviewer_profile_id ?? undefined,
    evidenceUrl: row.evidence_url ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    submittedLabel: getSubmittedLabel(row.method),
    syncState: 'synced',
  };
}

function verificationsQuery() {
  return getSupabaseClient().from(SUPABASE_TABLES.verifications);
}

export async function getLatestVerificationByProfileId(
  profileId: string
): Promise<VerificationQueryResult> {
  try {
    const { data, error } = await verificationsQuery()
      .select('*')
      .eq('profile_id', profileId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle<SupabaseVerificationRow>();

    if (error) {
      const normalizedError = normalizeVerificationError(error);
      return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
    }

    if (!data) {
      return { ok: true };
    }

    return {
      ok: true,
      verification: mapVerificationRowToRecord(data),
    };
  } catch (error) {
    const normalizedError = normalizeVerificationError(error);
    return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
  }
}

export async function submitManualVerificationRequest({
  universityId,
}: CreateManualVerificationInput): Promise<VerificationQueryResult> {
  try {
    const { data, error } = await getSupabaseClient().rpc('submit_manual_verification_request', {
      p_university_id: universityId,
    });

    if (error) {
      const normalizedError = normalizeVerificationError(error);
      return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row) {
      return { ok: false, error: '인증 요청 저장 결과를 찾을 수 없습니다.' };
    }

    return {
      ok: true,
      verification: mapVerificationRowToRecord(row as SupabaseVerificationRow),
    };
  } catch (error) {
    const normalizedError = normalizeVerificationError(error);
    return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
  }
}
