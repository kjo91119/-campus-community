import type { Profile } from '@/types/domain';
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
  id: string;
  nickname: string;
  role: Profile['role'];
  status: Profile['accountStatus'];
  primary_university_id: string | null;
  primary_major_group_id: string | null;
  major_label: string | null;
  verification_status: Profile['verificationStatus'];
  onboarding_completed_at: string | null;
};

type ProfileQueryResult = {
  ok: boolean;
  profile?: Profile;
  error?: string;
};

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
    id: profile.id,
    nickname: profile.nickname,
    role: profile.role,
    status: profile.accountStatus,
    primary_university_id: profile.primaryUniversityId ?? null,
    primary_major_group_id: profile.primaryMajorGroupId ?? null,
    major_label: profile.majorLabel ?? null,
    verification_status: profile.verificationStatus,
    onboarding_completed_at: profile.onboardingCompletedAt ?? null,
  };
}

function normalizeProfileError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return '프로필 저장소에서 알 수 없는 오류가 발생했습니다.';
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
      return { ok: false, error: normalizeProfileError(error) };
    }

    if (!data) {
      return { ok: true };
    }

    return {
      ok: true,
      profile: mapProfileRowToProfile(data),
    };
  } catch (error) {
    return { ok: false, error: normalizeProfileError(error) };
  }
}

export async function upsertProfile(profile: Profile): Promise<ProfileQueryResult> {
  try {
    const { data, error } = await profilesQuery()
      .upsert(mapProfileToUpsertInput(profile), {
        onConflict: 'id',
      })
      .select('*')
      .single<SupabaseProfileRow>();

    if (error) {
      return { ok: false, error: normalizeProfileError(error) };
    }

    return {
      ok: true,
      profile: mapProfileRowToProfile(data),
    };
  } catch (error) {
    return { ok: false, error: normalizeProfileError(error) };
  }
}
