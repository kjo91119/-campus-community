create table if not exists public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid null references public.profiles (id) on delete set null,
  action_type text not null check (
    action_type in (
      'report_reviewing',
      'report_resolved',
      'report_dismissed',
      'content_hidden',
      'content_restored',
      'user_restricted',
      'user_banned',
      'user_restored'
    )
  ),
  target_type text not null check (
    target_type in ('profile', 'post', 'comment', 'recruitment', 'report')
  ),
  target_id uuid not null,
  target_profile_id uuid null references public.profiles (id) on delete set null,
  report_id uuid null references public.reports (id) on delete set null,
  note text null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists moderation_events_target_idx
on public.moderation_events (target_type, target_id, created_at desc);

create index if not exists moderation_events_report_id_idx
on public.moderation_events (report_id)
where report_id is not null;

revoke all on public.moderation_events from authenticated;

alter table public.moderation_events enable row level security;

create or replace function public.apply_moderation_action(
  p_action_type text,
  p_target_type text,
  p_target_id uuid,
  p_note text default null,
  p_report_id uuid default null
)
returns public.moderation_events
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor public.profiles%rowtype;
  v_event public.moderation_events%rowtype;
  v_target_profile_id uuid;
  v_comment_post_id uuid;
  v_report public.reports%rowtype;
  v_report_id uuid;
  v_recruitment_post_id uuid;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select *
  into v_actor
  from public.profiles
  where id = auth.uid();

  if not found then
    raise exception '운영자 프로필을 찾을 수 없습니다.';
  end if;

  if v_actor.role not in ('moderator', 'admin') or v_actor.status = 'banned' then
    raise exception '운영 권한이 있는 사용자만 이 작업을 수행할 수 있습니다.';
  end if;

  if p_action_type in ('report_reviewing', 'report_resolved', 'report_dismissed') then
    if p_target_type <> 'report' then
      raise exception '신고 상태 변경은 report 대상에만 적용할 수 있습니다.';
    end if;

    update public.reports
    set
      status = case p_action_type
        when 'report_reviewing' then 'reviewing'
        when 'report_resolved' then 'resolved'
        when 'report_dismissed' then 'dismissed'
        else status
      end,
      reviewer_profile_id = auth.uid(),
      reviewed_at = case
        when p_action_type = 'report_reviewing' then null
        else timezone('utc', now())
      end
    where id = p_target_id
    returning * into v_report;

    if not found then
      raise exception '신고 대상을 찾을 수 없습니다.';
    end if;

    v_target_profile_id := v_report.target_profile_id;
    v_report_id := v_report.id;
  elsif p_action_type in ('content_hidden', 'content_restored') then
    if p_target_type = 'post' then
      update public.posts
      set status = case
        when p_action_type = 'content_hidden' then 'hidden'
        else 'published'
      end
      where id = p_target_id
      returning author_profile_id into v_target_profile_id;

      if not found then
        raise exception '대상 게시글을 찾을 수 없습니다.';
      end if;
    elsif p_target_type = 'comment' then
      update public.comments
      set status = case
        when p_action_type = 'content_hidden' then 'hidden'
        else 'published'
      end
      where id = p_target_id
      returning author_profile_id, post_id into v_target_profile_id, v_comment_post_id;

      if not found then
        raise exception '대상 댓글을 찾을 수 없습니다.';
      end if;

      update public.posts
      set comment_count = greatest(
        0,
        (
          select count(*)
          from public.comments comments
          where comments.post_id = v_comment_post_id
            and comments.status = 'published'
        )
      )
      where id = v_comment_post_id;
    elsif p_target_type = 'recruitment' then
      select recruitments.post_id
      into v_recruitment_post_id
      from public.recruitments recruitments
      where recruitments.id = p_target_id;

      if v_recruitment_post_id is null then
        raise exception '대상 모집글을 찾을 수 없습니다.';
      end if;

      update public.posts
      set status = case
        when p_action_type = 'content_hidden' then 'hidden'
        else 'published'
      end
      where id = v_recruitment_post_id
      returning author_profile_id into v_target_profile_id;
    else
      raise exception '콘텐츠 숨김/복구는 post, comment, recruitment 대상에만 적용할 수 있습니다.';
    end if;
  elsif p_action_type in ('user_restricted', 'user_banned', 'user_restored') then
    if p_target_type <> 'profile' then
      raise exception '사용자 제재는 profile 대상에만 적용할 수 있습니다.';
    end if;

    update public.profiles
    set status = case p_action_type
      when 'user_restricted' then 'restricted'
      when 'user_banned' then 'banned'
      when 'user_restored' then 'active'
      else status
    end
    where id = p_target_id
    returning id into v_target_profile_id;

    if not found then
      raise exception '대상 사용자를 찾을 수 없습니다.';
    end if;
  else
    raise exception '허용되지 않은 운영 액션입니다.';
  end if;

  if p_report_id is not null
    and p_action_type not in ('report_reviewing', 'report_resolved', 'report_dismissed') then
    update public.reports
    set
      status = 'resolved',
      reviewer_profile_id = auth.uid(),
      reviewed_at = timezone('utc', now())
    where id = p_report_id
      and target_type = p_target_type
      and target_id = p_target_id
    returning * into v_report;

    if not found then
      raise exception '현재 조치 대상과 연결된 신고를 찾을 수 없습니다.';
    end if;

    v_report_id := v_report.id;
    v_target_profile_id := coalesce(v_target_profile_id, v_report.target_profile_id);
  end if;

  insert into public.moderation_events (
    actor_profile_id,
    action_type,
    target_type,
    target_id,
    target_profile_id,
    report_id,
    note
  )
  values (
    auth.uid(),
    p_action_type,
    p_target_type,
    p_target_id,
    v_target_profile_id,
    coalesce(p_report_id, v_report_id),
    nullif(trim(coalesce(p_note, '')), '')
  )
  returning * into v_event;

  return v_event;
end;
$$;

grant execute
on function public.apply_moderation_action(text, text, uuid, text, uuid)
to authenticated;
