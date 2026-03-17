# 35. analytics 계측 교차검증 검증 결과

### 1. 핵심 발견사항

- 중간: `school_email_verified`, `manual_verification_approved`, `manual_verification_rejected`는 같은 `useEffect`에서 발화되는데, dedupe key에 `profile.accountStatus`가 포함돼 있다. 그래서 검증 상태가 그대로인 사용자가 나중에 restricted/banned로 바뀌면 인증 완료/반려 이벤트가 다시 찍힐 수 있다. 관련: `hooks/use-app-session.tsx:591-629`
- 낮음: `manual_verification_started`, `onboarding_started`, `school_board_viewed`는 `isHydrating` / redirect 가드보다 먼저 실행되는 `useEffect`에 있다. 화면이 실제로 안정적으로 보이기 전에도 이벤트가 찍힐 수 있고, 동일 방문 안에서 상태 변화가 있으면 다시 발화할 여지가 있다. 관련: `app/(auth)/manual-verification.tsx:59-64`, `app/(auth)/onboarding.tsx:43-48`, `app/(tabs)/school.tsx:23-30`
- 핵심 이벤트 범위와 계층 분리는 이미 잘 들어가 있다. 인증, 수동 인증, 온보딩, 홈/학교/모집 진입, 글/댓글/모집 생성, 신고/차단 이벤트는 모두 확인된다.

### 2. analytics 계층 평가

- `구조는 적절함`
- 화면과 훅이 직접 `AsyncStorage`를 건드리지 않고 `AnalyticsProvider`의 `track(...)`만 쓰는 구조로 모여 있다. 관련: `hooks/use-analytics.tsx:63-123`, `app/_layout.tsx:13-26`
- 인증, 수동 인증, 온보딩, 홈/학교/모집 진입, 글/댓글/모집 생성, 신고/차단 이벤트는 최소 범위가 들어가 있다. 관련: `hooks/use-app-session.tsx:585-639`, `hooks/use-community-data.tsx:1173-1726`, `scripts/check-analytics-instrumentation.mjs`
- 로컬 버퍼 크기 제한과 dev 로그도 있어 MVP 단계 관측 장치로는 충분하다. 관련: `hooks/use-analytics.tsx:53-55`, `hooks/use-analytics.tsx:98-116`

### 3. 문서 / 코드 충돌 여부

- `대체로 정렬됨`
- `manual_verification_started`는 실제로 수동 인증 화면 한 군데에서만 기록되고, `major_filter_applied`도 홈 첫 mount가 아니라 사용자가 필터를 눌렀을 때만 기록된다. 관련: `app/(auth)/manual-verification.tsx:59-64`, `app/(tabs)/index.tsx:51-60`, `docs/10-metrics-and-analytics.md:151-165`
- 문서가 다음 단계 후보 이벤트로 내려 둔 `category_filter_applied`, `reply_created`, `content_hidden_by_moderation`도 현재 코드와 충돌하지 않는다.
- 남는 차이는 이벤트 "존재"가 아니라 발화 시점의 엄밀성이다. 일부 start/view 이벤트가 hydration 이전에도 찍힐 수 있다는 점은 문서보다 구현이 약간 느슨하다.

### 4. 이벤트 저장 / 계측 경계 평가

- `대체로 적절하지만 일부 중복 위험이 있음`
- 저장 경계는 provider 단일 진입점이라 깔끔하다. 관련: `hooks/use-analytics.tsx:63-123`
- 다만 인증 결과 이벤트는 계정 상태 변화에 의해 재발화될 수 있고, 일부 screen-start/view 이벤트는 hydration 이전에도 발화될 수 있다.
- 현재 회귀 스크립트는 "이벤트가 있는지"를 잘 보지만, "중복 없이 올바른 시점에 발화되는지"까지는 보지 않는다. 관련: `scripts/check-analytics-instrumentation.mjs`

### 5. 지금 단계에서 구현하지 말아야 할 것

- PostHog, Amplitude 같은 외부 SDK 즉시 도입
- 이벤트 스키마 전면 재설계
- BI 대시보드 구현

### 6. 바로 보완할 것

- 인증 완료/반려 이벤트와 계정 상태 이벤트를 같은 dedupe key로 묶지 말고, 최소한 검증 결과 이벤트는 `accountStatus` 변화에 영향받지 않게 분리
- `manual_verification_started`, `onboarding_started`, `school_board_viewed`는 `isHydrating` 이후에 한 번만 찍히도록 ref 가드나 조건을 두는 편이 안전하다.
- 가능하면 account status 전환과 hydration/redirect 시나리오에서 중복 발화를 막는 동작 테스트를 추가

### 7. 최종 판단

- analytics 계층 분리 자체는 잘 되어 있다.
- 다만 퍼널과 인증 전환 수치를 신뢰하려면 중복 발화 가능성부터 먼저 정리하는 편이 맞다.

검증: 지정 브리프의 코드/문서 수동 대조, `npm run check:analytics`, `npm run typecheck`
