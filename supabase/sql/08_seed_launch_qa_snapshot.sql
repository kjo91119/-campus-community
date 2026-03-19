-- Launch / QA baseline snapshot seed
--
-- 사용법:
-- 1) 아래 4개 이메일을 실제 verified QA 계정 이메일로 바꾼다.
-- 2) boards / profiles / recruitments 관련 migration과 SQL이 이미 적용된 환경에서 실행한다.
-- 3) deterministic baseline을 다시 맞추려면 09_reset_launch_qa_snapshot.sql을 먼저 실행한 뒤 이 파일을 다시 실행한다.
-- 4) SQL editor에서 이 파일 전체를 한 번에 실행한다. 중간 구문만 잘라 실행하지 않는다.
--
-- 주의:
-- - 이 파일은 auth.users를 직접 만들지 않는다.
-- - 이 파일은 temporary table을 사용하므로 한 editor/session 안에서 파일 전체를 실행하는 것을 권장한다.
-- - 먼저 실제 QA 계정으로 회원가입/인증/온보딩을 끝내 `profiles` row를 준비해야 한다.
-- - reset 없이 재실행하면 seeded post 바깥에서 추가한 QA 댓글이 남아 `comment_count`가 baseline보다 커질 수 있다.
-- - 이 스냅샷은 런치 직전 QA baseline 용도다. 실제 공개 beta 밀도는 docs/36-launch-readiness-guide.md 기준으로 추가 시딩이 필요하다.

drop table if exists temp_launch_seed_profile_map;
create temporary table temp_launch_seed_profile_map (
  seed_key text primary key,
  email text not null,
  university_id text not null,
  major_group_id text not null
);

insert into temp_launch_seed_profile_map (
  seed_key,
  email,
  university_id,
  major_group_id
)
values
  ('yonsei_pt', 'kjo931119+yonsei@gmail.com', 'yonsei', 'physical-therapy'),
  ('konyang_ot', 'kjo931119+konyang@gmail.com', 'konyang', 'occupational-therapy'),
  ('daegu_rad', 'kjo931119+daegu@gmail.com', 'daegu-health', 'radiology'),
  ('eulji_cp', 'kjo931119+eulji@gmail.com', 'eulji', 'clinical-pathology');

drop table if exists temp_launch_seed_profiles;
create temporary table temp_launch_seed_profiles as
select
  map.seed_key,
  profiles.id as profile_id,
  profiles.nickname
from temp_launch_seed_profile_map map
join auth.users users
  on lower(users.email) = lower(map.email)
join public.profiles profiles
  on profiles.id = users.id
where profiles.verification_status = 'verified'
  and profiles.status = 'active'
  and profiles.primary_university_id = map.university_id
  and profiles.primary_major_group_id = map.major_group_id;

do $$
declare
  v_missing_profiles text;
  v_missing_boards text;
begin
  select string_agg(required.seed_key, ', ' order by required.seed_key)
  into v_missing_profiles
  from (
    values ('yonsei_pt'), ('konyang_ot'), ('daegu_rad'), ('eulji_cp')
  ) as required(seed_key)
  where not exists (
    select 1
    from temp_launch_seed_profiles profiles
    where profiles.seed_key = required.seed_key
  );

  if v_missing_profiles is not null then
    raise exception '필수 QA 시드 프로필이 없습니다: %. 이메일, verified 상태, 학교/전공군 매핑을 확인해 주세요.', v_missing_profiles;
  end if;

  select string_agg(required.board_id, ', ' order by required.board_id)
  into v_missing_boards
  from (
    values
      ('network-home'),
      ('major-physical-therapy'),
      ('major-occupational-therapy'),
      ('major-radiology'),
      ('major-clinical-pathology'),
      ('school-yonsei'),
      ('school-konyang'),
      ('school-daegu-health'),
      ('school-eulji')
  ) as required(board_id)
  where not exists (
    select 1
    from public.boards boards
    where boards.id = required.board_id
      and boards.is_active = true
  );

  if v_missing_boards is not null then
    raise exception '필수 board가 없거나 비활성화되어 있습니다: %', v_missing_boards;
  end if;
