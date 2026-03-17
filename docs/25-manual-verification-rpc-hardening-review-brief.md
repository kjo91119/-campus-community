# 25. 학생증 수동 인증 RPC 보강 교차검증 지시서

문서 목적: 다른 AI 또는 리뷰어가 현재 `campus-community` 저장소에 반영된 `학생증 수동 인증 서버 권한 보강 + 제출 경계 수정` 작업을 코드와 문서 기준으로 교차검증할 때, 무엇을 어떤 기준으로 봐야 하는지 명확하게 전달한다.

아래 내용을 그대로 복사해서 다른 모델에게 전달해도 된다.
단, 이 지시서만 보내면 충분한 것이 아니라 검토 대상 코드와 관련 문서 원문도 함께 제공하거나, 같은 저장소/워크스페이스에 접근 가능한 환경에서 사용해야 한다.

---

너는 지금 Expo + TypeScript 기반 앱 프로젝트 `campus-community`의 외부 코드 리뷰어다.

이번 검토의 목적은 "새 기능 제안"이 아니라, 방금 보강된 `학생증 수동 인증 RPC / 서버 권한 / 제출 실패 처리`가 다음 기준을 만족하는지 점검하는 것이다.

## 현재 구현 목표 요약

이번 단계에서 구현한 것은 아래 범위다.

- `profiles` 직접 쓰기 권한을 줄이고 온보딩을 RPC로 이동
- 학생증 수동 인증 제출을 직접 insert 대신 RPC로 이동
- 지원 학교 이메일 계정, 중복 pending 제출, 잘못된 상태 제출을 서버에서 거절
- 클라이언트가 서버 거절을 로컬 pending 성공처럼 처리하지 않도록 제출 경계 수정
- 학교 이메일 pending과 학생증 manual pending 화면 분기 정리
- `verifications.university_id`의 현재 string ID 체계를 문서에 명시

중요:

- 아직 실제 학생증 이미지 업로드는 하지 않았다.
- 아직 운영자 승인/반려 UI는 없다.
- 아직 졸업생 허용 정책은 이번 단계 범위가 아니다.
- 이번 단계는 `서버 권한`, `RPC 경계`, `클라이언트 상태 동기화`, `문서-구현 정합성`을 먼저 닫는 것이 목적이다.
- UI 화려함보다 인증 우회 방지, 서버 거절 처리, 상태 일관성, 로컬/원격 저장 경계를 우선 검토해야 한다.

## 검토 대상 코드 파일

- `app/(auth)/email.tsx`
- `app/(auth)/manual-verification.tsx`
- `app/(auth)/index.tsx`
- `hooks/use-app-session.tsx`
- `lib/supabase/profiles.ts`
- `lib/supabase/verifications.ts`
- `types/domain.ts`
- `supabase/sql/03_create_verifications.sql`
- `supabase/sql/04_secure_profiles_and_auth_rpcs.sql`
- `supabase/migrations/20260316170000_secure_profiles_and_auth_rpcs.sql`

## 함께 참고할 문서

- `docs/04-user-flows.md`
- `docs/07-supabase-data-model-draft.md`
- `docs/08-auth-verification-moderation.md`
- `docs/09-screen-list-and-prd.md`
- `docs/12-open-questions.md`
- `docs/24-manual-verification-submission-review-brief.md`
- `TASKS.md`

## 리뷰 목표

아래 항목을 중심으로 검토해라.

1. 사용자가 `verification_status`, `primary_university_id` 같은 접근 핵심 필드를 직접 올려 인증을 우회할 수 없는가
2. 학생증 수동 인증 제출이 서버 RPC 기준으로만 승인되고, 서버 거절 시 클라이언트가 성공처럼 보이지 않는가
3. `profile.verificationStatus`와 `verificationRecord`가 hydrate/제출/실패 상황에서 심하게 어긋나지 않는가
4. 학교 이메일 pending, manual pending, rejected, verified 화면 분기가 서로 섞이지 않는가
5. SQL 파일, repository, 앱 코드, 문서가 같은 상태 모델을 가정하고 있는가
6. 이번 단계에 실제 이미지 업로드, 운영자 도구, 졸업생 정책 같은 과한 구조가 섞이지 않았는가

