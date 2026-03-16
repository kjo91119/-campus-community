# 14. Phase 1 교차검증 지시서

문서 목적: 다른 AI 또는 리뷰어가 현재 문서 세트와 Phase 1 구현 계획을 함께 교차검증할 때, 무엇을 어떤 기준으로 봐야 하는지 명확하게 전달한다.

아래 내용을 그대로 복사해서 다른 모델에게 전달해도 된다.
단, 이 지시서만 보내면 충분한 것이 아니라 검토 대상 문서 원문도 함께 제공하거나, 같은 저장소/워크스페이스에 접근 가능한 환경에서 사용해야 한다.

---

너는 지금 Expo + TypeScript 기반 앱 프로젝트 `campus-community`의 외부 검토자다.

이번 검토의 목적은 두 가지다.

1. 이미 작성된 MVP 기획/설계 문서 세트가 현재 기준에서 서로 충돌하지 않는지 점검
2. "실제 구현 시작 직전" 기준으로 정리된 Phase 1 구현 범위와 작업 순서가 현실적인지 검토

중요:

- 이번 검토는 "대규모 구현 제안"이 아니라 "지금 당장 어떤 범위로 시작해야 안전한지"를 검증하는 데 집중해라.
- 기능을 늘리는 제안보다 범위를 더 명확히 줄이는 제안을 우선해라.

## 프로젝트 핵심 컨텍스트

- 이 서비스는 한국 대학생 대상의 "보건의료기사 계열 전공군 중심 인증 커뮤니티" 앱이다.
- 초기 런칭 전공군은 물리치료, 작업치료, 방사선, 임상병리 4개다.
- 핵심 정체성은 "대학생 전체 커뮤니티"가 아니라 "전공 네트워크"다.
- 학교는 핵심 체류 가치가 아니라, 인증과 제한형 학교 보드를 위한 장치다.
- 초기 빈 게시판 문제를 줄이기 위해 통합 홈, 통합 모집, 전공군 필터 구조를 우선한다.
- 현재 기준 MVP 바텀탭은 `홈 / 모집 / 학교 / 프로필` 4개로 고정했다.
- 전공군 탐색은 별도 탭이 아니라 홈 내부 필터와 전공군 집중 보기 상태로 처리한다.
- 모집 참여 방식은 별도 신청 테이블 없이 "참여 의사 댓글"로 시작한다.
- 인증 상태별 권한 매트릭스와 수동 인증/신고 SLA, 증빙 보관 기준은 문서에 반영되어 있다.
- 백엔드는 추후 Supabase를 사용할 가능성이 높다.

## 검토 대상 파일

- `docs/README.md`
- `docs/00-current-state-audit.md`
- `docs/01-product-definition.md`
- `docs/02-mvp-scope.md`
- `docs/03-user-personas-and-jtbd.md`
- `docs/04-user-flows.md`
- `docs/05-information-architecture.md`
- `docs/06-launch-major-strategy.md`
- `docs/07-supabase-data-model-draft.md`
- `docs/08-auth-verification-moderation.md`
- `docs/09-screen-list-and-prd.md`
- `docs/10-metrics-and-analytics.md`
- `docs/11-roadmap.md`
- `docs/12-open-questions.md`
- `TASKS.md`

## 현재 구현 직전 기준안

아래는 현재 팀이 구현 시작 직전 기준으로 잠정 확정한 내용이다. 이 기준이 문서와 잘 맞는지 검토해라.

### A. Phase 1 구현 범위

- 인증 진입 화면
- 학교 이메일 인증 화면
- 학생증 수동 인증 제출/상태 화면
- 온보딩 화면
- 사용자 세션 상태 관리
- 인증 상태별 라우팅 가드
- MVP 4탭 골격 구현
- 통합 홈의 "쉘" 화면 구현

중요:

- Phase 1에서는 실제 게시글/댓글 CRUD를 크게 구현하지 않는다.
- Phase 1 종료 기준은 "인증 완료 사용자가 온보딩 후 홈으로 진입할 수 있음"이다.

### B. 가장 먼저 구현할 화면 5개

1. 시작/인증 진입 화면
2. 학교 이메일 인증 화면
3. 학생증 수동 인증 제출/상태 화면
4. 온보딩 화면
5. 통합 홈 쉘 화면

### C. 가장 먼저 만들 데이터 구조 5개

1. `profiles`
2. `universities`
3. `major_groups`
4. `verifications`
5. `boards`

### D. 현재 저장소 기준 파일 작업 순서 초안

중요:

- 아래 목록에 있는 파일 중 현재 저장소에 없는 파일은 "새로 만들 예정인 파일"로 간주하고 검토해라.

1. `app/_layout.tsx`
2. `app/(auth)/_layout.tsx`
3. `app/(auth)/index.tsx`
4. `app/(auth)/email.tsx`
5. `app/(auth)/manual-verification.tsx`
6. `app/(auth)/onboarding.tsx`
7. `types/domain.ts` 또는 `types/auth.ts`
8. `constants/major-groups.ts`
9. `hooks/use-app-session.ts`
10. `app/(tabs)/_layout.tsx`
11. `app/(tabs)/index.tsx`
12. `app/(tabs)/recruit.tsx`
13. `app/(tabs)/school.tsx`
14. `app/(tabs)/profile.tsx`

