# 37. 런치 준비 체크리스트 교차검증 지시서

이번 검토는 기능 구현 리뷰가 아니라 `docs/36-launch-readiness-guide.md`가 현재 코드/SQL/운영 기준에 맞는지 보는 문서 검증이다. QA, 시딩, 운영정책, 필수 SQL 적용 체크가 지금 코드베이스 상태와 어긋나지 않는지 확인해라.

## 답변 작성 위치

- 답변은 `docs/37-launch-readiness-checklist-review-brief-validation.md`에 작성해라.

## 꼭 읽을 파일

- `docs/36-launch-readiness-guide.md`
- `docs/08-auth-verification-moderation.md`
- `docs/10-metrics-and-analytics.md`
- `docs/16-supabase-connection-guide.md`
- `supabase/sql/04_secure_profiles_and_auth_rpcs.sql`
- `supabase/sql/05_add_profile_summary_rpc.sql`
- `supabase/sql/06_add_reports_blocks_rpcs.sql`
- `supabase/sql/07_add_moderation_actions.sql`
- `hooks/use-app-session.tsx`
- `hooks/use-community-data.tsx`

## 이번 검토에서 특히 봐야 할 것

- 체크리스트의 QA 항목이 현재 구현 범위를 정확히 반영하는지
- 시딩 기준이 server-first snapshot 구조와 맞는지
- 운영 / SLA / 개인정보 / 증빙 삭제 정책 항목이 현재 문서 세트와 충돌하지 않는지
- 적용해야 할 SQL 목록이 실제 최신 상태와 맞는지

## 이번 단계에서 구현하지 말아야 할 것

- 체크리스트를 제품 요구사항 문서로 다시 확대하는 작업
- 새로운 기능 범위를 추가하는 작업
- 운영자 도구 구현까지 같이 끌어오는 작업

## 답변 형식

반드시 아래 형식대로 답변 작성해라.

### 1. 핵심 발견사항
### 2. 런치 준비 체크리스트 평가
### 3. 문서 / 코드 / SQL 충돌 여부
### 4. QA / 시딩 / 정책 경계 평가
### 5. 지금 단계에서 구현하지 말아야 할 것
### 6. 바로 보완할 것
### 7. 최종 판단

마지막 줄에는 `검증:` 섹션으로 실행한 확인 항목을 적어라.
