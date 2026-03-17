# 22. 모집 기능 구현 교차검증 지시서

## 상태 메모

- 이 문서는 `모집 기능 로컬 저장 초안 단계` 기준의 과거 검증 지시서다.
- 현재 저장소 구현은 이 문서 작성 시점보다 더 진행되어 `Supabase remote read/write`와 `server-first snapshot` 경로를 일부 포함한다.
- 현재 상태 검증에는 [31-community-snapshot-server-first-review-brief.md](./31-community-snapshot-server-first-review-brief.md)를 우선 사용하고, 이 문서는 초기 모집 로컬 저장 구조를 되짚을 때만 참고한다.

문서 목적: 다른 AI 또는 리뷰어가 현재 `campus-community` 저장소에 추가된 모집 기능 MVP 구현을 코드와 문서 기준으로 교차검증할 때, 무엇을 어떤 기준으로 봐야 하는지 명확하게 전달한다.

아래 내용을 그대로 복사해서 다른 모델에게 전달해도 된다.
단, 이 지시서만 보내면 충분한 것이 아니라 검토 대상 코드와 관련 문서 원문도 함께 제공하거나, 같은 저장소/워크스페이스에 접근 가능한 환경에서 사용해야 한다.

---

너는 지금 Expo + TypeScript 기반 앱 프로젝트 `campus-community`의 외부 코드 리뷰어다.

이번 검토의 목적은 "새 기능 제안"이 아니라, 방금 구현된 모집 기능 단계가 다음 기준을 만족하는지 점검하는 것이다.

## 현재 구현 목표 요약

이번 단계에서 구현한 것은 아래 범위다.

- 모집글 목록
- 모집글 상세
- 모집글 작성
- 간단한 지원/참여 의사 표시 구조
- 전공군 통합 모집과 전공별 모집 진입 구조

중요:

- 이 문서가 다루는 시점에는 모집 기능의 Supabase 실연결을 아직 하지 않았다.
- 이 문서가 다루는 시점에는 `AsyncStorage` 기반 로컬 저장 계층과 라우팅 흐름을 먼저 구현했다.
- 참여 방식은 별도 신청 시스템이 아니라 모집 상세 댓글 기반이다.
- 채팅, 별도 신청 테이블, 승인 워크플로우, 지원자 상태 관리, 첨부파일은 이번 단계 범위가 아니다.
- UI 화려함보다 일반 게시글과의 구조 분리, 권한 분기, 모집 흐름 완결성, 다음 단계 Supabase 연결성을 우선 검토해야 한다.

## 검토 대상 코드 파일

- `app/(tabs)/_layout.tsx`
- `app/(tabs)/recruit.tsx`
- `app/(tabs)/recruit-write.tsx`
- `app/(tabs)/recruitments/[recruitmentId].tsx`
- `app/(tabs)/boards/[boardId].tsx`
- `app/(tabs)/school.tsx`
- `hooks/use-community-data.tsx`
- `hooks/use-app-session.tsx`
- `types/domain.ts`
- `constants/community.ts`
- `data/mock-community.ts`

## 함께 참고할 문서

- `docs/02-mvp-scope.md`
- `docs/04-user-flows.md`
- `docs/05-information-architecture.md`
- `docs/07-supabase-data-model-draft.md`
- `docs/08-auth-verification-moderation.md`
- `docs/09-screen-list-and-prd.md`
- `docs/10-metrics-and-analytics.md`
- `docs/21-posts-comments-implementation-review-brief.md`
- `TASKS.md`

## 리뷰 목표

아래 항목을 중심으로 검토해라.

1. 모집 목록, 모집 상세, 모집 작성 흐름이 현재 앱 구조에서 안정적으로 동작하는가
2. 통합 모집과 전공별 모집 진입 구조가 문서 기준과 맞는가
3. 일반 게시글과 모집글의 데이터 구조 차이가 코드에서 명확하게 분리되어 있는가
4. 참여 의사 댓글 기반 구조가 MVP 범위에서 충분히 단순하고 일관된가
5. 권한 분기 로직이 `로그인 / 인증 완료 / 온보딩 완료 / 읽기 전용 / 학교 일치` 조건을 모집 흐름에도 일관되게 반영하는가
6. `use-community-data.tsx`의 로컬 저장 구조가 다음 단계 `recruitments` Supabase 연결 전까지 충분히 안정적인가
7. 이번 단계에 채팅, 지원 상태 관리, 별도 신청 테이블 같은 과한 구조가 섞이지 않았는가

## 특히 강하게 봐야 할 포인트

### A. 라우팅과 진입 구조

