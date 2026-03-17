# 28. 작성자 프로필 요약 하드닝 교차검증 지시서

문서 목적: 다른 AI 또는 리뷰어가 현재 `campus-community` 저장소에 반영된 `작성자 프로필 요약 하드닝` 작업을 코드와 문서 기준으로 교차검증할 때, 무엇을 어떤 기준으로 봐야 하는지 명확하게 전달한다.

아래 내용을 그대로 복사해서 다른 모델에게 전달해도 된다.
단, 이 지시서만 보내면 충분한 것이 아니라 검토 대상 코드와 관련 문서 원문도 함께 제공하거나, 같은 저장소/워크스페이스에 접근 가능한 환경에서 사용해야 한다.

---

너는 지금 Expo + TypeScript 기반 앱 프로젝트 `campus-community`의 외부 코드 리뷰어다.

이번 검토의 목적은 "새 기능 제안"이 아니라, 방금 반영된 `작성자 프로필 요약 하드닝`이 다음 기준을 만족하는지 점검하는 것이다.

## 현재 구현 목표 요약

이번 단계에서 구현한 것은 아래 범위다.

- 작성자 요약 RPC 호출 전에 non-UUID mock 작성자 id가 섞여 실패하지 않도록 방어
- `authorProfiles` 저장 상태가 mock seed를 계속 끌고 다니지 않도록 store/remote 경계를 정리
- 글 상세와 모집 상세에서 최소 작성자 요약 블록을 실제로 렌더
- 익명 글/모집에서는 작성자 요약을 숨기고, 일반 글/모집에서만 닉네임/전공군/학교를 보여주도록 정리

중요:

- 이번 단계는 `작성자 요약 서버 우선 읽기`를 실제 동작과 UI까지 닫는 하드닝 단계다.
- `profiles` 전체 공개 정책을 여는 단계가 아니다.
- 공개 프로필 화면, 프로필 탭 확장, 실명/학번/학생증 정보 노출은 이번 범위가 아니다.
- universities / major_groups 실테이블 도입과 FK 정규화도 이번 범위가 아니다.

## 검토 대상 코드 파일

- `hooks/use-community-data.tsx`
- `lib/supabase/profiles.ts`
- `app/(tabs)/posts/[postId].tsx`
- `app/(tabs)/recruitments/[recruitmentId].tsx`
- `supabase/sql/05_add_profile_summary_rpc.sql`
- `docs/09-screen-list-and-prd.md`

## 함께 참고할 문서

- `docs/07-supabase-data-model-draft.md`
- `docs/08-auth-verification-moderation.md`
- `docs/09-screen-list-and-prd.md`
- `docs/27-author-profile-summaries-review-brief.md`
- `TASKS.md`

## 리뷰 목표

아래 항목을 중심으로 검토해라.

1. 작성자 요약 RPC에 non-UUID mock id가 섞여도 실제 호출이 깨지지 않는가
2. `authorProfiles`의 seed/store/remote 경계가 이전보다 명확해졌는가
3. hydrate 이후 remote author summary가 mock fallback보다 우선되는가
4. 글 상세와 모집 상세가 문서의 "작성자 정보 요약" 요구를 최소 범위에서 충족하는가
5. 익명 글에서 작성자 요약이 과하게 노출되지 않는가

## 특히 강하게 봐야 할 포인트

### A. RPC 입력 안정성

- `list_profile_summaries(...)`에 전달되는 id가 uuid[] 제약을 깨지 않는가
- mock seed의 string id가 runtime에서 섞여도 RPC 실패의 원인이 되지 않는가
- 클라이언트와 저장소 양쪽에서 방어가 적절히 들어갔는가

### B. authorProfiles 저장 경계

- `authorProfiles` 초기 상태가 더 이상 mock seed 자체를 source of truth처럼 들고 있지 않는가
- remote/store 값이 있으면 그것이 우선되고, mock은 lookup fallback 정도로만 남는가
- 이전 저장 버전이 남아 있어도 stale mock summary가 계속 authoritative하게 남지 않는가

### C. 화면 의미

- 글 상세와 모집 상세에 최소 작성자 요약 블록이 실제로 렌더되는가
- 익명 글/모집은 작성자 요약을 숨기고, 비익명 글/모집만 닉네임/전공군/학교를 보여주는가
- "작성자 정보가 없음"과 "익명이라 숨김"이 혼동되지 않는가

### D. 범위 관리

- 이번 단계에 공개 프로필 화면, 운영자 프로필 관리, 실명/민감정보 노출 같은 과범위 구현이 섞이지 않았는가
- 여전히 최소 공개 범위와 RPC 중심 접근이 유지되는가

## 원하는 응답 형식

반드시 아래 형식으로 답해라.

### 1. 핵심 발견사항

- 심각도 순서대로 정리
- 각 항목마다 관련 파일명을 명시
- 왜 문제가 되는지 짧고 명확하게 설명

### 2. 작성자 요약 하드닝 평가

- 적절함 / 약간 위험함 / 더 보완 필요
- 이유를 3~5줄로 설명

### 3. 문서 / 코드 / SQL 충돌 여부

- 충돌 있음 / 없음
- 있다면 어떤 문서와 어떤 코드 또는 SQL이 어긋나는지 구체적으로

### 4. 저장 경계 평가

- authorProfiles의 remote/store/fallback 경계가 현재 단계에서 적절한지 평가
- 다음 단계 공개 프로필 화면 확장 시 위험할 수 있는 부분이 있으면 지적

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

- 스타일 취향보다 `uuid[] RPC 입력 안정성`, `authorProfiles 저장 경계`, `익명 글의 작성자 요약 노출 범위`, `PRD와 실제 상세 화면 일치`, `과범위 확장 방지`를 더 중요하게 봐라.
- 새 기능 제안보다, 현재 하드닝이 작성자 요약 경로를 실제 서비스 기준으로 안정화했는지를 먼저 검토해라.