end;
$$;

with seed_posts (
  id,
  author_key,
  board_id,
  title,
  body,
  category,
  post_type,
  major_group_id,
  university_id,
  is_anonymous,
  created_at
) as (
  values
    ('00000000-0000-4000-8000-000000001001'::uuid, 'yonsei_pt', 'network-home', '실습 첫 주 체크리스트 정리', '실습복, 필수 준비물, 첫 실습일 메모 포인트를 한 번에 정리했습니다.', 'practice', 'general', 'physical-therapy', null, true, '2026-03-14T10:00:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001002'::uuid, 'yonsei_pt', 'network-home', '물리치료 케이스 발표 순서 팁', '케이스 발표 때 서론-평가-중재-회고 순서로 말하면 훨씬 안정적이었습니다.', 'qna', 'question', 'physical-therapy', null, true, '2026-03-14T08:40:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001003'::uuid, 'konyang_ot', 'network-home', '작업치료 국시 회독 루틴 공유', '과목별 1회독과 문제풀이 타이밍을 어떻게 잡았는지 정리했습니다.', 'exam', 'general', 'occupational-therapy', null, true, '2026-03-14T07:50:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001004'::uuid, 'konyang_ot', 'network-home', '평가도구 암기할 때 좋은 방식 있나요?', '이름만 외우면 금방 헷갈려서 표로 정리하는 방식을 같이 찾고 싶습니다.', 'qna', 'question', 'occupational-therapy', null, true, '2026-03-13T20:20:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001005'::uuid, 'daegu_rad', 'network-home', '방사선 실습복 구매 전에 볼 것', '원단 두께, 포켓 위치, 세탁 편의성을 먼저 보면 실패가 적었습니다.', 'practice', 'general', 'radiology', null, true, '2026-03-13T18:10:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001006'::uuid, 'daegu_rad', 'network-home', '촬영 포지셔닝 연습은 어디서 하나요?', '학교 실습실, 빈 강의실, 스터디룸 중 어떤 곳이 가장 효율적인지 궁금합니다.', 'qna', 'question', 'radiology', null, true, '2026-03-13T16:00:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001007'::uuid, 'eulji_cp', 'network-home', '임상병리 취업 준비할 때 본 기준', '지원 병원 규모에 따라 포트폴리오 구성 포인트가 달랐던 경험을 정리했습니다.', 'career', 'general', 'clinical-pathology', null, true, '2026-03-13T13:00:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001008'::uuid, 'eulji_cp', 'network-home', '임상병리 실습 병원 선택 기준 질문', '출퇴근 거리와 검사 파트 경험 중 무엇을 더 우선하는지 궁금합니다.', 'qna', 'question', 'clinical-pathology', null, true, '2026-03-12T19:10:00+09:00'::timestamptz),

    ('00000000-0000-4000-8000-000000001011'::uuid, 'yonsei_pt', 'major-physical-therapy', '물치 전공 발표 자료 템플릿 공유', '평가 항목과 중재 파트를 나눠 보기 쉬운 발표 템플릿 구조를 정리했습니다.', 'practice', 'general', 'physical-therapy', null, true, '2026-03-12T17:00:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001012'::uuid, 'yonsei_pt', 'major-physical-therapy', '물치 실습 병동 메모는 어떻게 하나요?', '환자별 핵심 관찰 포인트를 너무 많이 적게 돼서 다이어트가 필요합니다.', 'qna', 'question', 'physical-therapy', null, true, '2026-03-12T15:20:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001013'::uuid, 'konyang_ot', 'major-occupational-therapy', '작치 과제 발표 역할 분담 팁', '발표자, 자료정리, 사례정리 역할을 어떻게 나누면 편한지 적어봤습니다.', 'free', 'general', 'occupational-therapy', null, true, '2026-03-12T14:30:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001014'::uuid, 'konyang_ot', 'major-occupational-therapy', '감각통합 정리 자료 추천 부탁', '기본 개념을 다시 잡고 싶은데 너무 방대한 자료는 소화가 어렵습니다.', 'exam', 'question', 'occupational-therapy', null, true, '2026-03-12T11:40:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001015'::uuid, 'daegu_rad', 'major-radiology', '방사선과 장비 정리 노트 예시', '장비별 특징과 자주 헷갈리는 버튼을 한 페이지로 정리한 방식입니다.', 'practice', 'general', 'radiology', null, true, '2026-03-11T17:40:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001016'::uuid, 'daegu_rad', 'major-radiology', 'CT와 MRI 발표 준비 순서 질문', '교수님이 원하는 깊이를 어디까지 맞춰야 할지 감이 안 옵니다.', 'qna', 'question', 'radiology', null, true, '2026-03-11T15:10:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001017'::uuid, 'eulji_cp', 'major-clinical-pathology', '임병 스터디 회독표 템플릿', '과목별 회독 횟수와 오답 재방문 주기를 체크하는 표 예시입니다.', 'exam', 'general', 'clinical-pathology', null, true, '2026-03-11T13:00:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001018'::uuid, 'eulji_cp', 'major-clinical-pathology', '혈액 파트 복습 순서 질문', '기본 개념을 다시 다지려면 어느 파트부터 보는 게 좋을지 묻습니다.', 'qna', 'question', 'clinical-pathology', null, true, '2026-03-11T10:40:00+09:00'::timestamptz),

    ('00000000-0000-4000-8000-000000001021'::uuid, 'yonsei_pt', 'school-yonsei', '이번 주 실습 OT 장소 질문', 'OT 집합 위치가 본관인지 의료관인지 헷갈려서 학교 보드에 확인을 남깁니다.', 'qna', 'question', 'physical-therapy', 'yonsei', true, '2026-03-15T08:55:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001022'::uuid, 'yonsei_pt', 'school-yonsei', '연세 실습복 수령 일정 공유', '실습복 수령 장소와 시간표를 간단히 정리해 두었습니다.', 'practice', 'general', 'physical-therapy', 'yonsei', true, '2026-03-14T18:00:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001023'::uuid, 'konyang_ot', 'school-konyang', '건양 작치 선택과목 후기', '이번 학기 선택과목 난이도와 과제량을 간단히 공유합니다.', 'free', 'general', 'occupational-therapy', 'konyang', true, '2026-03-14T21:00:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001024'::uuid, 'konyang_ot', 'school-konyang', '건양 OT 실습 조 편성 질문', '실습 조 편성이 언제 나오는지 아직 공지가 없어 물어보는 글입니다.', 'qna', 'question', 'occupational-therapy', 'konyang', true, '2026-03-13T20:50:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001025'::uuid, 'daegu_rad', 'school-daegu-health', '대구보건 실습복 구매 팁', '학교 근처에서 맞춘 경험과 가격대를 짧게 공유합니다.', 'practice', 'general', 'radiology', 'daegu-health', true, '2026-03-13T09:00:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001026'::uuid, 'daegu_rad', 'school-daegu-health', '대구보건 장비실 사용 시간 질문', '방과 후 장비실 이용 가능 시간이 있는지 학교 기준을 묻습니다.', 'qna', 'question', 'radiology', 'daegu-health', true, '2026-03-12T16:40:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001027'::uuid, 'eulji_cp', 'school-eulji', '을지 임병 팀플 역할 분담 모집', '이번 주 발표 자료 정리와 역할 분담을 함께할 팀원을 구합니다.', 'free', 'general', 'clinical-pathology', 'eulji', true, '2026-03-12T15:20:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001028'::uuid, 'eulji_cp', 'school-eulji', '을지 임병 실습 공지 질문', '실습 오리엔테이션 자료가 다시 올라오는지 확인하려고 남깁니다.', 'qna', 'question', 'clinical-pathology', 'eulji', true, '2026-03-11T18:30:00+09:00'::timestamptz),

    ('00000000-0000-4000-8000-000000001031'::uuid, 'yonsei_pt', 'network-home', '물리치료 케이스 스터디 팀원 모집', '주 1회 온라인으로 케이스 발표와 기록을 공유할 팀원을 찾습니다.', 'recruitment', 'recruitment', 'physical-therapy', null, true, '2026-03-15T07:30:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001032'::uuid, 'konyang_ot', 'network-home', '작업치료 국시 회독 스터디 모집', '문제풀이 인증과 회독 체크를 함께할 온라인 스터디 멤버를 구합니다.', 'recruitment', 'recruitment', 'occupational-therapy', null, true, '2026-03-14T19:10:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001033'::uuid, 'daegu_rad', 'network-home', '방사선 발표 자료 팀 빌딩', '전공 혼합 팀으로 발표 자료와 역할 분담을 빠르게 맞출 사람을 찾습니다.', 'recruitment', 'recruitment', 'radiology', null, true, '2026-03-14T15:00:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001034'::uuid, 'eulji_cp', 'network-home', '임상병리 문제풀이 인증 스터디', '국시 문제풀이 인증과 오답 정리를 같이할 스터디를 모집합니다.', 'recruitment', 'recruitment', 'clinical-pathology', null, true, '2026-03-13T19:00:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001035'::uuid, 'yonsei_pt', 'school-yonsei', '연세 물치 실습 짝스터디 모집', '학교 기준 일정에 맞춰 실습 전날 같이 예습할 짝스터디를 구합니다.', 'recruitment', 'recruitment', 'physical-therapy', 'yonsei', true, '2026-03-13T11:30:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001036'::uuid, 'konyang_ot', 'school-konyang', '건양 OT 발표 팀원 모집', '케이스 발표 자료를 같이 정리할 같은 학교 팀원을 찾습니다.', 'recruitment', 'recruitment', 'occupational-therapy', 'konyang', true, '2026-03-13T10:50:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001037'::uuid, 'daegu_rad', 'school-daegu-health', '대구보건 방사선 장비 연습 팀 구함', '장비실 이용 가능한 시간에 맞춰 같이 연습할 팀원을 구합니다.', 'recruitment', 'recruitment', 'radiology', 'daegu-health', true, '2026-03-12T18:20:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000001038'::uuid, 'eulji_cp', 'school-eulji', '을지 임병 팀플 자료 정리 멤버 모집', '학교 발표 일정에 맞춰 슬라이드 정리를 같이할 멤버를 찾습니다.', 'recruitment', 'recruitment', 'clinical-pathology', 'eulji', true, '2026-03-12T14:30:00+09:00'::timestamptz)
)
insert into public.posts (
  id,
  board_id,
  author_profile_id,
  title,
  body,
  category,
  post_type,
  status,
  major_group_id,
  university_id,
  recruitment_id,
  is_anonymous,
  comment_count,
  created_at
)
select
  seed_posts.id,
  seed_posts.board_id,
  profiles.profile_id,
  seed_posts.title,
  seed_posts.body,
  seed_posts.category,
  seed_posts.post_type,
  'published',
  seed_posts.major_group_id,
  seed_posts.university_id,
  null,
  seed_posts.is_anonymous,
  0,
  seed_posts.created_at