## 특히 강하게 봐야 할 포인트

### A. 서버 권한과 우회 가능성

- `profiles`를 authenticated 사용자가 직접 insert/update 해서 `verified`로 만들 수 없는가
- `verifications`를 직접 insert 해서 pending row를 임의 생성할 수 없는가
- `complete_onboarding_profile(...)`과 `submit_manual_verification_request(...)`가 실제로 필요한 검증을 서버에서 수행하는가
- 지원 학교 이메일 계정이 manual fallback RPC를 우회해 호출해도 막히는가

### B. 제출 경계

- `submitManualVerification()`이 서버 거절과 네트워크 실패를 구분하는가
- 서버 거절이면 로컬 pending으로 덮지 않고 실패 메시지를 그대로 보여주는가
- 네트워크 실패일 때만 로컬 fallback으로 남기는가
- 서버 접수는 되었지만 profile 재조회만 실패한 경우, 화면 상태가 과도하게 깨지지 않는가

### C. 상태 분기와 화면 의미

- 학교 이메일 pending이 manual 검토 대기로 보이지 않는가
- manual rejected이면 반려 사유와 재제출 흐름이 자연스러운가
- pending인데 manual record가 없는 꼬인 상태를 복구할 수 있는가
- `verified` 전 탭 차단과 온보딩 유도가 여전히 안전한가

### D. SQL / 문서 정합성

- `03_create_verifications.sql`과 `04_secure_profiles_and_auth_rpcs.sql`이 현재 앱 코드가 기대하는 구조와 맞는가
- `verifications.university_id`가 현재 string ID 체계라는 사실이 문서와 구현에서 일관되게 설명되는가
- 지금 단계에서 SQL이 과도한 운영 기능이나 업로드 기능까지 포함하지는 않는가

### E. 범위 관리

- 실제 이미지 업로드 없이도 제출/대기/반려/재제출 흐름 MVP 검증이 가능한가
- 운영자 승인 UI, Storage bucket, 졸업생 권한 같은 다음 단계 항목이 이번 코드에 섞이지 않았는가
- fallback 가입 문구가 너무 학교 이메일 중심이어서 사용자 의미를 흐리지 않는가

## 원하는 응답 형식

반드시 아래 형식으로 답해라.

### 1. 핵심 발견사항

- 심각도 순서대로 정리
- 각 항목마다 관련 파일명을 명시
- 왜 문제가 되는지 짧고 명확하게 설명

### 2. 서버 권한 / 제출 경계 평가

- 적절함 / 약간 위험함 / 더 보완 필요
- 이유를 3~5줄로 설명

### 3. 문서 / 코드 / SQL 충돌 여부

- 충돌 있음 / 없음
- 있다면 어떤 문서와 어떤 코드 또는 SQL이 어긋나는지 구체적으로

### 4. 저장 경계 평가

- 로컬/원격 verification 저장 구조와 RPC 경계가 현재 단계에서 적절한지 평가
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

- 칭찬보다 인증 우회 가능성, 서버 거절 처리 누락, 로컬/원격 상태 엇갈림, SQL-문서 불일치, 과범위 확장 가능성을 우선 지적해라.
- 스타일 취향보다 `학교 이메일 우선`, `학생증 fallback`, `verified 전 접근 제한`, `RPC 기반 서버 강제`, `제출/반려/재제출 흐름`, `다음 단계 연결성`을 더 중요하게 봐라.
- 실제 코드 리뷰처럼 validation 누락, optimistic update 과실, pending/rejected 처리 불일치, 로컬 fallback 손상, RLS 허점 가능성을 중심으로 보라.
