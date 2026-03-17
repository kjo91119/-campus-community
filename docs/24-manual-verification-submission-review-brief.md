# 24. 학생증 수동 인증 제출 구현 교차검증 지시서

문서 목적: 다른 AI 또는 리뷰어가 현재 `campus-community` 저장소에 추가된 `학생증 수동 인증 제출/상태 흐름` 구현을 코드와 문서 기준으로 교차검증할 때, 무엇을 어떤 기준으로 봐야 하는지 명확하게 전달한다.

아래 내용을 그대로 복사해서 다른 모델에게 전달해도 된다.
단, 이 지시서만 보내면 충분한 것이 아니라 검토 대상 코드와 관련 문서 원문도 함께 제공하거나, 같은 저장소/워크스페이스에 접근 가능한 환경에서 사용해야 한다.

---

너는 지금 Expo + TypeScript 기반 앱 프로젝트 `campus-community`의 외부 코드 리뷰어다.

이번 검토의 목적은 "새 기능 제안"이 아니라, 방금 구현된 `학생증 수동 인증 제출/검토 상태 흐름`이 다음 기준을 만족하는지 점검하는 것이다.

## 현재 구현 목표 요약

이번 단계에서 구현한 것은 아래 범위다.

- 학교 이메일이 없는 사용자의 일반 이메일 계정 생성 경로 유지
- 학생증 수동 인증 제출 화면을 placeholder에서 실제 제출/상태 화면으로 확장
- 학교 선택, 제출 전 확인 체크, 제출 결과 `pending` 반영
- `rejected` 상태에서 반려 사유 확인과 재제출 흐름
- `verifications` 저장소를 위한 Supabase repository와 SQL 파일 초안 추가
- Supabase 연결 실패 시 로컬 캐시 fallback 유지

중요:

- 아직 학생증 이미지 실제 업로드는 하지 않았다.
- 아직 운영자 승인/반려 UI는 없다.
- 아직 졸업생 허용 정책은 이번 단계 범위가 아니다.
- 이번 단계는 `제출 구조 + 상태 분기 + 저장 경계`를 먼저 닫는 것이 목적이다.
- UI 화려함보다 인증 우회 방지, 상태 일관성, 로컬/원격 저장 경계, 다음 단계 연결성을 우선 검토해야 한다.

## 검토 대상 코드 파일

- `app/(auth)/index.tsx`
- `app/(auth)/email.tsx`
- `app/(auth)/manual-verification.tsx`
- `app/(auth)/_layout.tsx`
- `app/(tabs)/_layout.tsx`
- `hooks/use-app-session.tsx`
- `hooks/use-supabase-auth.tsx`
- `lib/supabase/verifications.ts`
- `lib/supabase/profiles.ts`
- `types/domain.ts`
- `supabase/sql/03_create_verifications.sql`

## 함께 참고할 문서

- `docs/02-mvp-scope.md`
- `docs/04-user-flows.md`
- `docs/07-supabase-data-model-draft.md`
- `docs/08-auth-verification-moderation.md`
- `docs/09-screen-list-and-prd.md`
- `docs/12-open-questions.md`
- `docs/23-manual-verification-fallback-review-brief.md`
- `TASKS.md`

## 리뷰 목표

아래 항목을 중심으로 검토해라.

1. 학생증 수동 인증 제출 흐름이 현재 auth/session 구조 안에서 안정적으로 동작하는가
2. 일반 이메일 계정 생성 사용자가 제출 후 `pending` 상태로 안전하게 머무는가
3. `unverified / pending / rejected / verified` 상태와 화면 분기가 라우팅 기준에 맞게 일관되는가
4. `use-app-session.tsx`의 로컬/원격 verification 저장 경계가 다음 단계 확장 전까지 충분히 안정적인가
5. `verifications` repository와 SQL 초안이 현재 코드와 어긋나지 않는가
6. 이번 단계에 파일 업로드, 운영자 도구, 졸업생 권한 같은 과한 구조가 섞이지 않았는가

## 특히 강하게 봐야 할 포인트

### A. 제출 흐름과 권한