from seed_posts
join temp_launch_seed_profiles profiles
  on profiles.seed_key = seed_posts.author_key
on conflict (id) do update
set
  board_id = excluded.board_id,
  author_profile_id = excluded.author_profile_id,
  title = excluded.title,
  body = excluded.body,
  category = excluded.category,
  post_type = excluded.post_type,
  status = excluded.status,
  major_group_id = excluded.major_group_id,
  university_id = excluded.university_id,
  is_anonymous = excluded.is_anonymous,
  created_at = excluded.created_at;

with seed_recruitments (
  id,
  post_id,
  recruitment_type,
  status,
  headcount,
  mode,
  deadline_at,
  preferred_major_group_id,
  created_at
) as (
  values
    ('00000000-0000-4000-8000-000000002031'::uuid, '00000000-0000-4000-8000-000000001031'::uuid, 'study', 'open', 4, 'online', '2026-03-22T23:00:00+09:00'::timestamptz, 'physical-therapy', '2026-03-15T07:30:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000002032'::uuid, '00000000-0000-4000-8000-000000001032'::uuid, 'study', 'open', 5, 'online', '2026-03-23T21:00:00+09:00'::timestamptz, 'occupational-therapy', '2026-03-14T19:10:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000002033'::uuid, '00000000-0000-4000-8000-000000001033'::uuid, 'project', 'open', 4, 'hybrid', '2026-03-24T18:00:00+09:00'::timestamptz, null, '2026-03-14T15:00:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000002034'::uuid, '00000000-0000-4000-8000-000000001034'::uuid, 'study', 'open', 4, 'online', '2026-03-25T22:00:00+09:00'::timestamptz, 'clinical-pathology', '2026-03-13T19:00:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000002035'::uuid, '00000000-0000-4000-8000-000000001035'::uuid, 'assignment', 'open', 2, 'offline', '2026-03-20T18:00:00+09:00'::timestamptz, 'physical-therapy', '2026-03-13T11:30:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000002036'::uuid, '00000000-0000-4000-8000-000000001036'::uuid, 'project', 'open', 3, 'offline', '2026-03-21T17:30:00+09:00'::timestamptz, 'occupational-therapy', '2026-03-13T10:50:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000002037'::uuid, '00000000-0000-4000-8000-000000001037'::uuid, 'study', 'open', 3, 'hybrid', '2026-03-21T20:00:00+09:00'::timestamptz, 'radiology', '2026-03-12T18:20:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000002038'::uuid, '00000000-0000-4000-8000-000000001038'::uuid, 'assignment', 'open', 3, 'offline', '2026-03-20T19:00:00+09:00'::timestamptz, 'clinical-pathology', '2026-03-12T14:30:00+09:00'::timestamptz)
)
insert into public.recruitments (
  id,
  post_id,
  recruitment_type,
  status,
  headcount,
  mode,
  deadline_at,
  preferred_major_group_id,
  created_at
)
select
  id,
  post_id,
  recruitment_type,
  status,
  headcount,
  mode,
  deadline_at,
  preferred_major_group_id,
  created_at
