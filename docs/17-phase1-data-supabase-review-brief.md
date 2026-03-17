# 17. Phase 1 데이터/연결 준비 교차검증 지시서

문서 목적: 다른 AI 또는 리뷰어가 현재 Phase 1 골격 위에서 정리한 도메인 타입, mock 데이터, Supabase 연결 전 준비 상태를 코드와 문서 기준으로 교차검증할 때 쓰는 지시서다.

아래 내용을 그대로 복사해서 다른 모델에게 전달해도 된다.
단, 이 지시서만 보내면 충분한 것이 아니라 검토 대상 코드와 관련 문서 원문도 함께 제공하거나, 같은 저장소/워크스페이스에 접근 가능한 환경에서 사용해야 한다.

---

너는 지금 Expo + TypeScript 기반 앱 프로젝트 `campus-community`의 외부 코드 리뷰어다.

이번 검토의 목적은 "새 기능 구현"이 아니라, 아래 세 가지가 현재 상태에서 타당한지 점검하는 것이다.

1. 도메인 타입 정의가 MVP와 이후 Supabase 연결에 맞게 정리되었는가
2. mock 데이터가 현재 화면 골격과 다음 단계 구현을 받칠 만큼 충분한가
3. Supabase 연결 전 준비가 과하지 않으면서도 다음 단계 진입에 필요한 기준을 잘 고정했는가

## 현재 작업 범위 요약

이번 라운드에서 한 일은 아래와 같다.

- `types/domain.ts`를 보강해 전공군, 학교, 게시판, 게시글, 댓글, 모집글, 프로필, 인증 관련 타입을 정리
- `data/mock-community.ts`를 보강해 화면에서 재사용 가능한 mock 데이터와 helper를 정리
- `lib/supabase/env.ts`, `lib/supabase/client.ts`를 추가해 env 체크와 초기화 파일 위치만 잡아둠
- `docs/16-supabase-connection-guide.md`를 추가해 문서 모델과 앱 구조 대조, env, 패키지, 연결 우선순위를 정리

중요:

- 아직 Supabase 실연결은 하지 않았다.
- 아직 패키지 추가 설치는 하지 않았다.
- 아직 SQL 구현은 하지 않았다.
- placeholder 화면은 시각 완성도보다 데이터 구조, 라우팅 안정성, 문서 일치 여부를 우선 검토해야 한다.

## 검토 대상 코드 파일

- `types/domain.ts`
- `constants/major-groups.ts`
- `data/mock-community.ts`
- `hooks/use-app-session.tsx`
- `lib/supabase/env.ts`
- `lib/supabase/client.ts`
- `app/(auth)/index.tsx`
- `app/(auth)/manual-verification.tsx`
- `app/(auth)/onboarding.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/recruit.tsx`
- `app/(tabs)/school.tsx`
- `app/(tabs)/profile.tsx`

## 함께 참고할 문서

- `docs/02-mvp-scope.md`
- `docs/07-supabase-data-model-draft.md`
- `docs/08-auth-verification-moderation.md`
- `docs/09-screen-list-and-prd.md`
- `docs/16-supabase-connection-guide.md`
- `TASKS.md`

## 리뷰 목표

아래 항목을 중심으로 검토해라.

1. 타입 정의가 현재 MVP 범위를 넘어서 과하게 복잡해지지 않았는가
2. 현재 타입이 나중에 Supabase row와 연결될 때 큰 재작업 없이 이어질 수 있는가
3. mock 데이터가 홈 / 모집 / 학교 / 프로필 / 인증 흐름을 받칠 만큼 충분한가
4. mock 데이터가 문서 기준과 충돌하지 않는가
5. `comments.kind = recruitment_intent` 같은 확장이 MVP 의도와 잘 맞는가
6. `lib/supabase/*` 준비가 실제 연결 전 단계로 적절한가
7. env 목록과 패키지 제안이 현실적인가
8. 지금 단계에서 구현하지 말아야 할 것이 섞여 있지 않은가

## 특히 강하게 봐야 할 포인트

### A. 타입 구조

- `Profile`, `VerificationRecord`, `Board`, `CommunityPost`, `Comment`, `RecruitmentCard`가 문서 모델과 자연스럽게 대응되는가
- 앱에서 쓰는 camelCase 이름이 DB 연결 시 무리 없는 수준인가
- 필수 필드와 선택 필드 경계가 적절한가
- 지금 없는 기능 때문에 타입이 지나치게 앞서가지는 않았는가

### B. Mock 데이터 구조

- 게시글, 댓글, 모집글 간 관계가 자연스러운가
- 프로필, 인증 이력, 게시판 데이터가 서로 일관되게 연결되는가
- 현재 화면이 쓸 최소 더미 데이터 이상으로만 넓어졌는가
- 이후 상세 화면, 글쓰기, 댓글 흐름을 붙이기 쉬운 구조인가

### C. Supabase 준비 수준

- `env.ts`, `client.ts`가 지금 단계에서 필요한 만큼만 준비되었는가
- 실제 패키지 설치 전인데도 코드가 과도하게 구현되지는 않았는가
- 위험한 키 사용 가능성을 충분히 막고 있는가
- 연결 우선순위 제안이 MVP 핵심 루프와 맞는가

## 원하는 응답 형식

반드시 아래 형식으로 답해라.

### 1. 핵심 발견사항

- 심각도 순서대로 정리
- 각 항목마다 관련 파일명을 명시
- 왜 문제가 되는지 짧고 명확하게 설명

### 2. 타입/문서 충돌 여부

- 충돌 있음 / 없음
- 있다면 어떤 타입과 어떤 문서가 어떻게 어긋나는지 구체적으로

### 3. Mock 데이터 평가

- 충분함 / 약간 부족함 / 과함
- 이유를 3~5줄로 설명

### 4. Supabase 준비 적절성

- 적절함 / 과함 / 더 보완 필요
- env, 패키지, 파일 구조, 연결 우선순위 측면에서 설명

### 5. 지금 단계에서 구현하지 말아야 할 것

- 현재 코드에 추가되면 범위를 키우는 항목
- 다음 단계로 미뤄야 하는 항목

### 6. 바로 보완할 것

- 지금 당장 수정 추천 3개 이내

### 7. 최종 판단

아래 두 문장을 반드시 포함해라.

1. "이 타입과 mock 구조로 Supabase 연결 준비 단계까지 이어가도 되는가?"
2. "실제 연결 전에 먼저 수정해야 할 상위 3개 항목"

## 리뷰 원칙

- 칭찬보다 구조 리스크와 충돌 발견을 우선해라.
- 스타일 취향보다 데이터 구조 일관성, 문서 정합성, 이후 연결성, 범위 관리가 더 중요하다.
- 패키지 설치나 외부 연결을 전제로 한 과도한 제안은 줄여라.
- 현재 단계는 구현 과시보다 "다음 단계로 안전하게 넘어갈 준비가 되었는가"를 보는 것이다.
