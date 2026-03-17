# 29. 작성자 프로필 캐시 무효화 교차검증 지시서

문서 목적: 다른 AI 또는 리뷰어가 현재 `campus-community` 저장소에 반영된 `작성자 프로필 캐시 무효화` 보강 작업을 코드와 문서 기준으로 교차검증할 때, 무엇을 어떤 기준으로 봐야 하는지 명확하게 전달한다.

아래 내용을 그대로 복사해서 다른 모델에게 전달해도 된다.

---

너는 지금 Expo + TypeScript 기반 앱 프로젝트 `campus-community`의 외부 코드 리뷰어다.

이번 검토의 목적은 "새 기능 제안"이 아니라, 방금 반영된 `작성자 프로필 캐시 무효화`가 다음 기준을 만족하는지 점검하는 것이다.

## 현재 구현 목표 요약

- `list_profile_summaries(...)` RPC 성공 시, 현재 필요한 작성자 집합을 기준으로 `authorProfiles`를 다시 구성
- 원격 결과에 없는 UUID 작성자 요약은 stale cache로 남지 않게 prune
- current user summary는 항상 최신 상태로 유지
- mock/non-UUID 작성자는 source of truth가 아니라 fallback lookup 범위로 유지
- 이 경계가 다시 무너지지 않도록 간단한 회귀 체크 스크립트 추가

중요:

- 이번 단계는 `authorProfiles` cache invalidation을 닫는 하드닝 단계다.
- 공개 프로필 화면, 운영자 프로필 도구, `profiles` 전체 공개는 이번 범위가 아니다.

## 검토 대상 코드 파일

- `hooks/use-community-data.tsx`
- `lib/community/author-profile-cache.ts`
- `lib/supabase/profiles.ts`
- `scripts/check-author-profile-summaries.mjs`
- `app/(tabs)/posts/[postId].tsx`
- `app/(tabs)/recruitments/[recruitmentId].tsx`

## 함께 참고할 문서

- `docs/09-screen-list-and-prd.md`
- `docs/27-author-profile-summaries-review-brief.md`
- `docs/28-author-profile-summary-hardening-review-brief.md`

## 리뷰 목표

1. 원격 RPC 성공 뒤 stale UUID author summary가 store에 남지 않는가
2. current user summary가 remote/store 값보다 안정적으로 우선되는가
3. non-UUID mock 작성자는 fallback lookup으로만 남고, RPC 입력에는 섞이지 않는가
4. 글 상세와 모집 상세의 작성자 요약 표시가 여전히 익명 정책과 맞는가
5. 회귀 체크 스크립트가 이번 경계를 다시 무너뜨리는 변경을 어느 정도 감지할 수 있는가

## 특히 강하게 봐야 할 포인트

### A. cache invalidation

- remote hydrate 성공 시 `authorProfiles`가 merge-only가 아니라 authoritative rebuild에 가깝게 동작하는가
- banned/removed 작성자가 SQL 결과에서 빠졌을 때, 이전 UUID cache가 계속 남지 않는가

### B. current user 우선순위

- 현재 로그인 사용자의 최신 요약이 remote 결과보다 늦게 덮어써지더라도 최종 상태가 current user 우선으로 수렴하는가

### C. fallback 경계

- mock/non-UUID 작성자는 lookup fallback 범위로만 남고, `authorProfiles` 저장 경계를 흐리지 않는가
- uuid[] RPC 입력에는 non-UUID가 섞이지 않는가

### D. 회귀 체크

- `scripts/check-author-profile-summaries.mjs`가 이번 하드닝의 핵심 포인트를 최소한으로 감시하는가
- 체크 범위가 과하게 넓어 개발을 불필요하게 막지는 않는가

## 원하는 응답 형식

반드시 아래 형식으로 답해라.

### 1. 핵심 발견사항

- 심각도 순서대로 정리
- 각 항목마다 관련 파일명을 명시
- 왜 문제가 되는지 짧고 명확하게 설명

### 2. 캐시 무효화 평가

- 적절함 / 약간 위험함 / 더 보완 필요
- 이유를 3~5줄로 설명

### 3. 문서 / 코드 충돌 여부

- 충돌 있음 / 없음
- 있다면 어떤 문서와 어떤 코드가 어긋나는지 구체적으로

### 4. 저장 경계 평가

- `authorProfiles`의 remote/store/fallback/prune 경계가 현재 단계에서 적절한지 평가
- 다음 단계 공개 프로필 확장 전에 남는 위험이 있으면 지적

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

- 스타일 취향보다 `stale UUID author summary prune`, `current user summary 우선`, `uuid[] RPC 입력 안정성`, `fallback 경계`, `과범위 확장 방지`를 더 중요하게 봐라.
