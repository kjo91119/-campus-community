# 34. 기본 moderation 흐름 교차검증 지시서

이번 검토는 운영 제재의 전체 제품화를 보는 게 아니라, 현재 코드베이스에 들어간 최소 실제화 범위만 본다. 즉 `moderation_events`와 `apply_moderation_action(...)` SQL, `restricted/banned` 상태 반영, 로컬 데모 상태와 실제 운영 경계가 지금 단계에 맞게 정리됐는지 검토해라.

## 답변 작성 위치

- 답변은 `docs/34-basic-moderation-flow-review-brief-validation.md`에 작성해라.

## 꼭 읽을 파일

- `supabase/sql/07_add_moderation_actions.sql`
- `supabase/migrations/20260316191000_add_moderation_actions.sql`
- `lib/supabase/moderation.ts`
- `hooks/use-app-session.tsx`
- `app/(auth)/index.tsx`
- `app/(tabs)/profile.tsx`
- `docs/07-supabase-data-model-draft.md`
- `docs/08-auth-verification-moderation.md`
- `scripts/check-moderation-server-wiring.mjs`

## 이번 검토에서 특히 봐야 할 것

- `apply_moderation_action(...)`가 report review / content hidden / user restricted·banned·restored를 합리적으로 다루는지
- moderator/admin 권한 검증이 RPC 내부에 있는지
- comment hide/restore 시 `posts.comment_count` 재계산 경계가 빠지지 않았는지
- 앱이 `restricted`, `banned` 상태를 현재 UX 수준에서 정확히 안내하는지
- 프로필 화면의 상태 전환 버튼이 실제 운영 기능처럼 보이지 않도록 경계가 분명한지

## 이번 단계에서 구현하지 말아야 할 것

- 관리자 웹 대시보드
- 자동 제재 엔진
- 신고 누적 기반 자동 밴

## 답변 형식

반드시 아래 형식대로 답변 작성해라.

### 1. 핵심 발견사항
### 2. moderation 실제화 평가
### 3. 문서 / 코드 / SQL 충돌 여부
### 4. 운영 경계 평가
### 5. 지금 단계에서 구현하지 말아야 할 것
### 6. 바로 보완할 것
### 7. 최종 판단

마지막 줄에는 `검증:` 섹션으로 실행한 확인 항목을 적어라.
