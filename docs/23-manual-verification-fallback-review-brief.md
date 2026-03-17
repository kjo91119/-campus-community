# 23. 학생증 Fallback 구현 교차검증 지시서

문서 목적: 다른 AI 또는 리뷰어가 현재 `campus-community` 저장소에 추가된 `학교 이메일 우선 + 학생증 수동 인증 fallback 1단계` 구현을 코드와 문서 기준으로 교차검증할 때, 무엇을 어떤 기준으로 봐야 하는지 명확하게 전달한다.

아래 내용을 그대로 복사해서 다른 모델에게 전달해도 된다.
단, 이 지시서만 보내면 충분한 것이 아니라 검토 대상 코드와 관련 문서 원문도 함께 제공하거나, 같은 저장소/워크스페이스에 접근 가능한 환경에서 사용해야 한다.

---

너는 지금 Expo + TypeScript 기반 앱 프로젝트 `campus-community`의 외부 코드 리뷰어다.

이번 검토의 목적은 "새 기능 제안"이 아니라, 방금 구현된 `학생증 수동 인증 fallback 1단계`가 다음 기준을 만족하는지 점검하는 것이다.

## 현재 구현 목표 요약

이번 단계에서 구현한 것은 아래 범위다.

- 학교 이메일 인증 경로 유지
- 학교 이메일이 없는 경우 일반 이메일 계정 생성 허용
- 로그인 후 학생증 수동 인증으로 이어지는 fallback 분기 추가
- 인증 상태에 따라 커뮤니티 접근을 계속 제한하는 구조 유지
- 학생증 수동 인증 화면은 아직 placeholder 수준으로 유지

중요:

- 아직 학생증 이미지 실제 업로드는 구현하지 않았다.
- 아직 `verifications` 실테이블 저장, Storage bucket 업로드, 운영자 승인 UI는 구현하지 않았다.
- 이번 단계는 `가입 경로 분기 + 상태 분기 + 안내 화면`을 먼저 안정화하는 것이 목적이다.
- 졸업생 허용 정책은 아직 이번 단계 범위가 아니다.
- UI 완성도보다 `잘못된 접근 허용이 없는지`, `인증 전/후 분기가 안전한지`, `문서와 코드가 어긋나지 않는지`를 우선 검토해야 한다.

## 검토 대상 코드 파일

- `app/(auth)/_layout.tsx`
- `app/(auth)/index.tsx`
- `app/(auth)/email.tsx`
- `app/(auth)/manual-verification.tsx`
- `app/(tabs)/_layout.tsx`
- `hooks/use-supabase-auth.tsx`
- `hooks/use-app-session.tsx`
- `data/mock-community.ts`
- `types/domain.ts`

## 함께 참고할 문서

- `docs/02-mvp-scope.md`
- `docs/04-user-flows.md`
- `docs/07-supabase-data-model-draft.md`
- `docs/08-auth-verification-moderation.md`
- `docs/09-screen-list-and-prd.md`
- `docs/12-open-questions.md`
- `docs/18-supabase-auth-implementation-review-brief.md`
- `docs/19-onboarding-profile-implementation-review-brief.md`
- `TASKS.md`

## 리뷰 목표

아래 항목을 중심으로 검토해라.

1. 학교 이메일 경로와 학생증 fallback 경로가 현재 auth 구조 안에서 충돌 없이 공존하는가
2. 학교 이메일이 없는 경우 일반 이메일 계정 생성이 허용되더라도 커뮤니티 접근이 조기에 열리지 않는가
3. 로그인은 완화했지만 가입/인증 권한은 여전히 의도한 범위에서만 허용되는가
4. `unverified / pending / verified / rejected` 상태와 화면 분기가 라우팅 기준에 맞게 일관되게 동작하는가
5. 학생증 수동 인증 화면이 실제 구현처럼 오해되지 않고, placeholder 범위가 명확하게 표현되는가
6. 이후 `verifications` 테이블, Storage bucket, 운영 승인 흐름을 붙일 때 현재 구조가 발목을 잡지 않는가
7. 이번 단계에 졸업생 허용, 관리자 툴, 파일 업로드, 운영 워크플로우 같은 과한 구조가 섞이지 않았는가

## 특히 강하게 봐야 할 포인트

### A. 가입 / 로그인 경로 분기

