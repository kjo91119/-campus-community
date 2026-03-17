# 40. Moderation 스모크 실행 설명서

문서 목적: launch 직전 moderator/admin 계정으로 신고 검토, 콘텐츠 숨김, restricted/banned/restored를 반복 재현할 수 있게 실제 실행 순서와 확인 SQL을 정리한다.

## 함께 보는 파일

- [38-launch-seeding-and-qa-guide.md](/home/junoh/projects/campus-community/docs/38-launch-seeding-and-qa-guide.md)
- [36-launch-readiness-guide.md](/home/junoh/projects/campus-community/docs/36-launch-readiness-guide.md)
- [08-auth-verification-moderation.md](/home/junoh/projects/campus-community/docs/08-auth-verification-moderation.md)
- [06_add_reports_blocks_rpcs.sql](/home/junoh/projects/campus-community/supabase/sql/06_add_reports_blocks_rpcs.sql)
- [07_add_moderation_actions.sql](/home/junoh/projects/campus-community/supabase/sql/07_add_moderation_actions.sql)
- [42-launch-qa-execution-sheet.md](/home/junoh/projects/campus-community/docs/42-launch-qa-execution-sheet.md)

## 1. 사전 준비

필수:

- QA baseline은 [38-launch-seeding-and-qa-guide.md](/home/junoh/projects/campus-community/docs/38-launch-seeding-and-qa-guide.md) 기준으로 이미 들어가 있어야 한다.
- moderator 또는 admin 역할의 운영 계정 1개가 필요하다.
- 신고 대상이 될 `post`, `comment`, `profile`이 QA 앱에서 실제로 열려야 한다.

권장:

- 일반 QA 계정 2개 이상으로 미리 신고를 하나씩 만들어 둔다.
- launch 직전 smoke는 `post 신고 1건`, `comment 신고 1건`, `profile 신고 1건` 정도면 충분하다.

## 2. smoke에 쓸 신고 찾기

### 열려 있는 신고 목록 찾기

```sql
select
  id,
  target_type,
  target_id,
  target_profile_id,
  status,
  created_at
from public.reports
where status in ('open', 'reviewing')
order by created_at desc
limit 20;
```

### moderator/admin 권한 확인

```sql
select id, role, status
from public.profiles
where id = auth.uid();
```

메모:

- `apply_moderation_action(...)`는 moderator/admin이 아니면 실패한다.
- `p_report_id`를 함께 넘길 때는 그 신고가 현재 `target_type / target_id`와 실제로 연결돼 있어야 한다.
- 실행 결과와 대상 id는 [42-launch-qa-execution-sheet.md](/home/junoh/projects/campus-community/docs/42-launch-qa-execution-sheet.md)의 moderation 섹션에 바로 남긴다.

## 3. 기본 실행 순서

### A. 신고를 reviewing으로 전환

```sql
select public.apply_moderation_action(
  'report_reviewing',
  'report',
  '<report_id>'::uuid,
  'QA reviewing 시작',
  null
);
```

기대 결과:

- `reports.status = 'reviewing'`
- `reports.reviewer_profile_id = auth.uid()`
- `moderation_events`에 `report_reviewing` 한 건 기록

### B. 게시글 숨김 + linked report 자동 resolved

```sql
select public.apply_moderation_action(
  'content_hidden',
  'post',
  '<post_id>'::uuid,
  'QA 게시글 숨김',
  '<linked_report_id>'::uuid
);
```

기대 결과:

- `posts.status = 'hidden'`
- linked report가 같은 `target_type / target_id`면 `resolved`
- `moderation_events.report_id`에 linked report id 기록

### B-1. 게시글 복구 예시

```sql
select public.apply_moderation_action(
  'content_restored',
  'post',
  '<post_id>'::uuid,
  'QA 게시글 복구',
  null
);
```

### C. 댓글 숨김 + comment_count 재계산 확인

