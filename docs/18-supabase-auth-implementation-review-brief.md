# 18. Supabase Auth 구현 교차검증 지시서

문서 목적: 다른 AI 또는 리뷰어가 현재 `campus-community` 저장소에 추가된 Supabase Auth 구현을 코드 기준으로 교차검증할 때, 무엇을 어떤 기준으로 봐야 하는지 명확하게 전달한다.

아래 내용을 그대로 복사해서 다른 모델에게 전달해도 된다.
단, 이 지시서만 보내면 충분한 것이 아니라 검토 대상 코드와 관련 문서 원문도 함께 제공하거나, 같은 저장소/워크스페이스에 접근 가능한 환경에서 사용해야 한다.

---

너는 지금 Expo + TypeScript 기반 앱 프로젝트 `campus-community`의 외부 코드 리뷰어다.

이번 검토의 목적은 "기능 제안"이 아니라, 방금 구현된 Supabase Auth 단계가 다음 기준을 만족하는지 점검하는 것이다.

## 현재 구현 목표 요약

이번 단계에서 구현한 것은 아래 범위다.

- Supabase Auth 기반 로그인 / 회원가입 / 로그아웃 구조
- Expo 앱에서 auth 상태를 전역적으로 다루는 provider 구조
- 세션 유지 기반 추가
- 학교 이메일 도메인을 전제로 한 이메일 기반 auth 흐름
- 인증 전 / 인증 후 / 온보딩 대기 상태의 화면 분기
- 학생증 수동 인증은 실제 구현 없이 placeholder로 유지

중요:

- 아직 `profiles`, `boards`, `posts`, `comments`, `recruitments`의 실제 DB 연결은 하지 않았다.
- 이번 단계는 auth 상태와 auth 화면 흐름만 구현했다.
- placeholder 화면은 시각 완성도보다 auth 분기 안정성과 상태 구조를 우선 검토해야 한다.

## 검토 대상 코드 파일

- `app/_layout.tsx`
- `app/(auth)/_layout.tsx`
- `app/(auth)/index.tsx`
- `app/(auth)/email.tsx`
- `app/(auth)/manual-verification.tsx`
- `app/(auth)/onboarding.tsx`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/profile.tsx`
- `hooks/use-supabase-auth.tsx`
- `hooks/use-app-session.tsx`
- `lib/supabase/client.ts`
- `lib/supabase/auth.ts`
- `.env.example`
- `package.json`
- `app.json`

## 함께 참고할 문서

- `docs/02-mvp-scope.md`
- `docs/05-information-architecture.md`
- `docs/08-auth-verification-moderation.md`
- `docs/09-screen-list-and-prd.md`
- `docs/16-supabase-connection-prep.md`
- `TASKS.md`

## 리뷰 목표

아래 항목을 중심으로 검토해라.

1. auth 상태 구조가 Expo + Supabase Auth 기준으로 안전한가
2. 로그인 / 회원가입 / 로그아웃 / 세션 유지 흐름이 현재 단계에 맞게 구현되었는가
3. 이메일 기반 auth가 학교 이메일 인증 방향과 크게 어긋나지 않는가
4. 인증 전 / 인증 후 / 온보딩 대기 분기 구조가 라우팅 관점에서 안전한가
5. `use-supabase-auth.tsx`와 `use-app-session.tsx`의 역할 분리가 적절한가
6. 아직 연결하지 말아야 할 게시판/댓글/모집글 계층이 auth 단계에 과하게 섞이지 않았는가
7. 학생증 수동 인증이 실제 구현 없이 placeholder 수준에 머물러 있는가
8. 다음 단계에서 `profiles` 연동으로 넘어가기 쉬운 구조인가

## 특히 강하게 봐야 할 포인트

### A. Auth provider 구조

- `hooks/use-supabase-auth.tsx`가 세션 조회, 구독, sign in, sign up, sign out 책임을 적절히 갖고 있는가
- env 미설정 또는 금지 키 상황에서 앱이 과하게 깨지지 않는가
- `onAuthStateChange`와 초기 `getSession()` 흐름이 중복 버그나 레이스 조건을 만들 가능성은 없는가

### B. 세션 유지와 저장소

- `lib/supabase/client.ts`의 AsyncStorage 기반 세션 유지 구성이 현재 단계에 맞는가
- native auto refresh 등록 방식이 중복 등록이나 메모리 누수 위험이 없는가
- 지금 시점에 `expo-secure-store` 설치만 하고 아직 사용하지 않는 선택이 괜찮은가

### C. 앱 라우팅 분기

- `app/(auth)/_layout.tsx`와 `app/(tabs)/_layout.tsx`의 redirect 조건이 루프를 만들 가능성은 없는가
- 세션 복원 중 `null` 반환으로 처리한 hydration 구간이 현재 단계에 맞는가
- 로그인 후 온보딩, 온보딩 후 탭 진입, 로그아웃 후 auth 복귀 흐름이 자연스러운가

### D. 앱 세션과 auth 세션 관계

- `hooks/use-app-session.tsx`가 auth user를 받아 로컬 onboarding/profile snapshot만 관리하도록 정리된 것이 적절한가
- 아직 DB 프로필이 없다는 제약 아래에서 과도하게 임시 구조가 들어가진 않았는가
- 추후 `profiles` 테이블 연결 시 크게 갈아엎지 않아도 되는 구조인가

### E. 범위 관리

- 이번 단계에서 실제 게시판/댓글/모집글 연결이 섞였는가
- 학생증 수동 인증 화면이 실제 구현 없이 placeholder로 잘 제한됐는가
- auth 단계에서 불필요하게 많은 운영 정책 UI가 들어가지 않았는가

## 원하는 응답 형식

반드시 아래 형식으로 답해라.

### 1. 핵심 발견사항

- 심각도 순서대로 정리
- 각 항목마다 관련 파일명을 명시
- 왜 문제가 되는지 짧고 명확하게 설명

### 2. Auth 구조 평가

- 적절함 / 약간 위험함 / 더 보완 필요
- 이유를 3~5줄로 설명

### 3. 라우팅 / 세션 분기 충돌 여부

- 충돌 있음 / 없음
- 있다면 어떤 파일에서 어떤 조건이 충돌하는지 구체적으로

### 4. 구조적으로 좋은 점

- 다음 단계 확장에 도움이 되는 부분만 2~4개 이내로 간단히

### 5. 지금 단계에서 구현하지 말아야 할 것

- auth 단계 이후로 미뤄야 하는 항목
- 현재 코드에 추가되면 범위를 키우는 항목

### 6. 바로 보완할 것

- 지금 당장 수정 추천 3개 이내

### 7. 최종 판단

아래 두 문장을 반드시 포함해라.

1. "이 구현 상태로 auth 이후 `profiles` 연결 단계에 들어가도 되는가?"
2. "들어가기 전에 먼저 수정해야 할 상위 3개 항목"

## 리뷰 원칙

- 칭찬보다 버그 가능성, 구조 리스크, 세션/라우팅 문제를 우선 지적해라.
- 스타일 취향보다 auth 안정성, 상태 일관성, 범위 관리, 다음 단계 연결성을 더 중요하게 봐라.
- 실제 코드 리뷰처럼 race condition, persistence 문제, redirect loop, 잘못된 책임 분배를 중심으로 보라.