- `app/(auth)/email.tsx`에서 `학교 이메일`과 `학생증 fallback` 경로가 명확히 나뉘는가
- 학교 이메일 경로는 여전히 지원 도메인 제한을 제대로 걸고 있는가
- 학생증 fallback 경로는 일반 이메일 계정 생성을 허용하지만, 그 의미가 UI 문구와 코드에서 일관되는가
- 로그인에서 도메인 제한을 완화한 것이 인증 우회로 이어지지 않는가

### B. 인증 상태 분기와 라우팅

- `hooks/use-app-session.tsx`, `app/(auth)/_layout.tsx`, `app/(tabs)/_layout.tsx`가 `verified` 전에는 커뮤니티 접근을 막고 있는가
- `pending`, `unverified`, `verified` 상태가 현재 auth 화면에서 각기 다른 의미로 잘 드러나는가
- 이메일 확인 대기와 학생증 수동 인증 필요 상태가 서로 헷갈리지 않는가
- redirect loop나 잘못된 자동 진입이 없는가

### C. Placeholder 범위 관리

- `app/(auth)/manual-verification.tsx`가 아직 실제 업로드 구현 전 단계라는 점을 분명하게 전달하는가
- 사용자가 이미 학생증을 제출한 것처럼 오해할 수 있는 UI가 없는가
- 운영 SLA, 증빙 보관 기준, 다음 단계 예정 흐름이 문서와 크게 어긋나지 않는가

### D. 문서 / 코드 정합성

- `docs/08-auth-verification-moderation.md`, `docs/09-screen-list-and-prd.md`, `docs/12-open-questions.md`와 현재 구현 방향이 충돌하지 않는가
- 현재 구현이 `학교 이메일 우선, 학생증 fallback`이라는 합의된 방향을 유지하는가
- 졸업생 허용 논의가 이번 단계 코드에 섣불리 섞이지 않았는가

### E. 다음 단계 연결성

- 이후 실제 `verifications` 테이블을 붙일 때 auth/session 책임이 과도하게 꼬이지 않는가
- 일반 이메일 계정 생성 사용자의 `verificationStatus`가 이후 서버 소스 오브 트루스로 자연스럽게 넘어갈 수 있는가
- 현재 구현이 다음 단계 `학생증 제출 + pending/rejected 처리`를 붙이기 위한 최소 기반으로 적절한가

## 원하는 응답 형식

반드시 아래 형식으로 답해라.

### 1. 핵심 발견사항

- 심각도 순서대로 정리
- 각 항목마다 관련 파일명을 명시
- 왜 문제가 되는지 짧고 명확하게 설명

### 2. 인증 fallback 구조 평가

- 적절함 / 약간 위험함 / 더 보완 필요
- 이유를 3~5줄로 설명

### 3. 문서 / 코드 / 라우팅 충돌 여부

- 충돌 있음 / 없음
- 있다면 어떤 문서와 어떤 코드가 어긋나는지 구체적으로

### 4. 권한 / 상태 분기 평가

- 일반 이메일 계정 생성, 인증 전 접근 제한, 학생증 안내 흐름이 현재 단계에서 적절한지 평가
- 다음 단계 실구현 전에 위험할 수 있는 부분이 있으면 지적

### 5. 지금 단계에서 구현하지 말아야 할 것

- 학생증 fallback 단계 이후로 미뤄야 하는 항목
- 현재 코드에 추가되면 범위를 키우는 항목

### 6. 바로 보완할 것

- 지금 당장 수정 추천 3개 이내

### 7. 최종 판단

아래 두 문장을 반드시 포함해라.

1. "이 구현 상태로 학생증 fallback 다음 단계에 들어가도 되는가?"
2. "들어가기 전에 먼저 수정해야 할 상위 3개 항목"

## 리뷰 원칙

- 칭찬보다 인증 우회 가능성, 잘못된 라우팅, 상태 오해, 문서-코드 불일치, 과범위 확장 가능성을 우선 지적해라.
- 스타일 취향보다 `학교 이메일 우선`, `학생증 fallback`, `verified 전 접근 제한`, `placeholder 범위 관리`, `다음 단계 연결성`을 더 중요하게 봐라.
- 실제 코드 리뷰처럼 validation 누락, 상태 문구 혼선, pending/unverified 처리 충돌, 일반 이메일 계정의 의미 혼란, 졸업생 정책 혼입 가능성을 중심으로 보라.
