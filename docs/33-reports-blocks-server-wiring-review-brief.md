# 33. reports / blocks 서버 연결 교차검증 지시서

이번 검토는 로컬 신고/차단 MVP를 Supabase `reports` / `blocks` RPC 경로와 연결한 현재 상태만 본다. 운영 제재 UI나 outbox sync 같은 다음 단계는 일부러 제외하고, 지금 단계에서 서버 우선 저장 경계가 맞게 닫혔는지 확인해라.

## 답변 작성 위치

- 답변은 `docs/33-reports-blocks-server-wiring-review-brief-validation.md`에 작성해라.

## 꼭 읽을 파일

- `supabase/sql/06_add_reports_blocks_rpcs.sql`
- `supabase/migrations/20260316190000_add_reports_blocks_rpcs.sql`
- `lib/supabase/moderation.ts`
- `hooks/use-community-data.tsx`
- `lib/community/report-block-state.ts`
- `app/(tabs)/posts/[postId].tsx`
- `app/(tabs)/recruitments/[recruitmentId].tsx`
- `app/(tabs)/profile.tsx`
- `scripts/check-moderation-server-wiring.mjs`
- `scripts/check-community-safety-tools.mjs`

## 이번 검토에서 특히 봐야 할 것

- `reportTarget()`, `blockProfile()`, `unblockProfile()`가 Supabase 준비 상태에서는 RPC를 우선 쓰는지
- `server_rejected`와 `network fallback`이 구분되는지
- hydrate 때 `list_my_reports()` / `list_my_blocks()` 결과가 로컬 persisted state보다 우선하는지
- blocked profile summary가 resolve되지 않아도 차단 목록과 차단 해제 UI가 유지되는지
- self-report 금지 규칙이 화면이 아니라 provider 레벨에 있는지

## 이번 단계에서 구현하지 말아야 할 것

- 운영자용 신고 검토 UI
- 오프라인 재전송 큐 / 충돌 해결
- reports / blocks를 다시 직접 table insert 방식으로 여는 작업

## 답변 형식

반드시 아래 형식대로 답변 작성해라.

### 1. 핵심 발견사항
### 2. reports / blocks 서버 연결 평가
### 3. 문서 / 코드 / SQL 충돌 여부
### 4. 저장 / fallback 경계 평가
### 5. 지금 단계에서 구현하지 말아야 할 것
### 6. 바로 보완할 것
### 7. 최종 판단

마지막 줄에는 `검증:` 섹션으로 실행한 확인 항목을 적어라.
