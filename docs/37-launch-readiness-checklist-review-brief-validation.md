# 37. 런치 준비 체크리스트 교차검증 검증 결과

### 1. 핵심 발견사항

- 중요: 체크리스트의 "출시 전 필수 SQL 적용 체크"가 최신 기준과 맞지 않는다. `supabase/migrations/20260316120000_create_profiles.sql`가 빠져 있는데, 이후 SQL과 auth/moderation 흐름은 `public.profiles`를 전제로 한다. 관련: `docs/36-launch-readiness-checklist.md:11-17`, `supabase/migrations/20260316120000_create_profiles.sql`
- 중요: 로컬 SQL 세트에는 `supabase/sql/03_create_verifications.sql`가 남아 있고 이 파일은 `03 -> 04` 순서를 명시하지만, 체크리스트는 이를 전혀 언급하지 않는다. 현재 상태로는 fresh DB 기준 적용 경로가 문서상 완결되지 않았다. 관련: `supabase/sql/03_create_verifications.sql:1-3`, `supabase/sql/04_secure_profiles_and_auth_rpcs.sql`
- 반대로 QA, 시딩, 정책 섹션은 기존 validation이 지적했던 것보다 현재 코드와 잘 맞는다. `boards.is_active`, 작성자 요약용 `profiles`, banned QA 재현 경로가 이미 체크리스트에 들어 있다. 관련: `docs/36-launch-readiness-checklist.md:35-38`, `docs/36-launch-readiness-checklist.md:69-80`

### 2. 런치 준비 체크리스트 평가

- `SQL 목록만 고치면 사용 가능함`
- 운영/SLA/증빙 삭제/analytics 최소 기준은 `docs/08-auth-verification-moderation.md`, `docs/10-metrics-and-analytics.md`와 크게 어긋나지 않는다.
- 시딩과 QA 부분도 현재 코드 의존성을 이미 꽤 정확히 반영하고 있다.

### 3. 문서 / 코드 / SQL 충돌 여부

- `실제 충돌 있음`
- 체크리스트는 필수 migration을 `20260316153000`부터 적고 있어 `public.profiles` 생성 migration을 누락했다.
- 또한 "로컬 SQL 파일은 같은 내용을 유지한다"는 메모와 달리, 현재 `supabase/sql/03_create_verifications.sql`에는 대응 migration이 없다.

### 4. QA / 시딩 / 정책 경계 평가

- `대체로 적절함`
- 수동 인증 SLA, 증빙 삭제 기준, 신고/제재 운영 기준은 `docs/08-auth-verification-moderation.md`와 일치한다.
- analytics 최소 기준도 현재 구현된 로컬 버퍼 전략과 맞다. 관련: `docs/36-launch-readiness-checklist.md:96-113`, `hooks/use-analytics.tsx:63-123`
- 시딩은 `posts/comments/recruitments`뿐 아니라 `boards.is_active`와 작성자 요약용 `profiles`까지 챙겨야 한다는 점을 이미 문서에 반영하고 있다. 관련: `docs/36-launch-readiness-checklist.md:69-80`
- banned QA도 `apply_moderation_action('user_banned', ...)` 경로를 함께 적어 두어 현재 앱 구조와 맞다. 관련: `docs/36-launch-readiness-checklist.md:35-38`

### 5. 지금 단계에서 구현하지 말아야 할 것

- 체크리스트를 제품 요구사항 문서로 다시 확대하는 작업
- 새로운 기능 범위를 추가하는 작업
- 운영자 도구 구현까지 같이 끌어오는 작업

### 6. 바로 보완할 것

- 필수 SQL 목록에 `supabase/migrations/20260316120000_create_profiles.sql`를 추가
- `supabase/sql/03_create_verifications.sql`에 대응 migration을 만들거나, 체크리스트에 `03_create_verifications.sql -> 04_secure_profiles_and_auth_rpcs.sql` 수동 적용 순서를 명시
- `docs/16-supabase-connection-prep.md`와 `docs/36-launch-readiness-checklist.md`의 SQL 적용 경로 설명을 같은 기준으로 맞추기

### 7. 최종 판단

- 문서의 QA, 시딩, 정책 방향은 맞다.
- 다만 fresh DB 기준 SQL 부트스트랩 목록이 불완전해서, 이 상태로는 authoritative launch checklist라고 보기 어렵다. SQL 적용 경로를 먼저 바로잡아야 한다.

검증: `docs/36-launch-readiness-checklist.md`와 관련 문서/SQL/코드 수동 대조, `rg --files supabase/migrations supabase/sql`, `npm run check:moderation-wiring`, `npm run check:analytics`, `npm run typecheck`
