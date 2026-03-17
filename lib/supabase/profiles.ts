import type {
  Profile,
  ProfileSummary,
} from '@/types/domain';
import { getSupabaseClient } from '@/lib/supabase/client';
import { SUPABASE_TABLES } from '@/lib/supabase/tables';

type SupabaseProfileRow = {
  id: string;
  nickname: string;
  role: Profile['role'];
  status: Profile['accountStatus'];
  primary_university_id: string | null;
  primary_major_group_id: string | null;
  major_label: string | null;
  verification_status: Profile['verificationStatus'];
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type UpsertProfileInput = {
  nickname: string;
  primary_university_id: string;
  primary_major_group_id: string | null;
  major_label: string | null;
};

type ProfileErrorKind = 'network' | 'server_rejected' | 'unknown';

type CompleteOnboardingProfileResult = {
  ok: boolean;
  profile?: Profile;
  error?: string;
  errorKind?: ProfileErrorKind;
};

type ProfileQueryResult = {
  ok: boolean;
  profile?: Profile;
  error?: string;
  errorKind?: ProfileErrorKind;
};

type SupabaseProfileSummaryRow = {
  id: string;
  nickname: string;
  primary_university_id: string | null;
  primary_major_group_id: string | null;
  verification_status: ProfileSummary['verificationStatus'];
};

type ProfileSummariesQueryResult = {
  ok: boolean;
  profiles?: ProfileSummary[];
  error?: string;
  errorKind?: ProfileErrorKind;
};

const PROFILE_ID_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mapProfileRowToProfile(row: SupabaseProfileRow): Profile {
  return {
    id: row.id,
    nickname: row.nickname,
    role: row.role,
    verificationStatus: row.verification_status,
    accountStatus: row.status,
    onboardingCompleted: Boolean(row.onboarding_completed_at),
    onboardingCompletedAt: row.onboarding_completed_at ?? undefined,
    primaryUniversityId: row.primary_university_id ?? undefined,
    primaryMajorGroupId: row.primary_major_group_id ?? undefined,
    majorLabel: row.major_label ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProfileToUpsertInput(profile: Profile): UpsertProfileInput {
  return {
    nickname: profile.nickname,
    primary_university_id: profile.primaryUniversityId ?? '',
    primary_major_group_id: profile.primaryMajorGroupId ?? null,
    major_label: profile.majorLabel ?? null,
  };
}

function mapProfileToSummary(profile: Profile): ProfileSummary {
  return {
    id: profile.id,
    nickname: profile.nickname,
    primaryUniversityId: profile.primaryUniversityId,
    primaryMajorGroupId: profile.primaryMajorGroupId,
    verificationStatus: profile.verificationStatus,
  };
}

function mapProfileSummaryRow(row: SupabaseProfileSummaryRow): ProfileSummary {
  return {
    id: row.id,
    nickname: row.nickname,
    primaryUniversityId: row.primary_university_id ?? undefined,
    primaryMajorGroupId: row.primary_major_group_id ?? undefined,
    verificationStatus: row.verification_status,
  };
}

function detectProfileErrorKind(error: unknown): ProfileErrorKind {
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

function isUuid(value?: string) {
  return Boolean(value && PROFILE_ID_UUID_PATTERN.test(value));
}

function normalizeProfileError(error: unknown) {
  const kind = detectProfileErrorKind(error);

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
    message: '프로필 저장소에서 알 수 없는 오류가 발생했습니다.',
  };
}

function profilesQuery() {
  return getSupabaseClient().from(SUPABASE_TABLES.profiles);
}

export async function getProfileById(profileId: string): Promise<ProfileQueryResult> {
  try {
    const { data, error } = await profilesQuery()
      .select('*')
      .eq('id', profileId)
      .maybeSingle<SupabaseProfileRow>();

    if (error) {
      const normalizedError = normalizeProfileError(error);
      return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
    }

    if (!data) {
      return { ok: true };
    }

    return {
      ok: true,
      profile: mapProfileRowToProfile(data),
    };
  } catch (error) {
    const normalizedError = normalizeProfileError(error);
    return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
  }
}

export async function completeOnboardingProfile(
  profile: Profile
): Promise<CompleteOnboardingProfileResult> {
  try {
    const payload = mapProfileToUpsertInput(profile);
    const { data, error } = await getSupabaseClient().rpc('complete_onboarding_profile', {
      p_nickname: payload.nickname,
      p_primary_university_id: payload.primary_university_id,
      p_primary_major_group_id: payload.primary_major_group_id,
      p_major_label: payload.major_label,
    });

    if (error) {
      const normalizedError = normalizeProfileError(error);
      return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row) {
      return { ok: false, error: '온보딩 프로필 저장 결과를 찾을 수 없습니다.' };
    }

    return {
      ok: true,
      profile: mapProfileRowToProfile(row as SupabaseProfileRow),
    };
  } catch (error) {
    const normalizedError = normalizeProfileError(error);
    return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
  }
}

export async function listProfileSummariesByIds(
  profileIds: string[]
): Promise<ProfileSummariesQueryResult> {
  const uniqueProfileIds = [...new Set(profileIds)].filter(isUuid);

  if (uniqueProfileIds.length === 0) {
    return { ok: true, profiles: [] };
  }

  try {
    const { data, error } = await getSupabaseClient().rpc('list_profile_summaries', {
      p_profile_ids: uniqueProfileIds,
    });

    if (error) {
      const normalizedError = normalizeProfileError(error);
      return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
    }

    return {
      ok: true,
      profiles: ((Array.isArray(data) ? data : []) as SupabaseProfileSummaryRow[]).map(
        mapProfileSummaryRow
      ),
    };
  } catch (error) {
    const normalizedError = normalizeProfileError(error);
    return { ok: false, error: normalizedError.message, errorKind: normalizedError.kind };
  }
}

export function toProfileSummary(profile: Profile): ProfileSummary {
  return mapProfileToSummary(profile);
}