from seed_recruitments
on conflict (id) do update
set
  post_id = excluded.post_id,
  recruitment_type = excluded.recruitment_type,
  status = excluded.status,
  headcount = excluded.headcount,
  mode = excluded.mode,
  deadline_at = excluded.deadline_at,
  preferred_major_group_id = excluded.preferred_major_group_id,
  created_at = excluded.created_at;

with recruitment_links (post_id, recruitment_id) as (
  values
    ('00000000-0000-4000-8000-000000001031'::uuid, '00000000-0000-4000-8000-000000002031'::uuid),
    ('00000000-0000-4000-8000-000000001032'::uuid, '00000000-0000-4000-8000-000000002032'::uuid),
    ('00000000-0000-4000-8000-000000001033'::uuid, '00000000-0000-4000-8000-000000002033'::uuid),
    ('00000000-0000-4000-8000-000000001034'::uuid, '00000000-0000-4000-8000-000000002034'::uuid),
    ('00000000-0000-4000-8000-000000001035'::uuid, '00000000-0000-4000-8000-000000002035'::uuid),
    ('00000000-0000-4000-8000-000000001036'::uuid, '00000000-0000-4000-8000-000000002036'::uuid),
    ('00000000-0000-4000-8000-000000001037'::uuid, '00000000-0000-4000-8000-000000002037'::uuid),
    ('00000000-0000-4000-8000-000000001038'::uuid, '00000000-0000-4000-8000-000000002038'::uuid)
)
update public.posts posts
set recruitment_id = recruitment_links.recruitment_id
from recruitment_links
where posts.id = recruitment_links.post_id;

