# 31. Community Snapshot Server-First Review Brief

## 목적

`posts`, `comments`, `recruitments` 읽기 경로에서 remote snapshot이 성공했을 때 seed/stored state와 merge하지 않고 서버 결과를 authoritative하게 반영하도록 정리한 단계를 교차검증한다. 이번 단계의 핵심은 boards 때와 같은 규칙을 community rows에도 적용해서, 서버에서 더 이상 보이지 않는 콘텐츠가 seed나 오래된 로컬 캐시에 남지 않게 만드는 것이다.

## 이번 단계에서 검증할 것

1. `CommunityProvider`가 remote community snapshot 성공 시 `posts/comments/recruitments`를 merge가 아니라 replacement로 반영하는지 확인
2. fallback은 여전히 유지하되, fallback은 remote 실패 또는 미연결 상태에서만 쓰이는지 확인
3. stored state 파싱이 더 이상 seed와 무조건 merge되지 않는지 확인
4. 작성/댓글/모집 작성 액션이 현재 단계에서 이 변경과 충돌하지 않는지 확인
5. local fallback write를 `임시 demo 상태`로 볼지, `나중에 서버 재전송할 대상`으로 볼지 정책이 코드와 문서에 명시되어 있는지 확인
6. 회귀 체크가 remote replacement 경계를 실제로 고정하는지 확인

## 꼭 읽을 파일

- `hooks/use-community-data.tsx`
- `lib/community/community-state-cache.ts`
- `lib/supabase/community.ts`
- `lib/supabase/posts.ts`
- `lib/supabase/comments.ts`
- `lib/supabase/recruitments.ts`
- `scripts/check-community-snapshot-cache.mjs`
- `data/mock-community.ts`

## 함께 참고할 문서

- `docs/09-screen-list-and-prd.md`
- `docs/11-roadmap.md`
- `docs/21-posts-comments-implementation-review-brief.md`
- `docs/22-recruitments-implementation-review-brief.md`
- `docs/26-boards-server-first-review-brief.md`
- `TASKS.md`

## 리뷰어에게 요청할 체크 포인트

### A. remote replacement 규칙

- remote snapshot 성공 시 stale seed/stored rows가 남지 않는가
- `posts/comments/recruitments` 각 컬렉션이 함께 authoritative replacement 되는가
- remote 실패일 때만 local persisted state 또는 seed fallback이 사용되는가
- local fallback write가 현재 단계에서 `임시 상태`라는 점이 코드상/문서상 드러나는가

### B. fallback과 저장 경계

- `parseCommunityState()`가 더 이상 stored state를 seed와 무조건 merge하지 않는가
- 이전 캐시가 있어도 remote 성공 시 결국 서버 결과로 수렴하는가
- 로컬 저장은 다음 실행의 fallback 용도이고, remote 성공 경로를 가리지 않는가

### C. 범위 관리

- 이번 단계에서 신고/차단/운영 제재, universities 실테이블, major_groups 실테이블 같은 다음 단계 범위가 섞이지 않았는가
- 작성 액션의 서버 저장 실패 처리 정책을 새로 크게 바꾸지 않았는가

## 원하는 답변 형식

반드시 아래 형식대로 답변 작성해라.

### 1. 핵심 발견사항

- 심각도 순서대로 정리
- 관련 파일 경로를 함께 적기
- 왜 문제가 되는지 짧게 설명

### 2. community snapshot server-first 평가

- 적절함 / 약간 위험함 / 더 보완 필요
- 이유를 3~5줄로 설명

### 3. 문서 / 코드 충돌 여부

- 충돌 있음 / 없음
- 있다면 어떤 문서와 어떤 코드가 어긋나는지 구체적으로

### 4. 저장 / fallback 경계 평가

- seed / stored state / remote snapshot 경계가 현재 단계에서 적절한지 평가
- 다음 단계 실제 community read path 확장 시 위험할 수 있는 부분이 있으면 지적

### 5. 지금 단계에서 구현하지 말아야 할 것

- 다음 단계로 미뤄야 하는 항목
- 현재 코드에 추가되면 범위를 키우는 항목

### 6. 바로 보완할 것

- 지금 당장 수정 추천 3개 이내

### 7. 최종 판단

아래 두 문장을 반드시 포함해라.

1. "이 구현 상태로 커뮤니티 읽기 경로 다음 단계에 들어가도 되는가?"
2. "들어가기 전에 먼저 수정해야 할 상위 3개 항목"
