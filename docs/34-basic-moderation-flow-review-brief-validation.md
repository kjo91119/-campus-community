# 34. 기본 moderation 흐름 교차검증 검증 결과

### 1. 핵심 발견사항

- 중간: `apply_moderation_action(...)`는 `p_report_id`가 들어오면 해당 신고를 `resolved`로 닫지만, 그 신고가 현재 `p_target_type` / `p_target_id`와 실제로 연결된 신고인지 검증하지 않는다. 잘못된 `report_id`를 넘기면 무관한 신고가 함께 닫힐 수 있다. 관련: `supabase/sql/07_add_moderation_actions.sql:181-197`
- 그 외 핵심 경계는 맞다. moderator/admin 권한 검증, comment hide/restore 시 `posts.comment_count` 재계산, restricted/banned UX, 프로필의 로컬 데모 경계 문구가 모두 확인된다. 관련: `supabase/sql/07_add_moderation_actions.sql:71-176`, `hooks/use-app-session.tsx:575-639`, `app/(auth)/index.tsx:95-113`, `app/(tabs)/profile.tsx:119-137`

### 2. moderation 실제화 평가

- `대체로 적절함`
- `apply_moderation_action(...)`는 report review, content hidden/restore, user restricted/banned/restored를 한 RPC에 모아 두고 있다. 관련: `supabase/sql/07_add_moderation_actions.sql:75-219`
- RPC 내부 moderator/admin 권한 검증은 잘 들어가 있다. 관련: `supabase/sql/07_add_moderation_actions.sql:62-73`
- comment hide/restore 시 `posts.comment_count` 재계산도 빠지지 않았다. 관련: `supabase/sql/07_add_moderation_actions.sql:115-138`
- `restricted`는 읽기 허용 + 쓰기 차단, `banned`는 커뮤니티 진입 차단으로 앱 경계가 구현돼 있다. 관련: `hooks/use-app-session.tsx:575-583`, `app/(auth)/index.tsx:95-113`, `app/(tabs)/_layout.tsx`

### 3. 문서 / 코드 / SQL 충돌 여부

- `작은 충돌 있음`
- `docs/07-supabase-data-model-draft.md`와 `docs/08-auth-verification-moderation.md`의 큰 방향은 현재 SQL/코드와 맞다.
- 다만 `docs/08-auth-verification-moderation.md:152-154`는 `p_report_id`가 "연계 신고"를 같은 RPC 안에서 닫는다고 읽히는데, 실제 SQL은 그 `report_id`가 현재 moderation target과 연결된 신고인지 검증하지 않는다.

### 4. 운영 경계 평가

- `적절함`
- 실제 운영 조치는 RPC에만 있고, 앱에는 관리자 UI가 없다. 이 점 자체는 이번 단계 범위와 맞다.
- 프로필 화면의 상태 전환 버튼은 서버 moderation UI가 아니라 로컬 데모 제어임을 명시하고, 실제로 `profileStorageMode`도 `local_cache`로 내려간다. 관련: `hooks/use-app-session.tsx:972-980`, `app/(tabs)/profile.tsx:119-130`
- `restricted` / `banned` 안내도 auth 시작 화면과 탭 접근 차단에서 일관되게 드러난다. 관련: `app/(auth)/index.tsx:95-113`, `app/(tabs)/_layout.tsx`

### 5. 지금 단계에서 구현하지 말아야 할 것

- 관리자 웹 대시보드
- 자동 제재 엔진
- 신고 누적 기반 자동 밴

### 6. 바로 보완할 것

- `p_report_id`를 받았을 때 현재 moderation target과 실제로 연결된 신고인지 검증한 뒤에만 `resolved`로 닫도록 보완
- 이 경계는 운영 실수에 취약하므로, 무관한 `report_id`를 넘겼을 때 실패하는 회귀 테스트를 하나 두는 편이 안전하다.

### 7. 최종 판단

- 현재 골격은 이번 단계 목적에 맞게 들어가 있다.
- 다만 `p_report_id` 연계 검증이 없어서 "연계 신고 자동 종결"의 의미가 약하다. 이 한 군데는 먼저 보완하는 편이 안전하다.

검증: 지정 브리프의 SQL/코드/문서 수동 대조, `cmp -s supabase/sql/07_add_moderation_actions.sql supabase/migrations/20260316191000_add_moderation_actions.sql`, `npm run check:moderation-wiring`, `npm run typecheck`