with seed_comments (
  id,
  post_id,
  author_key,
  parent_comment_id,
  depth,
  body,
  kind,
  is_anonymous,
  created_at
) as (
  values
    ('00000000-0000-4000-8000-000000003001'::uuid, '00000000-0000-4000-8000-000000001001'::uuid, 'konyang_ot', null::uuid, 1::smallint, '실습 첫 주에는 메모 포맷부터 맞춰 두는 게 진짜 도움됐어요.', 'general', true, '2026-03-14T10:20:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000003002'::uuid, '00000000-0000-4000-8000-000000001001'::uuid, 'daegu_rad', null::uuid, 1::smallint, '준비물 체크리스트는 캡처해서 바로 써먹기 좋네요.', 'general', true, '2026-03-14T10:24:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000003003'::uuid, '00000000-0000-4000-8000-000000001004'::uuid, 'eulji_cp', null::uuid, 1::smallint, '저는 표로 정리한 뒤 친구랑 문제 내는 방식이 제일 오래 갔어요.', 'general', true, '2026-03-13T20:50:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000003004'::uuid, '00000000-0000-4000-8000-000000001006'::uuid, 'yonsei_pt', null::uuid, 1::smallint, '학교 실습실 예약이 되면 거기가 제일 편했고, 안 되면 스터디룸도 괜찮았습니다.', 'general', true, '2026-03-13T16:20:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000003005'::uuid, '00000000-0000-4000-8000-000000001021'::uuid, 'yonsei_pt', null::uuid, 1::smallint, '작년엔 의료관 3층이었는데 이번 공지를 한 번 더 확인해야 할 것 같아요.', 'general', true, '2026-03-15T09:00:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000003006'::uuid, '00000000-0000-4000-8000-000000001023'::uuid, 'konyang_ot', null::uuid, 1::smallint, '이번 학기엔 과제량이 몰리는 과목이 있어서 미리 피하는 게 좋았어요.', 'general', true, '2026-03-14T21:20:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000003007'::uuid, '00000000-0000-4000-8000-000000001025'::uuid, 'daegu_rad', null::uuid, 1::smallint, '근처 맞춤집 두 군데 중엔 세탁 편한 쪽이 만족도가 높았습니다.', 'general', true, '2026-03-13T09:20:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000003008'::uuid, '00000000-0000-4000-8000-000000001027'::uuid, 'eulji_cp', null::uuid, 1::smallint, '자료 담당 한 명, 발표 담당 한 명으로 나누면 훨씬 빠르더라고요.', 'general', true, '2026-03-12T15:40:00+09:00'::timestamptz),

    ('00000000-0000-4000-8000-000000003031'::uuid, '00000000-0000-4000-8000-000000001031'::uuid, 'konyang_ot', null::uuid, 1::smallint, '온라인이면 저녁 9시 이후로 참여 가능합니다.', 'recruitment_intent', true, '2026-03-15T08:10:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000003032'::uuid, '00000000-0000-4000-8000-000000001031'::uuid, 'eulji_cp', null::uuid, 1::smallint, '케이스 발표 쪽 경험은 적지만 기록 정리는 맡을 수 있어요.', 'recruitment_intent', true, '2026-03-15T08:22:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000003033'::uuid, '00000000-0000-4000-8000-000000001032'::uuid, 'yonsei_pt', null::uuid, 1::smallint, '회독 체크형 스터디 찾고 있었는데 참여하고 싶습니다.', 'recruitment_intent', true, '2026-03-14T19:30:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000003034'::uuid, '00000000-0000-4000-8000-000000001033'::uuid, 'eulji_cp', null::uuid, 1::smallint, '공모전 발표 자료 파트 맡을 수 있습니다.', 'recruitment_intent', true, '2026-03-14T15:20:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000003035'::uuid, '00000000-0000-4000-8000-000000001035'::uuid, 'yonsei_pt', null::uuid, 1::smallint, '실습 예습 위주라면 참여 가능합니다. 시간만 맞추면 될 것 같아요.', 'recruitment_intent', true, '2026-03-13T11:45:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000003036'::uuid, '00000000-0000-4000-8000-000000001036'::uuid, 'konyang_ot', null::uuid, 1::smallint, '케이스 정리 파트 맡을 수 있습니다.', 'recruitment_intent', true, '2026-03-13T11:10:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000003037'::uuid, '00000000-0000-4000-8000-000000001037'::uuid, 'daegu_rad', null::uuid, 1::smallint, '장비실 이용 가능한 요일이면 바로 합류할 수 있어요.', 'recruitment_intent', true, '2026-03-12T18:40:00+09:00'::timestamptz),
    ('00000000-0000-4000-8000-000000003038'::uuid, '00000000-0000-4000-8000-000000001038'::uuid, 'eulji_cp', null::uuid, 1::smallint, '슬라이드 디자인보다 내용 정리 쪽에 더 자신 있습니다.', 'recruitment_intent', true, '2026-03-12T14:45:00+09:00'::timestamptz)
)
insert into public.comments (
  id,
  post_id,
  author_profile_id,
  parent_comment_id,
  depth,
  body,
  status,
  kind,
  is_anonymous,
  created_at
)
select
  seed_comments.id,
  seed_comments.post_id,
  profiles.profile_id,
  seed_comments.parent_comment_id,
  seed_comments.depth,
  seed_comments.body,
  'published',
  seed_comments.kind,
  seed_comments.is_anonymous,
  seed_comments.created_at
