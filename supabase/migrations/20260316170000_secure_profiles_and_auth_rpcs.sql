revoke insert, update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
revoke insert on public.verifications from authenticated;
grant select on public.verifications to authenticated;

drop policy if exists "Users can submit own pending manual verification" on public.verifications;

create or replace function public.resolve_supported_university_id(p_email text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v_domain text;
begin
  if p_email is null or position('@' in p_email) = 0 then
    return null;
  end if;

  v_domain := split_part(lower(trim(p_email)), '@', 2);

  return case v_domain
    when 'yonsei.ac.kr' then 'yonsei'
    when 'konyang.ac.kr' then 'konyang'
    when 'dhc.ac.kr' then 'daegu-health'
    when 'eulji.ac.kr' then 'eulji'
    else null
  end;
end;
$$;

create or replace function public.is_supported_university_id(p_university_id text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select p_university_id in ('yonsei', 'konyang', 'daegu-health', 'eulji');
$$;

create or replace function public.is_supported_major_group_id(p_major_group_id text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select p_major_group_id in ('physical-therapy', 'occupational-therapy', 'radiology', 'clinical-pathology');
$$;

create or replace function public.complete_onboarding_profile(
  p_nickname text,
  p_primary_university_id text,
  p_primary_major_group_id text,
  p_major_label text
)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_profile public.profiles%rowtype;
  v_auth_email text;
  v_email_confirmed_at timestamptz;
  v_email_university_id text;
  v_locked_university_id text;
  v_next_nickname text;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  v_next_nickname := trim(coalesce(p_nickname, ''));

  if char_length(v_next_nickname) < 2 or char_length(v_next_nickname) > 12 then
    raise exception '닉네임은 2~12자여야 합니다.';
  end if;

  if v_next_nickname !~ '^[0-9A-Za-z가-힣_]+$' then
    raise exception '닉네임은 한글, 영문, 숫자, 밑줄만 사용할 수 있습니다.';
  end if;

  if p_primary_university_id is null or trim(p_primary_university_id) = '' then
    raise exception '학교 선택이 필요합니다.';
  end if;

  if not public.is_supported_university_id(p_primary_university_id) then
    raise exception '허용된 학교 목록에서 다시 선택해 주세요.';
  end if;

  if p_primary_major_group_id is null or trim(p_primary_major_group_id) = '' then
    raise exception '전공군 선택이 필요합니다.';
  end if;

  if not public.is_supported_major_group_id(p_primary_major_group_id) then
    raise exception '허용된 전공군 목록에서 다시 선택해 주세요.';
  end if;

  select email, email_confirmed_at
  into v_auth_email, v_email_confirmed_at
  from auth.users
  where id = auth.uid();

  v_email_university_id := public.resolve_supported_university_id(v_auth_email);

  insert into public.profiles (
    id,
    nickname
  )
  values (
    auth.uid(),
    v_next_nickname
  )
  on conflict (id) do nothing;

  select *
  into v_profile
  from public.profiles
  where id = auth.uid()
  for update;

  if not found then
    raise exception '프로필을 찾을 수 없습니다.';
  end if;

  if v_email_university_id is not null and v_email_confirmed_at is not null then
    v_locked_university_id := v_email_university_id;

    if p_primary_university_id is distinct from v_locked_university_id then
      raise exception '학교 이메일 기준으로 확인된 학교와 같은 학교를 선택해 주세요.';
    end if;

    update public.profiles
    set
      nickname = v_next_nickname,
      primary_university_id = v_locked_university_id,
      primary_major_group_id = p_primary_major_group_id,
      major_label = nullif(trim(p_major_label), ''),
      verification_status = 'verified',
      onboarding_completed_at = timezone('utc', now())
    where id = auth.uid()
    returning * into v_profile;

    return v_profile;
  end if;

  if v_profile.verification_status <> 'verified' then
    raise exception '인증 완료 후 온보딩을 진행할 수 있습니다.';
  end if;

  v_locked_university_id := coalesce(v_profile.primary_university_id, p_primary_university_id);

  if p_primary_university_id is distinct from v_locked_university_id then
    raise exception '인증된 학교와 같은 학교를 선택해 주세요.';
  end if;

  update public.profiles
  set
    nickname = v_next_nickname,
    primary_university_id = v_locked_university_id,
    primary_major_group_id = p_primary_major_group_id,
    major_label = nullif(trim(p_major_label), ''),
    onboarding_completed_at = timezone('utc', now())
  where id = auth.uid()
  returning * into v_profile;

  return v_profile;
end;
$$;

grant execute
on function public.complete_onboarding_profile(text, text, text, text)
to authenticated;

create or replace function public.submit_manual_verification_request(
  p_university_id text
)
returns public.verifications
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_profile public.profiles%rowtype;
  v_auth_email text;
  v_email_university_id text;
  v_inserted public.verifications%rowtype;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not public.is_supported_university_id(p_university_id) then
    raise exception '허용된 학교 목록에서 다시 선택해 주세요.';
  end if;

  select email
  into v_auth_email
  from auth.users
  where id = auth.uid();

  v_email_university_id := public.resolve_supported_university_id(v_auth_email);

  if v_email_university_id is not null then
    raise exception '지원 학교 이메일이 있는 계정은 학교 이메일 인증 경로를 먼저 사용해 주세요.';
  end if;

  insert into public.profiles (
    id,
    nickname
  )
  values (
    auth.uid(),
    coalesce(nullif(left(split_part(coalesce(v_auth_email, ''), '@', 1), 16), ''), '새내기익명')
  )
  on conflict (id) do nothing;

  select *
  into v_profile
  from public.profiles
  where id = auth.uid()
  for update;

  if not found then
    raise exception '프로필을 찾을 수 없습니다.';
  end if;

  if v_profile.status <> 'active' then
    raise exception '현재 계정 상태로는 학생증 수동 인증을 제출할 수 없습니다.';
  end if;

  if v_profile.verification_status not in ('unverified', 'rejected') then
    raise exception '현재 상태에서는 학생증 수동 인증을 다시 제출할 수 없습니다.';
  end if;

  if exists (
    select 1
    from public.verifications existing
    where existing.profile_id = auth.uid()
      and existing.method = 'student_id_manual'
      and existing.status = 'pending'
  ) then
    raise exception '이미 검토 중인 학생증 수동 인증 요청이 있습니다.';
  end if;

  update public.profiles
  set
    primary_university_id = p_university_id,
    verification_status = 'pending'
  where id = auth.uid()
  returning * into v_profile;

  insert into public.verifications (
    profile_id,
    method,
    university_id,
    status
  )
  values (
    auth.uid(),
    'student_id_manual',
    p_university_id,
    'pending'
  )
  returning * into v_inserted;

  return v_inserted;
end;
$$;

grant execute
on function public.submit_manual_verification_request(text)
to authenticated;