### E. 현재 저장소 실제 파일 구조

- `app/_layout.tsx`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/chat.tsx`
- `app/(tabs)/profile.tsx`
- `app/modal.tsx`
- `components/*`
- `constants/theme.ts`
- `hooks/*`

## 검토 목표

아래 항목을 중심으로 검토해라.

1. 문서 간 논리 충돌이 남아 있는가
2. 현재 고정한 4탭 구조가 문서 전체와 잘 맞는가
3. 모집 참여를 댓글 기반으로 단순화한 결정이 플로우, 데이터 모델, 화면 요구사항과 일치하는가
4. 인증 상태별 권한 매트릭스가 플로우와 데이터 구조에 맞게 반영되어 있는가
5. Phase 1 범위가 과하지 않고 현실적인가
6. Phase 1에서 너무 이른 구현이 섞여 있지는 않은가
7. Phase 1이 끝났을 때 실제로 다음 단계 구현으로 자연스럽게 이어질 수 있는가
8. 파일 단위 작업 순서가 현재 저장소 구조와 맞는가
9. 반드시 먼저 정리해야 하는 타입/상수/훅이 빠져 있지는 않은가
10. 아직 구현하면 안 되는 항목이 계획에 섞여 있지는 않은가

## 특히 강하게 봐야 할 포인트

### A. 문서 간 정합성

다음 연결을 특히 점검해라.

- `02-mvp-scope.md` 와 `05-information-architecture.md`
- `04-user-flows.md` 와 `07-supabase-data-model-draft.md`
- `07-supabase-data-model-draft.md` 와 `08-auth-verification-moderation.md`
- `09-screen-list-and-prd.md` 와 `11-roadmap.md`
- `11-roadmap.md` 와 `TASKS.md`

### B. Phase 1 범위 적절성

다음 질문으로 검토해라.

- 인증, 온보딩, 홈 쉘까지만으로 Phase 1을 닫는 것이 적절한가
- 홈 쉘 구현에 실제 피드 CRUD가 없어도 되는가
- 학교 보드와 모집 탭은 골격만 두고 뒤로 미루는 게 맞는가
- 세션/가드/권한 기준이 먼저 잡혀야 하는 구조인가

### C. 파일 작업 순서 현실성

다음 질문을 봐라.

- Expo Router 구조에서 `app/_layout.tsx`를 먼저 정리하는 순서가 맞는가
- `types/`, `constants/`, `hooks/`를 언제 만드는 게 가장 효율적인가
- 기존 `app/(tabs)/chat.tsx`는 어떻게 처리하는 게 안전한가
- `recruit.tsx`, `school.tsx`를 바로 만들지, placeholder로 둘지 판단이 필요한가

### D. 운영/데이터 선행조건

다음 항목을 보라.

- `profiles`, `verifications`, `boards` 없이 라우팅 가드를 구현할 수 있는가
- 대학 도메인과 전공군 상수를 어떤 수준까지 먼저 고정해야 하는가
- Supabase 연동 전에도 목업 타입과 상태 기계를 먼저 만드는 게 맞는가

## 원하는 응답 형식

반드시 아래 형식으로 답해라.

### 1. 핵심 발견사항

- 심각도 순서대로 정리
- 각 항목마다 관련 파일명 또는 문서명을 명시
- 왜 문제가 되는지 짧고 명확하게 설명

### 2. 문서 간 충돌 여부

- 충돌 있음 / 없음
- 있다면 어떤 문서끼리 어떻게 충돌하는지 구체적으로

### 3. Phase 1 범위 평가

- 너무 넓음 / 적절함 / 더 좁혀야 함
- 이유를 3~5줄로 설명

### 4. 가장 먼저 만들 화면 5개 검토

- 현재 우선순위가 적절한지
- 바꿔야 할 순서가 있다면 제안

### 5. 가장 먼저 만들 데이터 구조 5개 검토

- 현재 우선순위가 적절한지
- 빠진 핵심 구조가 있다면 제안

### 6. 파일 단위 작업 순서 검토

- 지금 순서대로 가도 되는지
- 수정이 필요하면 더 나은 순서를 제안

### 7. 지금 단계에서 구현하지 말아야 할 것

- 지금 끼어들면 범위를 키우는 항목
- 당장은 placeholder만 두거나 아예 미루는 게 맞는 항목

### 8. 최종 판단

아래 두 문장을 반드시 포함해라.

1. "이 기준으로 Phase 1 구현을 바로 시작해도 되는가?"
2. "시작 전에 마지막으로 고쳐야 할 상위 3개 항목"

## 리뷰 원칙

- 칭찬보다 문제 발견과 위험 지적을 우선해라.
- 애매하면 보수적으로 판단해라.
- "좋아 보인다"보다 "어디가 흔들리는지"를 더 중요하게 봐라.
- 기능 추가보다 범위 축소, 순서 조정, 의존성 정리를 우선 제안해라.
- 실제 PM/기획/개발 착수 관점에서 검토해라.

---

## 사용 메모

- 이 지시서는 Claude, GPT, Gemini 같은 다른 모델에 그대로 넣어도 된다.
- 이번 라운드에서는 "문서 정합성 + Phase 1 착수 가능성"을 같이 보는 것이 핵심이다.