- 로그인하지 않은 사용자는 제출을 못 하고, 안내만 보는가
- 일반 이메일 계정 생성 사용자가 학교 선택과 체크 항목 확인 후 제출할 수 있는가
- 학교 이메일이 이미 가능한 계정은 수동 인증으로 우회하지 못하게 막고 있는가
- `verified` 사용자는 수동 인증 제출을 다시 하지 않게 막고 있는가

### B. 상태 분기와 라우팅

- `pending`이면 검토 대기 화면만 보이고 커뮤니티 접근은 여전히 막히는가
- `rejected`이면 반려 사유와 재제출 흐름이 자연스러운가
- `verified`이면 온보딩 또는 탭 진입 구조와 충돌하지 않는가
- `app/(auth)/_layout.tsx`, `app/(tabs)/_layout.tsx`와 화면 상태가 엇갈리지 않는가

### C. 저장 경계

- `hooks/use-app-session.tsx`에서 profile과 verification 저장이 서로 크게 어긋나지 않는가
- Supabase 저장 실패 시 로컬 캐시 fallback이 사용자 상태를 망가뜨리지 않는가
- 로컬 verification 캐시와 원격 verification row의 최신성 선택 기준이 합리적인가
- `profile.verificationStatus`와 `verificationRecord.status`가 서로 충돌할 위험이 큰가

### D. SQL / Repository 정합성

- `lib/supabase/verifications.ts`와 `supabase/sql/03_create_verifications.sql`의 컬럼 구조가 맞는가
- 현재 insert 정책이 사용자 제출 범위를 적절히 제한하는가
- 위험하게 넓은 update 권한이나 인증 우회 가능성이 숨어 있지 않은가
- 지금 단계에서 SQL 파일이 업로드/운영 승인 기능까지 과하게 포함하지는 않았는가

### E. 범위 관리

- 실제 이미지 업로드 없이도 제출/상태 흐름 MVP 검증이 가능한가
- 운영자 승인 UI, Storage 업로드, 졸업생 권한 분기 같은 다음 단계 항목이 이번 코드에 섞이지 않았는가
- manual verification 화면이 “실제 업로드 완성”처럼 과장되어 보이지 않는가

## 원하는 응답 형식

반드시 아래 형식으로 답해라.

### 1. 핵심 발견사항

- 심각도 순서대로 정리
- 각 항목마다 관련 파일명을 명시
- 왜 문제가 되는지 짧고 명확하게 설명

### 2. 학생증 제출 구조 평가

- 적절함 / 약간 위험함 / 더 보완 필요
- 이유를 3~5줄로 설명

### 3. 문서 / 코드 / 라우팅 충돌 여부

- 충돌 있음 / 없음
- 있다면 어떤 문서와 어떤 코드가 어긋나는지 구체적으로

### 4. 저장 경계 평가

- 로컬/원격 verification 저장 구조가 현재 단계에서 적절한지 평가
- 다음 단계 업로드/운영 승인 연결 시 위험할 수 있는 부분이 있으면 지적

### 5. 지금 단계에서 구현하지 말아야 할 것

- 학생증 제출 단계 이후로 미뤄야 하는 항목
- 현재 코드에 추가되면 범위를 키우는 항목

### 6. 바로 보완할 것

- 지금 당장 수정 추천 3개 이내

### 7. 최종 판단

아래 두 문장을 반드시 포함해라.

1. "이 구현 상태로 학생증 수동 인증 다음 단계에 들어가도 되는가?"
2. "들어가기 전에 먼저 수정해야 할 상위 3개 항목"

## 리뷰 원칙

- 칭찬보다 인증 우회 가능성, 잘못된 상태 분기, 로컬/원격 충돌, SQL-코드 불일치, 과범위 확장 가능성을 우선 지적해라.
- 스타일 취향보다 `학교 이메일 우선`, `학생증 fallback`, `verified 전 접근 제한`, `제출/반려/재제출 흐름`, `다음 단계 연결성`을 더 중요하게 봐라.
- 실제 코드 리뷰처럼 validation 누락, 상태 혼선, pending/rejected 처리 불일치, 로컬 fallback 손상, SQL 정책 허점 가능성을 중심으로 보라.
