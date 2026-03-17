# 38. 런치 시딩·QA 실행 설명서

문서 목적: 현재 server-first 구조를 기준으로 closed beta 직전 필요한 QA baseline 시딩, 운영 스모크 테스트, reset 절차를 실제로 따라 할 수 있게 정리한다.

## 이 설명서가 필요한 이유

- 지금 앱은 `posts/comments/recruitments`만 채우면 끝나는 구조가 아니다.
- `boards.is_active`, 작성자 요약용 `profiles`, moderation RPC까지 같이 맞아야 실제 화면과 운영 흐름이 안정적으로 보인다.
- 그래서 "무슨 SQL을 깔았는가"보다 "어떤 순서로 QA 계정을 준비하고 어떤 스냅샷을 넣고 무엇을 검증하는가"를 한 번에 보는 실행 설명서가 필요하다.

## 함께 보는 파일

- [36-launch-readiness-guide.md](/home/junoh/projects/campus-community/docs/36-launch-readiness-guide.md)
- [16-supabase-connection-guide.md](/home/junoh/projects/campus-community/docs/16-supabase-connection-guide.md)
- [08-auth-verification-moderation.md](/home/junoh/projects/campus-community/docs/08-auth-verification-moderation.md)
- [08_seed_launch_qa_snapshot.sql](/home/junoh/projects/campus-community/supabase/sql/08_seed_launch_qa_snapshot.sql)
- [09_reset_launch_qa_snapshot.sql](/home/junoh/projects/campus-community/supabase/sql/09_reset_launch_qa_snapshot.sql)
- [07_add_moderation_actions.sql](/home/junoh/projects/campus-community/supabase/sql/07_add_moderation_actions.sql)
- [42-launch-qa-execution-sheet.md](/home/junoh/projects/campus-community/docs/42-launch-qa-execution-sheet.md)

## 1. 사전 준비

필수:

- 필수 migration 적용 완료
- `boards` active 상태 확인
- 아래 4개 verified QA 계정 준비

권장 QA 계정 조합:

1. 연세대학교 / 물리치료
2. 건양대학교 / 작업치료
3. 대구보건대학교 / 방사선
4. 을지대학교 / 임상병리

조건:

- `profiles.verification_status = 'verified'`
- `profiles.status = 'active'`
- `primary_university_id`, `primary_major_group_id`가 위 조합과 일치

메모:

- 이 설명서는 `auth.users`를 SQL로 직접 만드는 방식이 아니라, 실제 가입/인증/온보딩이 끝난 QA 계정을 재사용하는 흐름을 전제로 한다.
- moderator/admin 계정은 별도로 1개 준비해 두면 moderation 스모크 테스트가 훨씬 쉽다.

## 2. QA baseline 시딩 순서

1. [08_seed_launch_qa_snapshot.sql](/home/junoh/projects/campus-community/supabase/sql/08_seed_launch_qa_snapshot.sql) 상단의 4개 이메일을 실제 QA 계정 이메일로 바꾼다.
2. deterministic baseline을 다시 맞추거나 이미 한 번 실행한 QA 환경을 복원하려면 [09_reset_launch_qa_snapshot.sql](/home/junoh/projects/campus-community/supabase/sql/09_reset_launch_qa_snapshot.sql)을 먼저 실행한다.
3. 그다음 [08_seed_launch_qa_snapshot.sql](/home/junoh/projects/campus-community/supabase/sql/08_seed_launch_qa_snapshot.sql)을 SQL editor에서 파일 전체 기준으로 한 번에 실행한다. 중간 구문만 잘라서 실행하지 않는다.
4. 마지막 `select` 결과에서 아래 수치를 확인한다.

실행 메모:

- `08`은 temporary table을 쓰므로 한 editor/session 안에서 파일 전체를 실행하는 쪽이 안전하다.
- baseline을 deterministic하게 다시 맞추고 싶다면 사실상 `reset -> seed` 순서를 기본으로 본다.
- reset은 seeded post와 그 자식 comments / recruitments를 함께 정리하므로, baseline 이후 QA 중 달린 descendant data도 같이 사라진다.

기대 baseline:

- `seeded_posts = 32`
- `seeded_recruitments = 8`
- `seeded_comments = 16`

이 baseline의 목적:

- 홈 / 전공 보드 / 학교 보드 / 모집 / 상세 / 댓글 / 신고·차단 / moderation 스모크를 빈 화면 없이 확인하는 것
- 공개 beta용 최종 밀도를 모두 채우는 것까지는 아니다

## 3. baseline 이후 바로 확인할 것

### boards / 읽기 경로

- 통합 홈 CTA가 열리는지
- major board 4개가 모두 열리는지
- school board 4개가 모두 열리는지
- inactive board가 없는지

### 작성자 요약