- 모집 탭에서 통합 모집 목록, 전공군 필터, 모집 작성 진입이 자연스럽게 이어지는가
- `app/(tabs)/recruit.tsx`, `app/(tabs)/recruit-write.tsx`, `app/(tabs)/recruitments/[recruitmentId].tsx`가 redirect loop 없이 동작하는가
- 전공 게시판과 학교 게시판에서 모집글을 눌렀을 때 일반 게시글 상세가 아니라 모집 상세로 정확히 연결되는가
- 모집글이 없을 때 빈 상태와 fallback이 적절한가

### B. 권한 분기

- `use-community-data.tsx`가 모집 작성과 참여 댓글 작성에서도 `canAccessCommunity`, `isAuthenticated`, `isReadOnly`, `primaryUniversityId`를 이용해 권한을 제대로 제어하는가
- 학교 보드 기반 모집글이 같은 학교 사용자에게만 읽기/쓰기가 허용되어야 하는 경우 누수가 없는가
- 읽기 전용 사용자는 모집 목록/상세는 보되 참여 댓글과 작성은 막히는가
- UI에서 막는 것뿐 아니라 저장 함수에서도 한 번 더 검증하는가

### C. 데이터 구조 분리

- 일반 게시글은 `PostRow`, 모집글은 `PostRow + RecruitmentRow` 조합으로 명확히 다뤄지고 있는가
- 모집 전용 필드인 `recruitmentType`, `mode`, `headcount`, `deadlineAt`, `preferredMajorGroupId`, `status`가 일반 게시글 구조와 뒤섞이지 않았는가
- 모집 상세에서 보여주는 라벨 값이 저장 row와 화면 view model 사이에서 적절히 분리되어 있는가
- 추후 Supabase 연결 시 repository 교체 수준으로 이어질 수 있는가

### D. 참여 의사 구조

- 댓글 기반 참여 방식이 문서 기준과 맞는가
- `recruitment_intent` 같은 모집 전용 댓글 구분이 타입과 코드에서 일관되게 사용되는가
- 별도 신청 워크플로우 없이도 MVP 검증에 필요한 최소 상호작용이 가능한가
- 모집 상세의 참여 유도 문구와 템플릿이 과하지 않고 충분히 단순한가

### E. 저장 경계

- `AsyncStorage` 기반 모집글/댓글 저장이 현재 단계에 적절한가
- hydrate 시 캐시 손상이나 기본 mock 데이터와의 충돌 위험이 큰가
- 모집 데이터가 일반 게시글 저장 계층과 섞이면서 다음 단계 Supabase 연결을 어렵게 만들지는 않는가

### F. 범위 관리

- 채팅, 별도 신청 시스템, 승인/거절 워크플로우, 지원자 상태 관리 등 이번 단계에서 제외한 기능이 섞이지 않았는가
- 모집 기능이 학교 보드를 메인 체류 공간으로 과도하게 키우지 않았는가
- 일반 게시글 흐름을 불필요하게 복잡하게 만들지 않았는가

## 원하는 응답 형식

반드시 아래 형식으로 답해라.

### 1. 핵심 발견사항

- 심각도 순서대로 정리
- 각 항목마다 관련 파일명을 명시
- 왜 문제가 되는지 짧고 명확하게 설명

### 2. 모집 구조 평가

- 적절함 / 약간 위험함 / 더 보완 필요
- 이유를 3~5줄로 설명

### 3. 문서 / 코드 / 라우팅 충돌 여부

- 충돌 있음 / 없음
- 있다면 어떤 문서와 어떤 코드가 어긋나는지 구체적으로

### 4. 저장 경계 평가

- 로컬 저장 구조가 현재 단계에서 적절한지 평가
- 다음 단계 Supabase 연결 시 위험할 수 있는 부분이 있으면 지적

### 5. 지금 단계에서 구현하지 말아야 할 것

- 모집 단계 이후로 미뤄야 하는 항목
- 현재 코드에 추가되면 범위를 키우는 항목

### 6. 바로 보완할 것

- 지금 당장 수정 추천 3개 이내

### 7. 최종 판단

아래 두 문장을 반드시 포함해라.

1. "이 구현 상태로 모집글 Supabase 연결 단계에 들어가도 되는가?"
2. "들어가기 전에 먼저 수정해야 할 상위 3개 항목"

## 리뷰 원칙

- 칭찬보다 권한 누수, 라우팅 문제, 저장 경계, 문서-코드 불일치, 범위 이탈 가능성을 우선 지적해라.
- 스타일 취향보다 모집 흐름 완결성, 일반 게시글과의 구조 분리, 댓글 기반 참여 방식, 학교 보드 제한, 다음 단계 연결성을 더 중요하게 봐라.
- 실제 코드 리뷰처럼 validation 누락, 잘못된 모집 위치 선택, 모집 전용 필드 누락, 캐시 손상 복구, 과범위 확장 가능성을 중심으로 보라.
