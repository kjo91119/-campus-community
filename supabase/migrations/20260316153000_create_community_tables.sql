create table if not exists public.boards (
  id text primary key,
  slug text not null unique,
  title text not null,
  description text not null,
  scope_type text not null check (scope_type in ('network', 'major_group', 'university')),
  visibility text not null check (visibility in ('verified_all', 'verified_same_university')),
  major_group_id text null,
  university_id text null,
  post_type_default text null check (post_type_default in ('general', 'question', 'recruitment')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.boards (
  id,
  slug,
  title,
  description,
  scope_type,
  visibility,
  major_group_id,
  university_id,
  post_type_default,
  is_active
)
values
  (
    'network-home',
    'home',
    '통합 홈',
    '보건의료기사 계열 4개 전공군의 최신 글을 한 번에 보는 피드',
    'network',
    'verified_all',
    null,
    null,
    'general',
    true
  ),
  (
    'major-physical-therapy',
    'physical-therapy',
    '물리치료 게시판',
    '물리치료 전공군 중심 질문, 실습, 국시 이야기를 모아보는 보드',
    'major_group',
    'verified_all',
    'physical-therapy',
    null,
    'general',
    true
  ),
  (
    'major-occupational-therapy',
    'occupational-therapy',
    '작업치료 게시판',
    '작업치료 전공군 중심 질문, 실습, 국시 이야기를 모아보는 보드',
    'major_group',
    'verified_all',
    'occupational-therapy',
    null,
    'general',
    true
  ),
  (
    'major-radiology',
    'radiology',
    '방사선 게시판',
    '방사선 전공군 중심 질문, 실습, 국시 이야기를 모아보는 보드',
    'major_group',
    'verified_all',
    'radiology',
    null,
    'general',
    true
  ),
  (
    'major-clinical-pathology',
    'clinical-pathology',
    '임상병리 게시판',
    '임상병리 전공군 중심 질문, 실습, 국시 이야기를 모아보는 보드',
    'major_group',
    'verified_all',
    'clinical-pathology',
    null,
    'general',
    true
  ),
  (
    'school-yonsei',
    'yonsei',
    '연세대학교 게시판',
    '같은 학교 인증 사용자만 볼 수 있는 제한형 보드',
    'university',
    'verified_same_university',
    null,
    'yonsei',
    'general',
    true
  ),
  (
    'school-konyang',
    'konyang',
    '건양대학교 게시판',
    '같은 학교 인증 사용자만 볼 수 있는 제한형 보드',
    'university',
    'verified_same_university',
    null,
    'konyang',
    'general',
    true
  ),
  (
    'school-daegu-health',
    'daegu-health',
    '대구보건대학교 게시판',
    '같은 학교 인증 사용자만 볼 수 있는 제한형 보드',
    'university',
    'verified_same_university',
    null,
    'daegu-health',
    'general',
    true
  ),
  (
    'school-eulji',
    'eulji',
    '을지대학교 게시판',
    '같은 학교 인증 사용자만 볼 수 있는 제한형 보드',
    'university',
    'verified_same_university',
    null,
    'eulji',
    'general',
    true
  )
on conflict (id) do update
set
  slug = excluded.slug,
  title = excluded.title,
  description = excluded.description,
  scope_type = excluded.scope_type,
  visibility = excluded.visibility,
  major_group_id = excluded.major_group_id,
  university_id = excluded.university_id,
  post_type_default = excluded.post_type_default,
  is_active = excluded.is_active;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  board_id text not null references public.boards (id) on delete restrict,
  author_profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  category text not null check (
    category in ('practice', 'exam', 'career', 'qna', 'free', 'recruitment')
  ),
  post_type text not null check (post_type in ('general', 'question', 'recruitment')),
  status text not null default 'published' check (status in ('published', 'hidden', 'deleted')),
  major_group_id text null,
  university_id text null,
  recruitment_id uuid null unique,
  is_anonymous boolean not null default true,
  comment_count integer not null default 0 check (comment_count >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recruitments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.posts (id) on delete cascade,
  recruitment_type text not null check (
    recruitment_type in ('study', 'assignment', 'contest', 'project')
  ),
  status text not null default 'open' check (status in ('open', 'closed', 'completed')),
  headcount integer null check (headcount is null or headcount between 2 and 20),
  mode text null check (mode in ('online', 'offline', 'hybrid')),
  deadline_at timestamptz null,
  preferred_major_group_id text null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.posts
drop constraint if exists posts_recruitment_id_fkey;

alter table public.posts
add constraint posts_recruitment_id_fkey
foreign key (recruitment_id)
references public.recruitments (id)
on delete set null;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_profile_id uuid not null references public.profiles (id) on delete cascade,
  parent_comment_id uuid null references public.comments (id) on delete cascade,
  depth smallint not null default 1 check (depth in (1, 2)),
  body text not null,
  status text not null default 'published' check (status in ('published', 'hidden', 'deleted')),
  kind text not null default 'general' check (kind in ('general', 'recruitment_intent')),
  is_anonymous boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists posts_board_id_idx on public.posts (board_id);
create index if not exists posts_major_group_id_idx on public.posts (major_group_id);
create index if not exists posts_university_id_idx on public.posts (university_id);
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists comments_post_id_idx on public.comments (post_id);
create index if not exists comments_created_at_idx on public.comments (created_at asc);
create index if not exists recruitments_status_idx on public.recruitments (status);
create index if not exists recruitments_preferred_major_group_id_idx on public.recruitments (preferred_major_group_id);
create index if not exists recruitments_created_at_idx on public.recruitments (created_at desc);

create or replace function public.handle_posts_comment_count_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published' then
    update public.posts
    set comment_count = comment_count + 1
    where id = new.post_id;
  end if;

  return new;
end;
$$;

drop trigger if exists comments_increment_post_comment_count on public.comments;

create trigger comments_increment_post_comment_count
after insert on public.comments
for each row
execute function public.handle_posts_comment_count_after_insert();

create or replace function public.create_recruitment_with_post(
  p_board_id text,
  p_title text,
  p_body text,
  p_major_group_id text,
  p_university_id text,
  p_is_anonymous boolean,
  p_recruitment_type text,
  p_headcount integer,
  p_mode text,
  p_deadline_at timestamptz,
  p_preferred_major_group_id text
)
returns table (
  post_id uuid,
  recruitment_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_post_id uuid;
  v_recruitment_id uuid;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select *
  into v_profile
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception '프로필을 찾을 수 없습니다.';
  end if;

  if v_profile.verification_status <> 'verified' or v_profile.status <> 'active' then
    raise exception '모집글을 작성할 권한이 없습니다.';
  end if;

  if p_university_id is not null and v_profile.primary_university_id is distinct from p_university_id then
    raise exception '다른 학교 게시판에는 모집글을 작성할 수 없습니다.';
  end if;

  insert into public.posts (
    board_id,
    author_profile_id,
    title,
    body,
    category,
    post_type,
    status,
    major_group_id,
    university_id,
    is_anonymous
  )
  values (
    p_board_id,
    auth.uid(),
    p_title,
    p_body,
    'recruitment',
    'recruitment',
    'published',
    p_major_group_id,
    p_university_id,
    coalesce(p_is_anonymous, true)
  )
  returning id into v_post_id;

  insert into public.recruitments (
    post_id,
    recruitment_type,
    status,
    headcount,
    mode,
    deadline_at,
    preferred_major_group_id
  )
  values (
    v_post_id,
    p_recruitment_type,
    'open',
    p_headcount,
    p_mode,
    p_deadline_at,
    p_preferred_major_group_id
  )
  returning id into v_recruitment_id;

  update public.posts
  set recruitment_id = v_recruitment_id
  where id = v_post_id;

  return query
  select v_post_id, v_recruitment_id;
end;
$$;

grant execute
on function public.create_recruitment_with_post(
  text,
  text,
  text,
  text,
  text,
  boolean,
  text,
  integer,
  text,
  timestamptz,
  text
)
to authenticated;

alter table public.boards enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.recruitments enable row level security;

drop policy if exists "Verified users can read boards" on public.boards;
create policy "Verified users can read boards"
on public.boards
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles profiles
    where profiles.id = auth.uid()
      and profiles.verification_status = 'verified'
      and profiles.status <> 'banned'
      and (
        boards.university_id is null
        or boards.university_id = profiles.primary_university_id
      )
  )
);

drop policy if exists "Verified users can read posts" on public.posts;
create policy "Verified users can read posts"
on public.posts
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles profiles
    where profiles.id = auth.uid()
      and profiles.verification_status = 'verified'
      and profiles.status <> 'banned'
      and (
        posts.university_id is null
        or posts.university_id = profiles.primary_university_id
      )
  )
);

