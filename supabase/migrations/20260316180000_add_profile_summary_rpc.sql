create or replace function public.list_profile_summaries(
  p_profile_ids uuid[]
)
returns table (
  id uuid,
  nickname text,
  primary_university_id text,
  primary_major_group_id text,
  verification_status text
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not exists (
    select 1
    from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.verification_status = 'verified'
      and viewer.status <> 'banned'
  ) then
    raise exception '인증된 사용자만 작성자 정보를 조회할 수 있습니다.';
  end if;

  if p_profile_ids is null or coalesce(array_length(p_profile_ids, 1), 0) = 0 then
    return;
  end if;

  return query
  select
    profiles.id,
    profiles.nickname,
    profiles.primary_university_id,
    profiles.primary_major_group_id,
    profiles.verification_status
  from public.profiles
  where profiles.id = any (p_profile_ids)
    and profiles.status <> 'banned';
end;
$$;

grant execute
on function public.list_profile_summaries(uuid[])
to authenticated;