댓글 스모크 전에 `<comment_id>`와 함께 그 댓글의 `<parent_post_id>`도 미리 기록해 둔다.

```sql
select public.apply_moderation_action(
  'content_hidden',
  'comment',
  '<comment_id>'::uuid,
  'QA 댓글 숨김',
  '<linked_report_id>'::uuid
);
```

확인 SQL:

```sql
select
  posts.id,
  posts.comment_count,
  (
    select count(*)
    from public.comments comments
    where comments.post_id = posts.id
      and comments.status = 'published'
  ) as published_comment_count
from public.posts posts
where posts.id = '<parent_post_id>'::uuid;
```

기대 결과:

- `posts.comment_count = published_comment_count`

### C-1. 댓글 복구 예시

```sql
select public.apply_moderation_action(
  'content_restored',
  'comment',
  '<comment_id>'::uuid,
  'QA 댓글 복구',
  null
);
```

### D. 사용자 restricted

```sql
select public.apply_moderation_action(
  'user_restricted',
  'profile',
  '<target_profile_id>'::uuid,
  'QA 읽기 전용 전환',
  '<linked_report_id>'::uuid
);
```

기대 결과:

- `profiles.status = 'restricted'`
- 대상 계정은 읽기만 가능하고 쓰기 경로는 닫힘

### E. 사용자 banned

```sql
select public.apply_moderation_action(
  'user_banned',
  'profile',
  '<target_profile_id>'::uuid,
  'QA 접근 차단 확인',
  '<linked_report_id>'::uuid
);
```

기대 결과:

- `profiles.status = 'banned'`
- 대상 계정은 커뮤니티 진입 자체가 막힘

### F. 사용자 restored

```sql
select public.apply_moderation_action(
  'user_restored',
  'profile',
  '<target_profile_id>'::uuid,
  'QA 복구 확인',
  null
);
```

기대 결과:

- `profiles.status = 'active'`
- 대상 계정 접근이 다시 열린다

## 4. linked report 검증 포인트

같은 조치라도 `p_report_id`가 무관한 신고면 실패해야 한다.

```sql
select public.apply_moderation_action(
  'content_hidden',
  'post',
  '<post_id>'::uuid,
  '무관한 신고 연결 실패 확인',
  '<unrelated_report_id>'::uuid
);
```

기대 결과:

- RPC 실패
- 오류 메시지는 현재 조치 대상과 연결된 신고를 찾지 못했다는 의미여야 한다

## 5. 확인 SQL

### moderation event 확인

```sql
select
  action_type,
  target_type,
  target_id,
  report_id,
  created_at
from public.moderation_events
order by created_at desc
limit 20;
```

### report 상태 확인

```sql
select
  id,
  target_type,
  target_id,
  status,
  reviewer_profile_id,
  reviewed_at
from public.reports
where id = '<report_id>'::uuid;
```

## 6. 복구 / 마무리 규칙

- smoke 중 `content_hidden`한 post/comment는 필요하면 같은 방식으로 `content_restored`를 실행해 원복한다.
- `user_banned`까지 갔다면 종료 전에 `user_restored`로 되돌린다.
- QA용으로 만든 신고는 delete하지 말고, 상태 전이와 `moderation_events` 기록을 남겨 운영 이력을 확인하는 용도로 쓴다.

## 결론

이 문서는 launch 직전 운영자 관점에서 "신고가 실제로 검토되고, linked report 제약이 지켜지며, 콘텐츠/사용자 상태가 예상대로 바뀌는가"를 짧은 순서로 반복 검증하기 위한 실행 설명서다. baseline 시딩은 [38-launch-seeding-and-qa-guide.md](/home/junoh/projects/campus-community/docs/38-launch-seeding-and-qa-guide.md), 최종 런치 점검은 [36-launch-readiness-guide.md](/home/junoh/projects/campus-community/docs/36-launch-readiness-guide.md)를 함께 본다.
