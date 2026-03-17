# 41. Moderation 스모크 실행 설명서 교차검증 검증 결과

### 1. 핵심 발견사항

- 블로킹 이슈는 없었다. [40-moderation-smoke-runbook.md](/home/junoh/projects/campus-community/docs/40-moderation-smoke-runbook.md)는 현재 `apply_moderation_action(...)` 제약과 운영 문서 범위에 대체로 정확히 맞는다. 관련: `docs/40-moderation-smoke-runbook.md:52-230`, `supabase/sql/07_add_moderation_actions.sql:75-219`
- `p_report_id` 설명도 현재 SQL과 맞다. linked report는 아무 신고나 허용하는 것이 아니라 `id + target_type + target_id`가 현재 조치 대상과 일치할 때만 `resolved`로 닫히며, 무관한 신고는 실패한다. 관련: `docs/40-moderation-smoke-runbook.md:52-56`, `docs/40-moderation-smoke-runbook.md:178-195`, `supabase/sql/07_add_moderation_actions.sql:181-195`, `docs/08-auth-verification-moderation.md:152-154`
- 댓글 숨김 뒤 `posts.comment_count`를 published comment 실측값과 대조하는 확인 SQL도 현재 구현과 정확히 맞물린다. RPC는 comment hide/restore 때 parent post의 `comment_count`를 재계산한다. 관련: `docs/40-moderation-smoke-runbook.md:95-125`, `supabase/sql/07_add_moderation_actions.sql:115-138`, `supabase/migrations/20260316153000_create_community_tables.sql:148-200`
- `restricted`는 읽기 허용 + 쓰기 차단, `banned`는 커뮤니티 진입 차단, `restored`는 active 복귀라는 기대 결과도 현재 앱 경계와 맞다. 관련: `docs/40-moderation-smoke-runbook.md:127-176`, `hooks/use-app-session.tsx:576-584`, `hooks/use-community-data.tsx:716-745`, `app/(auth)/index.tsx:95-113`, `app/(tabs)/_layout.tsx:12-20`
- 낮음: 실행 문서 재현성을 더 높이려면 `content_restored` 예시 SQL과 댓글 스모크 전에 `<parent_post_id>`를 미리 확보하라는 한 줄이 있으면 더 낫다. 하지만 현재 상태도 문서/SQL 충돌은 아니다.

### 2. moderation 스모크 실행 경계 평가

- `적절함`
- A 단계의 `report_reviewing`은 report 대상 전용 액션 제약과 맞고, B/C 단계의 `content_hidden`은 `post`/`comment` 대상 경계와 맞으며, D/E/F 단계의 `user_restricted` / `user_banned` / `user_restored`도 `profile` 대상 전용 제약과 맞는다. 관련: `docs/40-moderation-smoke-runbook.md:57-176`, `supabase/sql/07_add_moderation_actions.sql:75-179`
- linked report 음수 테스트를 별도 섹션으로 둔 점이 특히 좋다. 현재 SQL에서 가장 중요한 운영 경계 중 하나를 문서가 정확히 재현한다. 관련: `docs/40-moderation-smoke-runbook.md:178-195`, `supabase/sql/07_add_moderation_actions.sql:181-195`
- `40`은 launch 직전 최소 smoke runbook으로 범위를 좁히고, `38`은 QA baseline/신고·차단 전체 흐름을 설명한 뒤 운영 절차는 `40`을 보라고 넘긴다. 따라서 역할 중복이나 범위 충돌은 없다. 관련: `docs/38-launch-seeding-and-qa-guide.md:109-127`, `docs/40-moderation-smoke-runbook.md:13-24`

### 3. 문서 / 코드 / SQL 충돌 여부

- `충돌 없음`
- `08`의 moderation 메모는 linked report가 실제 target과 연결돼야만 같은 RPC 안에서 닫힌다고 설명하고 있고, `40`도 동일한 가정을 사용한다. 관련: `docs/08-auth-verification-moderation.md:150-154`, `docs/40-moderation-smoke-runbook.md:52-56`
- `36`도 banned QA는 앱 로컬 데모가 아니라 서버 RPC/SQL 경로로 재현한다고 적고 있어 `40`의 운영 SQL 중심 설명과 맞는다. 관련: `docs/36-launch-readiness-guide.md:40-43`, `docs/36-launch-readiness-guide.md:96-102`
- `comment_count` 검증은 schema의 `posts.comment_count` 필드와 moderation RPC의 재계산 로직을 그대로 따라가므로 문서와 구현 사이에 어긋남이 없다. 관련: `docs/40-moderation-smoke-runbook.md:107-125`, `supabase/migrations/20260316153000_create_community_tables.sql:148-165`, `supabase/sql/07_add_moderation_actions.sql:128-138`

### 4. 운영 재현성 평가

- `높음`
- 사전 준비에서 QA baseline, moderator/admin 계정, 실제로 열리는 post/comment/profile 대상이 필요하다고 못 박은 점이 적절하다. 관련: `docs/40-moderation-smoke-runbook.md:13-24`, `docs/38-launch-seeding-and-qa-guide.md:119-127`
- 열려 있는 신고 조회, 권한 확인, `moderation_events` 조회, report 상태 조회까지 포함돼 있어 운영자가 결과를 바로 검증하기 쉽다. 관련: `docs/40-moderation-smoke-runbook.md:26-56`, `docs/40-moderation-smoke-runbook.md:197-225`
- 복구 규칙도 post/comment 원복, banned 계정 restore, QA 신고 이력 유지까지 포함하고 있어 QA 상태가 꼬일 가능성을 크게 줄인다. 관련: `docs/40-moderation-smoke-runbook.md:227-231`
- 다만 반복 실행 편의성만 보면 `content_restored` 실제 예시와 댓글용 `<parent_post_id>` 확보 메모를 추가하면 더 단단해진다.

### 5. 지금 단계에서 구현하지 말아야 할 것

- 이 runbook을 별도 관리자 UI 요구사항 문서로 확장하는 작업
- 신고 누적 수 기반 자동 제재나 자동 밴 로직
- launch 직전 최소 smoke 문서를 모든 예외 케이스를 포괄하는 전체 운영 매뉴얼로 키우는 작업

### 6. 바로 보완할 것

- 필수 수정은 없다.
- 선택 보강으로 `content_restored` 예시 SQL을 post/comment 기준 1개씩만 추가하고, 그 예시에서는 `p_report_id`를 `null`로 두는 편이 복구 의도를 더 분명하게 보여 준다.
- 댓글 스모크 단계에 "`<parent_post_id>`를 먼저 기록해 둔다"는 한 줄을 넣으면 `comment_count` 검증이 더 바로 실행된다.

### 7. 최종 판단

- 현재 [40-moderation-smoke-runbook.md](/home/junoh/projects/campus-community/docs/40-moderation-smoke-runbook.md)는 launch 직전 moderation smoke 실행 문서로 사용해도 된다.
- linked report 제약, comment count 검증, restricted/banned/restored 기대 결과, `38`/`36`과의 역할 분리까지 현재 워크트리 기준으로 모두 맞는다.
- 지금은 문서 오류를 고치는 단계가 아니라, 선택적 재현성 보강만 얹으면 되는 상태다.

검증: 지정 브리프의 문서/코드/SQL 수동 대조, `npm run check:moderation-wiring`, `npm run typecheck`
