import { getSupabaseClient } from '@/lib/supabase/client';
import type {
  BlockRecord,
  ModerationActionType,
  ModerationEvent,
  ModerationTargetType,
  ReportReason,
  ReportRecord,
  ReportStatus,
  ReportTargetType,
} from '@/types/domain';

type ModerationErrorKind = 'network' | 'server_rejected' | 'unknown';

type SupabaseReportRow = {
  id: string;
  reporter_profile_id: string;
  target_type: ReportTargetType;
  target_id: string;
  target_profile_id: string | null;
  reason_code: ReportReason;
  detail: string | null;
  status: ReportStatus;
  reviewer_profile_id: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type SupabaseBlockRow = {
  id: string;
  blocker_profile_id: string;
  blocked_profile_id: string;
  created_at: string;
};

type ModerationResultBase = {
  ok: boolean;
  error?: string;
  errorKind?: ModerationErrorKind;
};

type ReportsQueryResult = ModerationResultBase & {
  reports?: ReportRecord[];
};

type ReportMutationResult = ModerationResultBase & {
  report?: ReportRecord;
};

type BlocksQueryResult = ModerationResultBase & {
  blocks?: BlockRecord[];
};

type BlockMutationResult = ModerationResultBase & {
  block?: BlockRecord;
};

type UnblockMutationResult = ModerationResultBase;

type ModerationActionResult = ModerationResultBase & {
  event?: ModerationEvent;
};

type SubmitReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  targetProfileId?: string;
  detail?: string;
};

type ApplyModerationActionInput = {
  actionType: ModerationActionType;
  targetType: ModerationTargetType;
  targetId: string;
  note?: string;
  reportId?: string;
};

type SupabaseModerationEventRow = {
  id: string;
  actor_profile_id: string | null;
  action_type: ModerationActionType;
  target_type: ModerationTargetType;
  target_id: string;
  target_profile_id: string | null;
  report_id: string | null;
  note: string | null;
  created_at: string;
};

const NETWORK_ERROR_PATTERN = /network request failed|failed to fetch|fetch failed|network/i;

function detectModerationErrorKind(error: unknown): ModerationErrorKind {
  if (error instanceof Error) {
    return NETWORK_ERROR_PATTERN.test(error.message) ? 'network' : 'unknown';
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

    if (NETWORK_ERROR_PATTERN.test(searchable)) {
      return 'network';
    }

    if (searchable) {
      return 'server_rejected';
    }
  }

  return 'unknown';
}

function normalizeModerationError(error: unknown, fallbackMessage: string) {
  const kind = detectModerationErrorKind(error);

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
    message: fallbackMessage,
  };
}

function mapSupabaseReportRow(row: SupabaseReportRow): ReportRecord {
  return {
    id: row.id,
    reporterProfileId: row.reporter_profile_id,
    targetType: row.target_type,
    targetId: row.target_id,
    targetProfileId: row.target_profile_id ?? undefined,
    reason: row.reason_code,
    detail: row.detail ?? undefined,
    status: row.status,
    reviewerProfileId: row.reviewer_profile_id ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    createdAt: row.created_at,
  };
}

function mapSupabaseBlockRow(row: SupabaseBlockRow): BlockRecord {
  return {
    id: row.id,
    blockerProfileId: row.blocker_profile_id,
    blockedProfileId: row.blocked_profile_id,
    createdAt: row.created_at,
  };
}

function mapSupabaseModerationEventRow(row: SupabaseModerationEventRow): ModerationEvent {
  return {
    id: row.id,
    actorProfileId: row.actor_profile_id ?? undefined,
    actionType: row.action_type,
    targetType: row.target_type,
    targetId: row.target_id,
    targetProfileId: row.target_profile_id ?? undefined,
    reportId: row.report_id ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  };
}