drop policy if exists "Verified active users can create posts" on public.posts;
create policy "Verified active users can create posts"
on public.posts
for insert
to authenticated
with check (
  author_profile_id = auth.uid()
  and exists (
    select 1
    from public.profiles profiles
    where profiles.id = auth.uid()
      and profiles.verification_status = 'verified'
      and profiles.status = 'active'
      and (
        posts.university_id is null
        or posts.university_id = profiles.primary_university_id
      )
  )
);

drop policy if exists "Verified users can read comments on accessible posts" on public.comments;
create policy "Verified users can read comments on accessible posts"
on public.comments
for select
to authenticated
using (
  exists (
    select 1
    from public.posts
    join public.profiles profiles
      on profiles.id = auth.uid()
    where posts.id = comments.post_id
      and profiles.verification_status = 'verified'
      and profiles.status <> 'banned'
      and (
        posts.university_id is null
        or posts.university_id = profiles.primary_university_id
      )
  )
);

drop policy if exists "Verified active users can create comments on accessible posts" on public.comments;
create policy "Verified active users can create comments on accessible posts"
on public.comments
for insert
to authenticated
with check (
  author_profile_id = auth.uid()
  and exists (
    select 1
    from public.posts
    join public.profiles profiles
      on profiles.id = auth.uid()
    where posts.id = comments.post_id
      and profiles.verification_status = 'verified'
      and profiles.status = 'active'
      and (
        posts.university_id is null
        or posts.university_id = profiles.primary_university_id
      )
  )
);

drop policy if exists "Verified users can read recruitments on accessible posts" on public.recruitments;
create policy "Verified users can read recruitments on accessible posts"
on public.recruitments
for select
to authenticated
using (
  exists (
    select 1
    from public.posts
    join public.profiles profiles
      on profiles.id = auth.uid()
    where posts.id = recruitments.post_id
      and profiles.verification_status = 'verified'
      and profiles.status <> 'banned'
      and (
        posts.university_id is null
        or posts.university_id = profiles.primary_university_id
      )
  )
);