from seed_comments
join temp_launch_seed_profiles profiles
  on profiles.seed_key = seed_comments.author_key
on conflict (id) do update
set
  post_id = excluded.post_id,
  author_profile_id = excluded.author_profile_id,
  parent_comment_id = excluded.parent_comment_id,
  depth = excluded.depth,
  body = excluded.body,
  status = excluded.status,
  kind = excluded.kind,
  is_anonymous = excluded.is_anonymous,
  created_at = excluded.created_at;

with seeded_post_ids (id) as (
  values
    ('00000000-0000-4000-8000-000000001001'::uuid),
    ('00000000-0000-4000-8000-000000001002'::uuid),
    ('00000000-0000-4000-8000-000000001003'::uuid),
    ('00000000-0000-4000-8000-000000001004'::uuid),
    ('00000000-0000-4000-8000-000000001005'::uuid),
    ('00000000-0000-4000-8000-000000001006'::uuid),
    ('00000000-0000-4000-8000-000000001007'::uuid),
    ('00000000-0000-4000-8000-000000001008'::uuid),
    ('00000000-0000-4000-8000-000000001011'::uuid),
    ('00000000-0000-4000-8000-000000001012'::uuid),
    ('00000000-0000-4000-8000-000000001013'::uuid),
    ('00000000-0000-4000-8000-000000001014'::uuid),
    ('00000000-0000-4000-8000-000000001015'::uuid),
    ('00000000-0000-4000-8000-000000001016'::uuid),
    ('00000000-0000-4000-8000-000000001017'::uuid),
    ('00000000-0000-4000-8000-000000001018'::uuid),
    ('00000000-0000-4000-8000-000000001021'::uuid),
    ('00000000-0000-4000-8000-000000001022'::uuid),
    ('00000000-0000-4000-8000-000000001023'::uuid),
    ('00000000-0000-4000-8000-000000001024'::uuid),
    ('00000000-0000-4000-8000-000000001025'::uuid),
    ('00000000-0000-4000-8000-000000001026'::uuid),
    ('00000000-0000-4000-8000-000000001027'::uuid),
    ('00000000-0000-4000-8000-000000001028'::uuid),
    ('00000000-0000-4000-8000-000000001031'::uuid),
    ('00000000-0000-4000-8000-000000001032'::uuid),
    ('00000000-0000-4000-8000-000000001033'::uuid),
    ('00000000-0000-4000-8000-000000001034'::uuid),
    ('00000000-0000-4000-8000-000000001035'::uuid),
    ('00000000-0000-4000-8000-000000001036'::uuid),
    ('00000000-0000-4000-8000-000000001037'::uuid),
    ('00000000-0000-4000-8000-000000001038'::uuid)
)
update public.posts posts
set comment_count = (
  select count(*)
  from public.comments comments
  where comments.post_id = posts.id
    and comments.status = 'published'
)
where posts.id in (select id from seeded_post_ids);

