-- Phase 1 기본 verifications 스키마 초안.
-- 최종 클라이언트 권한과 RPC 기반 제출 경로는 04_secure_profiles_and_auth_rpcs.sql에서 잠긴다.
-- 따라서 이 파일만 단독으로 해석하지 말고, 실제 적용 시에는 03 -> 04 순서로 함께 실행해야 한다.

create table if not exists public.verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  method text not null check (method in ('email', 'student_id_manual')),
  university_id text null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_profile_id uuid null references public.profiles (id) on delete set null,
  evidence_url text null,
  rejection_reason text null,
  submitted_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz null
);

alter table public.verifications
drop constraint if exists verifications_manual_requires_university_id;

alter table public.verifications
add constraint verifications_manual_requires_university_id
check (
  method <> 'student_id_manual'
  or university_id is not null
);

create index if not exists verifications_profile_id_idx on public.verifications (profile_id);
create index if not exists verifications_status_idx on public.verifications (status);
create index if not exists verifications_submitted_at_idx on public.verifications (submitted_at desc);
create unique index if not exists verifications_manual_pending_unique_idx
on public.verifications (profile_id)
where method = 'student_id_manual' and status = 'pending';

grant select on public.verifications to authenticated;

alter table public.verifications enable row level security;

drop policy if exists "Users can read own verifications" on public.verifications;
create policy "Users can read own verifications"
on public.verifications
for select
to authenticated
using (auth.uid() = profile_id);

drop policy if exists "Users can submit own pending manual verification" on public.verifications;
create policy "Users can submit own pending manual verification"
on public.verifications
for insert
to authenticated
with check (
  auth.uid() = profile_id
  and method = 'student_id_manual'
  and status = 'pending'
  and university_id is not null
  and reviewer_profile_id is null
  and reviewed_at is null
  and exists (
    select 1
    from public.profiles profiles
    where profiles.id = auth.uid()
      and profiles.status = 'active'
      and profiles.verification_status in ('unverified', 'rejected')
      and (
        profiles.primary_university_id is null
        or profiles.primary_university_id = verifications.university_id
      )
  )
  and not exists (
    select 1
    from public.verifications existing
    where existing.profile_id = auth.uid()
      and existing.method = 'student_id_manual'
      and existing.status = 'pending'
  )
);