export async function listMyReports(): Promise<ReportsQueryResult> {
  try {
    const { data, error } = await getSupabaseClient().rpc('list_my_reports');

    if (error) {
      const normalizedError = normalizeModerationError(
        error,
        '신고 목록을 불러오지 못했습니다.'
      );
      return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
    }

    return {
      ok: true,
      reports: ((Array.isArray(data) ? data : []) as SupabaseReportRow[]).map(mapSupabaseReportRow),
    };
  } catch (error) {
    const normalizedError = normalizeModerationError(error, '신고 목록을 불러오지 못했습니다.');
    return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
  }
}

export async function submitReport(input: SubmitReportInput): Promise<ReportMutationResult> {
  try {
    const { data, error } = await getSupabaseClient().rpc('submit_report', {
      p_target_type: input.targetType,
      p_target_id: input.targetId,
      p_reason_code: input.reason,
      p_target_profile_id: input.targetProfileId ?? null,
      p_detail: input.detail ?? null,
    });

    if (error) {
      const normalizedError = normalizeModerationError(error, '신고를 접수하지 못했습니다.');
      return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row) {
      return { ok: false, error: '신고 접수 결과를 확인하지 못했습니다.' };
    }

    return {
      ok: true,
      report: mapSupabaseReportRow(row as SupabaseReportRow),
    };
  } catch (error) {
    const normalizedError = normalizeModerationError(error, '신고를 접수하지 못했습니다.');
    return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
  }
}

export async function listMyBlocks(): Promise<BlocksQueryResult> {
  try {
    const { data, error } = await getSupabaseClient().rpc('list_my_blocks');

    if (error) {
      const normalizedError = normalizeModerationError(
        error,
        '차단 목록을 불러오지 못했습니다.'
      );
      return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
    }

    return {
      ok: true,
      blocks: ((Array.isArray(data) ? data : []) as SupabaseBlockRow[]).map(mapSupabaseBlockRow),
    };
  } catch (error) {
    const normalizedError = normalizeModerationError(error, '차단 목록을 불러오지 못했습니다.');
    return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
  }
}

export async function blockProfileRemote(
  blockedProfileId: string
): Promise<BlockMutationResult> {
  try {
    const { data, error } = await getSupabaseClient().rpc('block_profile', {
      p_blocked_profile_id: blockedProfileId,
    });

    if (error) {
      const normalizedError = normalizeModerationError(error, '사용자를 차단하지 못했습니다.');
      return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row) {
      return { ok: false, error: '차단 결과를 확인하지 못했습니다.' };
    }

    return {
      ok: true,
      block: mapSupabaseBlockRow(row as SupabaseBlockRow),
    };
  } catch (error) {
    const normalizedError = normalizeModerationError(error, '사용자를 차단하지 못했습니다.');
    return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
  }
}

export async function unblockProfileRemote(
  blockedProfileId: string
): Promise<UnblockMutationResult> {
  try {
    const { error } = await getSupabaseClient().rpc('unblock_profile', {
      p_blocked_profile_id: blockedProfileId,
    });

    if (error) {
      const normalizedError = normalizeModerationError(error, '차단을 해제하지 못했습니다.');
      return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
    }

    return { ok: true };
  } catch (error) {
    const normalizedError = normalizeModerationError(error, '차단을 해제하지 못했습니다.');
    return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
  }
}

export async function applyModerationAction(
  input: ApplyModerationActionInput
): Promise<ModerationActionResult> {
  try {
    const { data, error } = await getSupabaseClient().rpc('apply_moderation_action', {
      p_action_type: input.actionType,
      p_target_type: input.targetType,
      p_target_id: input.targetId,
      p_note: input.note ?? null,
      p_report_id: input.reportId ?? null,
    });

    if (error) {
      const normalizedError = normalizeModerationError(
        error,
        '운영 조치를 적용하지 못했습니다.'
      );
      return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row) {
      return { ok: false, error: '운영 조치 결과를 확인하지 못했습니다.' };
    }

    return {
      ok: true,
      event: mapSupabaseModerationEventRow(row as SupabaseModerationEventRow),
    };
  } catch (error) {
    const normalizedError = normalizeModerationError(error, '운영 조치를 적용하지 못했습니다.');
    return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
  }
}