select
  (select count(*) from public.posts where id in (
    '00000000-0000-4000-8000-000000001001'::uuid,
    '00000000-0000-4000-8000-000000001002'::uuid,
    '00000000-0000-4000-8000-000000001003'::uuid,
    '00000000-0000-4000-8000-000000001004'::uuid,
    '00000000-0000-4000-8000-000000001005'::uuid,
    '00000000-0000-4000-8000-000000001006'::uuid,
    '00000000-0000-4000-8000-000000001007'::uuid,
    '00000000-0000-4000-8000-000000001008'::uuid,
    '00000000-0000-4000-8000-000000001011'::uuid,
    '00000000-0000-4000-8000-000000001012'::uuid,
    '00000000-0000-4000-8000-000000001013'::uuid,
    '00000000-0000-4000-8000-000000001014'::uuid,
    '00000000-0000-4000-8000-000000001015'::uuid,
    '00000000-0000-4000-8000-000000001016'::uuid,
    '00000000-0000-4000-8000-000000001017'::uuid,
    '00000000-0000-4000-8000-000000001018'::uuid,
    '00000000-0000-4000-8000-000000001021'::uuid,
    '00000000-0000-4000-8000-000000001022'::uuid,
    '00000000-0000-4000-8000-000000001023'::uuid,
    '00000000-0000-4000-8000-000000001024'::uuid,
    '00000000-0000-4000-8000-000000001025'::uuid,
    '00000000-0000-4000-8000-000000001026'::uuid,
    '00000000-0000-4000-8000-000000001027'::uuid,
    '00000000-0000-4000-8000-000000001028'::uuid,
    '00000000-0000-4000-8000-000000001031'::uuid,
    '00000000-0000-4000-8000-000000001032'::uuid,
    '00000000-0000-4000-8000-000000001033'::uuid,
    '00000000-0000-4000-8000-000000001034'::uuid,
    '00000000-0000-4000-8000-000000001035'::uuid,
    '00000000-0000-4000-8000-000000001036'::uuid,
    '00000000-0000-4000-8000-000000001037'::uuid,
    '00000000-0000-4000-8000-000000001038'::uuid
  )) as seeded_posts,
  (select count(*) from public.recruitments where id in (
    '00000000-0000-4000-8000-000000002031'::uuid,
    '00000000-0000-4000-8000-000000002032'::uuid,
    '00000000-0000-4000-8000-000000002033'::uuid,
    '00000000-0000-4000-8000-000000002034'::uuid,
    '00000000-0000-4000-8000-000000002035'::uuid,
    '00000000-0000-4000-8000-000000002036'::uuid,
    '00000000-0000-4000-8000-000000002037'::uuid,
    '00000000-0000-4000-8000-000000002038'::uuid
  )) as seeded_recruitments,
  (select count(*) from public.comments where id in (
    '00000000-0000-4000-8000-000000003001'::uuid,
    '00000000-0000-4000-8000-000000003002'::uuid,
    '00000000-0000-4000-8000-000000003003'::uuid,
    '00000000-0000-4000-8000-000000003004'::uuid,
    '00000000-0000-4000-8000-000000003005'::uuid,
    '00000000-0000-4000-8000-000000003006'::uuid,
    '00000000-0000-4000-8000-000000003007'::uuid,
    '00000000-0000-4000-8000-000000003008'::uuid,
    '00000000-0000-4000-8000-000000003031'::uuid,
    '00000000-0000-4000-8000-000000003032'::uuid,
    '00000000-0000-4000-8000-000000003033'::uuid,
    '00000000-0000-4000-8000-000000003034'::uuid,
    '00000000-0000-4000-8000-000000003035'::uuid,
    '00000000-0000-4000-8000-000000003036'::uuid,
    '00000000-0000-4000-8000-000000003037'::uuid,
    '00000000-0000-4000-8000-000000003038'::uuid
  )) as seeded_comments;