- 글 목록과 상세에서 `알 수 없는 사용자`가 대량으로 보이지 않는지
- 익명 글은 익명 처리되지만, 차단 목록/신고 대상 해석은 유지되는지

### 모집

- 모집 탭 목록이 비어 있지 않은지
- 모집 상세에서 참여 의사 댓글이 보이는지
- 학교 보드 모집글과 통합 모집글이 둘 다 열리는지

## 4. 추천 QA 실행 순서

### A. 커뮤니티 읽기 스모크

1. 홈 진입
2. 전공군 필터 전환
3. major board 상세 진입
4. school board 진입
5. 모집 탭 진입
6. 글 상세 / 모집 상세 / 댓글 확인

### B. 쓰기 스모크

1. 통합 홈 일반글 작성
2. 학교 보드 글 작성
3. 모집글 작성
4. 일반 댓글 작성
5. 모집 참여 의사 댓글 작성

### C. 신고 / 차단 스모크

1. 글 신고
2. 댓글 신고
3. 모집글 신고
4. 프로필 신고
5. 작성자 차단
6. 목록/상세 숨김 확인
7. 프로필에서 차단 해제

### D. moderation 스모크

1. moderator/admin 계정으로 신고 `reviewing`
2. 같은 신고에 `content_hidden` 또는 `user_restricted`
3. `p_report_id` 연계 시 신고가 자동 `resolved` 되는지 확인
4. `user_banned` 후 대상 계정 커뮤니티 접근 차단 확인
5. `user_restored` 후 접근 회복 확인

운영자가 그대로 따라 할 실행 절차는 [40-moderation-smoke-runbook.md](/home/junoh/projects/campus-community/docs/40-moderation-smoke-runbook.md)를 우선 본다.
실행 결과는 [42-launch-qa-execution-sheet.md](/home/junoh/projects/campus-community/docs/42-launch-qa-execution-sheet.md)에 바로 기록한다.

## 5. moderation 스모크 SQL 예시

### 신고를 reviewing으로 바꾸기

```sql
select public.apply_moderation_action(
  'report_reviewing',
  'report',
  '<report_id>'::uuid,
  'QA reviewing 시작',
  null
);
```

### 게시글 숨김 + 연계 신고 자동 종결

```sql
select public.apply_moderation_action(
  'content_hidden',
  'post',
  '<post_id>'::uuid,
  'QA 게시글 숨김',
  '<linked_report_id>'::uuid
);
```

### 사용자 restricted

```sql
select public.apply_moderation_action(
  'user_restricted',
  'profile',
  '<target_profile_id>'::uuid,
  'QA 읽기 전용 전환',
  '<linked_report_id>'::uuid
);
```

### 사용자 banned

```sql
select public.apply_moderation_action(
  'user_banned',
  'profile',
  '<target_profile_id>'::uuid,
  'QA 접근 차단 확인',
  '<linked_report_id>'::uuid
);
```

### 사용자 restored

```sql
select public.apply_moderation_action(
  'user_restored',
  'profile',
  '<target_profile_id>'::uuid,
  'QA 복구 확인',
  null
);
```

메모:

- `p_report_id`는 아무 신고나 넣는 게 아니라 현재 `target_type / target_id`와 연결된 신고여야 한다.
- 무관한 `report_id`를 넣으면 현재 SQL은 실패하도록 막혀 있다.

## 6. reset / 재실행 규칙

- deterministic baseline 복원이 목적이면 [09_reset_launch_qa_snapshot.sql](/home/junoh/projects/campus-community/supabase/sql/09_reset_launch_qa_snapshot.sql)부터 실행한다.
- 그다음 [08_seed_launch_qa_snapshot.sql](/home/junoh/projects/campus-community/supabase/sql/08_seed_launch_qa_snapshot.sql)을 파일 전체 기준으로 다시 실행한다.
- QA 계정 자체는 지우지 않는다
- reset은 seeded post에 달린 자식 comments / recruitments까지 함께 지운다

## 7. 공개 beta 전 추가로 해야 하는 것

이 설명서의 baseline은 QA용 최소 스냅샷이다. 공개 beta 전에는 아래를 더 채워야 한다.

- 전공군별 일반글 10개 이상
- 학교 보드 예시 글 학교당 2개 이상 유지
- 모집글 8개 이상 유지
- 댓글 비율 30% 이상

이 최종 기준은 [36-launch-readiness-guide.md](/home/junoh/projects/campus-community/docs/36-launch-readiness-guide.md)를 우선한다.

## 결론

지금 단계에서 중요한 건 "실제 launch 전 데이터와 운영 흐름을 빈 화면 없이 반복 검증할 수 있는가"다. 이 설명서는 auth/profiles를 실제 QA 계정으로 준비한 뒤, deterministic snapshot과 moderation RPC를 이용해 같은 QA를 계속 반복할 수 있게 만드는 실행 문서다.
