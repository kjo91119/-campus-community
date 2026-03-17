# 26. Boards 서버 우선 전환 교차검증 지시서

문서 목적: 다른 AI 또는 리뷰어가 현재 `campus-community` 저장소에 반영된 `boards 서버 우선 읽기 전환` 작업을 코드와 문서 기준으로 교차검증할 때, 무엇을 어떤 기준으로 봐야 하는지 명확하게 전달한다.

아래 내용을 그대로 복사해서 다른 모델에게 전달해도 된다.
단, 이 지시서만 보내면 충분한 것이 아니라 검토 대상 코드와 관련 문서 원문도 함께 제공하거나, 같은 저장소/워크스페이스에 접근 가능한 환경에서 사용해야 한다.

---

너는 지금 Expo + TypeScript 기반 앱 프로젝트 `campus-community`의 외부 코드 리뷰어다.

이번 검토의 목적은 "새 기능 제안"이 아니라, 방금 반영된 `boards 서버 우선 전환`이 다음 기준을 만족하는지 점검하는 것이다.

## 현재 구현 목표 요약

이번 단계에서 구현한 것은 아래 범위다.

- `boards` 메타데이터를 mock 직접 참조 대신 Supabase 저장소에서도 읽을 수 있게 정리
- `CommunityProvider`가 posts/comments/recruitments와 별도로 board 목록도 서버 우선으로 들고 있게 정리
- 게시판 상세, 글쓰기, 모집글 쓰기, 학교 탭, 홈 탭, 글 상세, 모집 상세 화면이 provider 기준 board lookup을 사용하도록 변경
- 학교 보드 / 전공 보드 선택 헬퍼를 provider에서 제공하도록 정리
- 기존 mock은 fallback seed로만 남기고, 런타임 읽기 기준은 provider로 모으기

중요:

- 이번 단계는 게시판 메타데이터 읽기 경로 정리가 목적이다.
- 새로운 SQL 마이그레이션은 없다.
- 실제 universities / major_groups 실테이블 도입은 아직 이번 단계 범위가 아니다.
- 작성/댓글/모집 권한 자체를 새로 바꾸는 단계가 아니라, 기존 권한 판단이 같은 board source를 쓰도록 맞추는 단계다.

## 검토 대상 코드 파일

- `lib/supabase/boards.ts`
- `hooks/use-community-data.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/school.tsx`
- `app/(tabs)/boards/[boardId].tsx`
- `app/(tabs)/write.tsx`
- `app/(tabs)/posts/[postId].tsx`
- `app/(tabs)/recruit-write.tsx`
- `app/(tabs)/recruitments/[recruitmentId].tsx`
- `data/mock-community.ts`

## 함께 참고할 문서

- `docs/05-information-architecture.md`
- `docs/07-supabase-data-model-draft.md`
- `docs/09-screen-list-and-prd.md`
- `docs/11-roadmap.md`
- `TASKS.md`

## 리뷰 목표

아래 항목을 중심으로 검토해라.

1. 게시판 메타데이터가 더 이상 화면별 mock 직접 참조에 흩어져 있지 않은가
2. provider가 board source of truth 역할을 하며, 권한 판단과 화면 표시가 같은 board 데이터를 쓰는가
3. remote boards가 있으면 그것이 seed/mock보다 우선 반영되는가
4. 학교 보드 / 전공 보드 / 통합 홈 보드 lookup이 현재 화면 흐름과 자연스럽게 맞는가
5. 이번 단계에 universities/major_groups 실테이블, 운영 기능, 과한 서버 구조 같은 다음 단계 항목이 섞이지 않았는가

## 특히 강하게 봐야 할 포인트

### A. 저장소와 provider 경계

- `lib/supabase/boards.ts`가 현재 `boards` 스키마와 맞는가
- provider가 remote board fetch 실패 시 안전하게 mock seed로 fallback 하는가
- provider 내부 `getReadAccessForBoard`, `getWriteAccessForBoard`, `createPost`, `createRecruitment`가 같은 board source를 보는가

### B. 화면별 lookup 일관성

- 게시판 상세, 글 상세, 모집 상세, 글쓰기, 모집글 쓰기가 provider의 `getBoardById()`를 사용하는가
- 홈 탭과 학교 탭, 모집글 쓰기에서 major/school board 선택이 provider 헬퍼로 통일됐는가
- 더 이상 `app/(tabs)` 주요 화면이 `getBoardById()`를 mock에서 직접 import 하지 않는가

### C. 병합 규칙과 fallback

- remote boards를 받아왔을 때 seed/mock보다 적절히 우선하는가
- board 목록 정렬이나 노출 순서가 사용자 경험상 크게 깨지지 않는가
- hydrate 전후로 화면이 잘못된 board reference 때문에 깨지지 않는가

### D. 범위 관리

- 이번 단계에 board 쓰기 권한 재설계, universities 실테이블 연결, major_groups 실테이블 연결, 운영자 기능 같은 과범위 구현이 섞이지 않았는가
- 아직 mock으로 남아 있는 `getUniversityById`, `getMajorGroupById`는 metadata fallback 범위로만 쓰이는가

## 원하는 응답 형식

반드시 아래 형식으로 답해라.

### 1. 핵심 발견사항

- 심각도 순서대로 정리
- 각 항목마다 관련 파일명을 명시
- 왜 문제가 되는지 짧고 명확하게 설명

### 2. board source of truth 평가

- 적절함 / 약간 위험함 / 더 보완 필요
- 이유를 3~5줄로 설명

### 3. 문서 / 코드 충돌 여부

- 충돌 있음 / 없음
- 있다면 어떤 문서와 어떤 코드가 어긋나는지 구체적으로

### 4. 저장 경계 평가

- mock seed / provider state / remote boards 병합 구조가 현재 단계에서 적절한지 평가
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

## 리뷰 원칙

- 스타일 취향보다 `board 데이터 경계`, `provider 중심 lookup`, `remote 우선 병합`, `화면별 일관성`, `과범위 확장 방지`를 더 중요하게 봐라.
- 새 기능 제안보다, 현재 전환이 실제로 mock 직접 참조를 줄였는지와 권한/표시가 같은 board source를 보는지를 먼저 검토해라.
- universities/major_groups를 아직 mock metadata로 두고 있는 점 자체는 당장 문제 삼기보다, 그 경계가 명확한지를 보라.
