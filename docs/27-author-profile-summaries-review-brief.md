# 27. 작성자 프로필 요약 서버 우선 전환 교차검증 지시서

문서 목적: 다른 AI 또는 리뷰어가 현재 `campus-community` 저장소에 반영된 `작성자 프로필 요약 서버 우선 전환` 작업을 코드와 문서 기준으로 교차검증할 때, 무엇을 어떤 기준으로 봐야 하는지 명확하게 전달한다.

아래 내용을 그대로 복사해서 다른 모델에게 전달해도 된다.
단, 이 지시서만 보내면 충분한 것이 아니라 검토 대상 코드와 관련 문서 원문도 함께 제공하거나, 같은 저장소/워크스페이스에 접근 가능한 환경에서 사용해야 한다.

---

너는 지금 Expo + TypeScript 기반 앱 프로젝트 `campus-community`의 외부 코드 리뷰어다.

이번 검토의 목적은 "새 기능 제안"이 아니라, 방금 반영된 `작성자 프로필 요약 서버 우선 전환`이 다음 기준을 만족하는지 점검하는 것이다.

## 현재 구현 목표 요약

이번 단계에서 구현한 것은 아래 범위다.

- 글/댓글 작성자 닉네임과 전공/학교 요약을 mock 직접 참조만 하던 구조에서, Supabase RPC 우선 읽기 구조로 정리
- `profiles` 전체 select 정책을 넓히지 않고, 작성자 노출에 필요한 최소 요약만 반환하는 `list_profile_summaries(...)` RPC 추가
- `CommunityProvider`가 `authorProfiles`를 별도 상태와 로컬 캐시로 유지하도록 정리
- hydrate 시 posts/comments 작성자 id를 모아 요약 프로필을 서버에서 읽고, 실패 시 기존 seed/store fallback 유지
- 현재 로그인 사용자 프로필 요약은 provider 안에서 항상 최신 상태로 덮어쓰기

중요:

- 이번 단계는 작성자 표시용 최소 공개 정보 읽기 경로 정리가 목적이다.
- `profiles` 전체 공개 select 정책을 여는 단계가 아니다.
- 실명, 학번, 학생증 파일, 운영자 승인 기능은 이번 범위가 아니다.
- 공개 프로필 완성이나 프로필 화면 확장은 아직 다음 단계다.

## 검토 대상 코드 파일

- `hooks/use-community-data.tsx`
- `lib/supabase/profiles.ts`
- `types/domain.ts`
- `supabase/sql/05_add_profile_summary_rpc.sql`
- `supabase/migrations/20260316180000_add_profile_summary_rpc.sql`
- `docs/07-supabase-data-model-draft.md`

## 함께 참고할 문서

- `docs/07-supabase-data-model-draft.md`
- `docs/08-auth-verification-moderation.md`
- `docs/09-screen-list-and-prd.md`
- `docs/12-open-questions.md`
- `TASKS.md`

## 리뷰 목표

아래 항목을 중심으로 검토해라.

1. 작성자 표시용 프로필 요약이 더 이상 mock 직접 lookup에만 의존하지 않는가
2. `profiles` 전체 공개 없이도 필요한 작성자 정보만 최소 범위로 읽는가
3. provider가 `authorProfiles`를 서버 우선으로 hydrate 하고, 실패 시 안전하게 fallback 하는가
4. 현재 로그인 사용자의 최신 닉네임/전공/학교가 요약 캐시에 잘 반영되는가
5. 이번 단계에 과한 프로필 공개, 운영 기능, 실명/민감정보 노출 같은 범위 초과가 섞이지 않았는가

## 특히 강하게 봐야 할 포인트

### A. 서버 권한과 공개 범위

- `list_profile_summaries(...)`가 `profiles` 전체 row를 그대로 열지 않는가
- 인증되지 않은 사용자가 RPC를 호출해 작성자 요약을 읽을 수 없는가
- banned 사용자가 결과에 포함되지 않는가
- 반환 컬럼이 닉네임, 전공/학교 id, verification 상태 정도의 최소 범위로 제한되는가

### B. provider 저장 경계

- `authorProfiles`가 community store에 함께 저장되는가
- hydrate 시 remote snapshot 기준 author ids를 모아서 summaries를 읽는가
- RPC 실패 시 기존 seed/store fallback으로 표시가 깨지지 않는가
- 현재 로그인 사용자의 최신 프로필 요약이 stale cache보다 우선되는가

### C. 화면 의미와 fallback

- 글 상세/댓글/모집 상세에서 작성자 닉네임이 현재 단계 목적에 맞게 노출되는가
- 서버 작성자 요약을 못 읽어도 즉시 치명적으로 깨지지 않는가
- mock 작성자와 실제 Supabase 작성자가 섞여도 최소한의 표시 일관성이 유지되는가

### D. 범위 관리

- 이번 단계에 공개 프로필 화면 확장, universities 실테이블 도입, 운영자용 프로필 도구 같은 과범위 구현이 섞이지 않았는가
- `profiles` select 정책을 넓히는 대신 RPC로 최소 공개 범위를 유지하는 방향이 지켜졌는가

## 원하는 응답 형식

반드시 아래 형식으로 답해라.

### 1. 핵심 발견사항

- 심각도 순서대로 정리
- 각 항목마다 관련 파일명을 명시
- 왜 문제가 되는지 짧고 명확하게 설명

### 2. 작성자 요약 공개 범위 평가

- 적절함 / 약간 위험함 / 더 보완 필요
- 이유를 3~5줄로 설명

### 3. 문서 / 코드 / SQL 충돌 여부

- 충돌 있음 / 없음
- 있다면 어떤 문서와 어떤 코드 또는 SQL이 어긋나는지 구체적으로

### 4. 저장 경계 평가

- authorProfiles의 remote/store/seed fallback 구조가 현재 단계에서 적절한지 평가
- 다음 단계 실제 프로필 화면 확장 시 위험할 수 있는 부분이 있으면 지적

### 5. 지금 단계에서 구현하지 말아야 할 것

- 다음 단계로 미뤄야 하는 항목
- 현재 코드에 추가되면 범위를 키우는 항목

### 6. 바로 보완할 것

- 지금 당장 수정 추천 3개 이내

### 7. 최종 판단

아래 두 문장을 반드시 포함해라.

1. "이 구현 상태로 커뮤니티 읽기 경로 다음 단계에 들어가도 되는가?"
2. "들어가기 전에 먼저 수정해야 할 상위 3개 항목"

## 리뷰 원칙

- 스타일 취향보다 `최소 공개 범위`, `profiles 전체 공개 방지`, `authorProfiles 저장 경계`, `seed/store/remote fallback`, `과범위 확장 방지`를 더 중요하게 봐라.
- 새 기능 제안보다, 현재 전환이 작성자 요약을 서버 우선으로 읽으면서도 공개 범위를 최소화했는지를 먼저 검토해라.
