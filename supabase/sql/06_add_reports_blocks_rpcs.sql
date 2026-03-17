create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_profile_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'recruitment', 'profile')),
  target_id uuid not null,
  target_profile_id uuid null references public.profiles (id) on delete set null,
  reason_code text not null check (
    reason_code in ('abuse', 'hate', 'sexual', 'spam', 'misinformation', 'impersonation', 'scam')
  ),
  detail text null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  reviewer_profile_id uuid null references public.profiles (id) on delete set null,
  reviewed_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_profile_id uuid not null references public.profiles (id) on delete cascade,
  blocked_profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint blocks_no_self_block check (blocker_profile_id <> blocked_profile_id)
);

create index if not exists reports_reporter_profile_id_idx on public.reports (reporter_profile_id);
create index if not exists reports_target_type_target_id_idx on public.reports (target_type, target_id);
create index if not exists reports_status_created_at_idx on public.reports (status, created_at desc);
create unique index if not exists blocks_unique_relationship_idx
on public.blocks (blocker_profile_id, blocked_profile_id);
create index if not exists blocks_blocker_profile_id_idx on public.blocks (blocker_profile_id);

revoke all on public.reports from authenticated;
grant select on public.reports to authenticated;
revoke all on public.blocks from authenticated;
grant select on public.blocks to authenticated;

alter table public.reports enable row level security;
alter table public.blocks enable row level security;

drop policy if exists "Users can read own reports" on public.reports;
create policy "Users can read own reports"
on public.reports
for select
to authenticated
using (auth.uid() = reporter_profile_id);

drop policy if exists "Users can read own blocks" on public.blocks;
create policy "Users can read own blocks"
on public.blocks
for select
to authenticated
using (auth.uid() = blocker_profile_id);

create or replace function public.submit_report(
  p_target_type text,
  p_target_id uuid,
  p_reason_code text,
  p_target_profile_id uuid default null,
  p_detail text default null
)
returns public.reports
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_viewer public.profiles%rowtype;
  v_target_profile_id uuid;
  v_report public.reports%rowtype;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select *
  into v_viewer
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception '프로필을 찾을 수 없습니다.';
  end if;

  if v_viewer.verification_status <> 'verified' or v_viewer.status = 'banned' then
    raise exception '인증된 사용자만 신고를 제출할 수 있습니다.';
  end if;

  if p_reason_code not in ('abuse', 'hate', 'sexual', 'spam', 'misinformation', 'impersonation', 'scam') then
    raise exception '허용된 신고 사유를 다시 선택해 주세요.';
  end if;

  if p_target_type = 'profile' then
    select profiles.id
    into v_target_profile_id
    from public.profiles profiles
    where profiles.id = coalesce(p_target_profile_id, p_target_id);
  elsif p_target_type = 'post' then
    select posts.author_profile_id
    into v_target_profile_id
    from public.posts posts
    where posts.id = p_target_id
      and posts.status in ('published', 'hidden');
  elsif p_target_type = 'comment' then
    select comments.author_profile_id
    into v_target_profile_id
    from public.comments comments
    where comments.id = p_target_id
      and comments.status in ('published', 'hidden');
  elsif p_target_type = 'recruitment' then
    select posts.author_profile_id
    into v_target_profile_id
    from public.recruitments recruitments
    join public.posts posts
      on posts.id = recruitments.post_id
    where recruitments.id = p_target_id
      and posts.status in ('published', 'hidden');
  else
    raise exception '허용되지 않은 신고 대상입니다.';
  end if;

  if v_target_profile_id is null then
    raise exception '신고 대상을 찾을 수 없습니다.';
  end if;

  if v_target_profile_id = auth.uid() then
    raise exception '본인 콘텐츠와 본인 프로필은 신고할 수 없습니다.';
  end if;

  insert into public.reports (
    reporter_profile_id,
    target_type,
    target_id,
    target_profile_id,
    reason_code,
    detail,
    status
  )
  values (
    auth.uid(),
    p_target_type,
    p_target_id,
    v_target_profile_id,
    p_reason_code,
    nullif(trim(coalesce(p_detail, '')), ''),
    'open'
  )
  returning * into v_report;

  return v_report;
end;
$$;

grant execute
on function public.submit_report(text, uuid, text, uuid, text)
to authenticated;

create or replace function public.list_my_reports()
returns setof public.reports
language sql
security definer
set search_path = public, auth
as $$
  select reports.*
  from public.reports reports
  where reports.reporter_profile_id = auth.uid()
  order by reports.created_at desc;
$$;

grant execute
on function public.list_my_reports()
to authenticated;

create or replace function public.block_profile(
  p_blocked_profile_id uuid
)
returns public.blocks
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_viewer public.profiles%rowtype;
  v_block public.blocks%rowtype;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if p_blocked_profile_id is null then
    raise exception '차단할 사용자를 다시 확인해 주세요.';
  end if;

  if p_blocked_profile_id = auth.uid() then
    raise exception '자기 자신은 차단할 수 없습니다.';
  end if;

  select *
  into v_viewer
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception '프로필을 찾을 수 없습니다.';
  end if;

  if v_viewer.verification_status <> 'verified' or v_viewer.status = 'banned' then
    raise exception '인증된 사용자만 차단 기능을 사용할 수 있습니다.';
  end if;

  if not exists (
    select 1
    from public.profiles blocked
    where blocked.id = p_blocked_profile_id
  ) then
    raise exception '차단할 사용자를 찾을 수 없습니다.';
  end if;

  insert into public.blocks (
    blocker_profile_id,
    blocked_profile_id
  )
  values (
    auth.uid(),
    p_blocked_profile_id
  )
  on conflict (blocker_profile_id, blocked_profile_id)
  do update set created_at = timezone('utc', now())
  returning * into v_block;

  return v_block;
end;
$$;

grant execute
on function public.block_profile(uuid)
to authenticated;

create or replace function public.unblock_profile(
  p_blocked_profile_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_deleted_id uuid;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  delete from public.blocks
  where blocker_profile_id = auth.uid()
    and blocked_profile_id = p_blocked_profile_id
  returning id into v_deleted_id;

  return v_deleted_id is not null;
end;
$$;

grant execute
on function public.unblock_profile(uuid)
to authenticated;

create or replace function public.list_my_blocks()
returns setof public.blocks
language sql
security definer
set search_path = public, auth
as $$
  select blocks.*
  from public.blocks blocks
  where blocks.blocker_profile_id = auth.uid()
  order by blocks.created_at desc;
$$;

grant execute
on function public.list_my_blocks()
to authenticated;
