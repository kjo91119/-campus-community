# 33. reports / blocks 서버 연결 교차검증 검증 결과

### 1. 핵심 발견사항

- 블로킹 이슈는 없었다. `reportTarget()`, `blockProfile()`, `unblockProfile()`는 Supabase 준비 + 커뮤니티 접근 가능 상태에서 RPC를 먼저 시도하고, 네트워크 실패일 때만 로컬 fallback으로 내려간다. 관련: `hooks/use-community-data.tsx:1566-1717`, `lib/supabase/moderation.ts`
- hydrate는 `list_my_reports()` / `list_my_blocks()` 성공 결과를 persisted 로컬 상태보다 우선 적용한다. 관련: `hooks/use-community-data.tsx:775-805`
- self-report 금지 규칙은 화면이 아니라 provider와 SQL 양쪽에 있다. 관련: `hooks/use-community-data.tsx:1523-1564`, `supabase/sql/06_add_reports_blocks_rpcs.sql:92-127`
- 차단된 작성자 요약이 resolve되지 않아도 차단 목록과 차단 해제 UI는 유지된다. 관련: `lib/community/report-block-state.ts`, `app/(tabs)/profile.tsx:88-116`

### 2. reports / blocks 서버 연결 평가

- `안전함`
- 클라이언트 레이어는 `listMyReports()`, `listMyBlocks()`, `submitReport()`, `blockProfileRemote()`, `unblockProfileRemote()`를 RPC 경로로 호출한다. 관련: `lib/supabase/moderation.ts`
- provider는 Supabase가 준비되고 커뮤니티 접근 조건이 맞으면 신고/차단 hydrate와 mutation을 모두 원격 우선으로 처리한다. 관련: `hooks/use-community-data.tsx:775-805`, `hooks/use-community-data.tsx:1566-1717`
- SQL도 `submit_report`, `block_profile`, `unblock_profile`, `list_my_reports`, `list_my_blocks`를 `security definer` RPC로 닫아 두고 있다. 관련: `supabase/sql/06_add_reports_blocks_rpcs.sql`

### 3. 문서 / 코드 / SQL 충돌 여부

- `충돌 없음`
- 브리프가 요구한 RPC 우선 저장, self-report 금지, hydrate 시 서버 우선, unresolved blocked profile 유지 조건이 코드와 SQL에서 모두 확인된다.
- SQL 원본과 migration도 같은 내용으로 유지되고 있다. 관련: `supabase/sql/06_add_reports_blocks_rpcs.sql`, `supabase/migrations/20260316190000_add_reports_blocks_rpcs.sql`

### 4. 저장 / fallback 경계 평가

- `적절함`
- `server_rejected`와 `network`는 분리되어 있다. 서버 거절이면 즉시 실패를 돌려주고, 네트워크 실패일 때만 로컬 fallback으로 내려간다. 관련: `lib/supabase/moderation.ts`, `hooks/use-community-data.tsx:1594-1599`, `hooks/use-community-data.tsx:1655-1660`, `hooks/use-community-data.tsx:1711-1716`
- hydrate에서는 원격 `reports` / `blocks` 조회 성공 시 persisted 로컬 배열을 덮어쓴다. 관련: `hooks/use-community-data.tsx:775-805`
- 차단 필터는 상세 접근, 목록, 댓글 목록 모두에서 같은 `blockedProfileIds` 집합을 사용한다. 관련: `hooks/use-community-data.tsx:905-1079`

### 5. 지금 단계에서 구현하지 말아야 할 것

- 운영자용 신고 검토 UI
- 오프라인 재전송 큐와 충돌 해결
- `reports` / `blocks`를 다시 직접 table insert 방식으로 여는 작업

### 6. 바로 보완할 것

- 필수 수정은 없다.
- 다만 hydrate 시 원격 `reports` / `blocks`가 persisted state를 실제로 덮는지까지 보는 런타임 테스트가 추가되면 회귀 방지가 더 좋아진다.
- `server_rejected`와 `network fallback` 분기도 현재는 정적 검사 비중이 높으므로, 실행 기반 테스트가 하나 있으면 더 안전하다.

### 7. 최종 판단

- 현재 상태로 다음 단계에 넘겨도 된다.
- 이번 범위의 핵심 경계인 RPC 우선 저장, fallback 제한, self-report 방지, unresolved blocked profile 유지가 모두 닫혀 있다.

검증: 지정 브리프의 코드/SQL/문서 수동 대조, `cmp -s supabase/sql/06_add_reports_blocks_rpcs.sql supabase/migrations/20260316190000_add_reports_blocks_rpcs.sql`, `npm run check:community-safety`, `npm run check:moderation-wiring`, `npm run typecheck`
