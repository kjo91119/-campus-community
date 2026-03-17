# 35. analytics 계측 교차검증 지시서

이번 검토는 외부 분석 도구 연동이 아니라, 현재 `AnalyticsProvider` 기반 로컬 이벤트 버퍼와 주요 사용자 흐름 계측이 제대로 들어갔는지를 본다. 이벤트 이름, 계층 분리, 계측 누락, 과도한 중복 발생 가능성, 문서와의 일치만 평가해라.

## 답변 작성 위치

- 답변은 `docs/35-analytics-instrumentation-review-brief-validation.md`에 작성해라.

## 꼭 읽을 파일

- `hooks/use-analytics.tsx`
- `app/_layout.tsx`
- `hooks/use-app-session.tsx`
- `hooks/use-community-data.tsx`
- `app/(auth)/index.tsx`
- `app/(auth)/email.tsx`
- `app/(auth)/manual-verification.tsx`
- `app/(auth)/onboarding.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/school.tsx`
- `app/(tabs)/recruit.tsx`
- `app/(tabs)/write.tsx`
- `app/(tabs)/recruit-write.tsx`
- `app/(tabs)/posts/[postId].tsx`
- `app/(tabs)/recruitments/[recruitmentId].tsx`
- `docs/10-metrics-and-analytics.md`
- `scripts/check-analytics-instrumentation.mjs`

## 이번 검토에서 특히 봐야 할 것

- analytics 계층이 화면/훅에서 직접 AsyncStorage를 건드리지 않고 provider로 모였는지
- 인증, 수동 인증, 온보딩, 홈/학교/모집 진입, 글/댓글/모집 생성, 신고/차단 이벤트가 최소한 들어갔는지
- 과도한 중복 계측이나 mount 반복으로 이벤트가 지나치게 많이 쌓일 위험이 있는지
- 문서의 KPI/이벤트 초안과 현재 계측 범위가 크게 어긋나지 않는지

## 이번 단계에서 구현하지 말아야 할 것

- PostHog, Amplitude 같은 외부 SDK 즉시 도입
- 이벤트 스키마 전면 재설계
- BI 대시보드 구현

## 답변 형식

반드시 아래 형식대로 답변 작성해라.

### 1. 핵심 발견사항
### 2. analytics 계층 평가
### 3. 문서 / 코드 충돌 여부
### 4. 이벤트 저장 / 계측 경계 평가
### 5. 지금 단계에서 구현하지 말아야 할 것
### 6. 바로 보완할 것
### 7. 최종 판단

마지막 줄에는 `검증:` 섹션으로 실행한 확인 항목을 적어라.
