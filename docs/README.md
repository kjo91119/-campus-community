# 문서 인덱스

문서 목적: 개발 착수 전 `campus-community`의 MVP 기획, 정보구조, 데이터 구조, 실행 순서를 한 번에 파악할 수 있게 정리한다.

## 공통 가정 (Assumptions)

- 이 저장소는 Expo + TypeScript 기반 모바일 앱이며, 현재 단계에서는 설계 문서화가 구현보다 우선이다.
- 인증은 학교를 통해 신뢰를 확보하되, 실제 체류 가치는 전공군 기반 네트워크에서 나온다고 가정한다.
- 초기 런칭 전공군은 물리치료, 작업치료, 방사선, 임상병리 4개이며, 서로 분리된 섬이 아니라 하나의 상위 네트워크 안에서 함께 활성화되도록 설계한다.
- 백엔드는 추후 Supabase를 사용하는 방향을 기본 가정으로 삼는다.

## 추천 읽기 순서

1. [00-current-state-audit.md](./00-current-state-audit.md)
2. [01-product-definition.md](./01-product-definition.md)
3. [02-mvp-scope.md](./02-mvp-scope.md)
4. [05-information-architecture.md](./05-information-architecture.md)
5. [04-user-flows.md](./04-user-flows.md)
6. [07-supabase-data-model-draft.md](./07-supabase-data-model-draft.md)
7. [08-auth-verification-moderation.md](./08-auth-verification-moderation.md)
8. [09-screen-list-and-prd.md](./09-screen-list-and-prd.md)
9. [10-metrics-and-analytics.md](./10-metrics-and-analytics.md)
10. [11-roadmap.md](./11-roadmap.md)
11. [12-open-questions.md](./12-open-questions.md)
12. [13-cross-review-brief.md](./13-cross-review-brief.md)
13. [14-phase1-cross-review-brief.md](./14-phase1-cross-review-brief.md)
14. [15-phase1-implementation-review-brief.md](./15-phase1-implementation-review-brief.md)
15. [16-supabase-connection-prep.md](./16-supabase-connection-prep.md)
16. [17-phase1-data-supabase-review-brief.md](./17-phase1-data-supabase-review-brief.md)
17. [18-supabase-auth-implementation-review-brief.md](./18-supabase-auth-implementation-review-brief.md)
18. [19-onboarding-profile-implementation-review-brief.md](./19-onboarding-profile-implementation-review-brief.md)
19. [20-post-implementation-cross-verification-instructions.md](./20-post-implementation-cross-verification-instructions.md)
20. [21-posts-comments-implementation-review-brief.md](./21-posts-comments-implementation-review-brief.md)
21. [TASKS.md](../TASKS.md)

## 문서 목록

| 문서 | 요약 |
| --- | --- |
| [00-current-state-audit.md](./00-current-state-audit.md) | 현재 저장소가 어디까지 준비되어 있는지 점검한다. Expo 기본 구조, 현재 구현 상태, 왜 지금 설계가 먼저 필요한지 짧고 명확하게 정리했다. |
| [01-product-definition.md](./01-product-definition.md) | 서비스의 정체성을 정의한다. 왜 대학생 전체 커뮤니티가 아니라 보건의료기사 계열 전공 네트워크로 가야 하는지, 문제와 차별점, 핵심 가치 제안을 정리했다. |
| [02-mvp-scope.md](./02-mvp-scope.md) | MVP 범위를 최대한 좁혀 결정한다. MVP, V1, Later를 나누고 이번에 절대 만들지 않을 항목까지 명시했다. |
| [03-user-personas-and-jtbd.md](./03-user-personas-and-jtbd.md) | 핵심 사용자 유형과 JTBD를 정리한다. 누가 어떤 이유로 앱을 열고, 어떤 상황에서 이 서비스를 필요로 하는지 구체화했다. |
| [04-user-flows.md](./04-user-flows.md) | 가입, 인증, 온보딩, 피드 탐색, 글쓰기, 신고, 차단, 모집 참여까지 핵심 사용 흐름을 단계별로 정리했다. 예외 케이스도 함께 담았다. |
| [05-information-architecture.md](./05-information-architecture.md) | MVP 기준 앱 구조를 제안한다. 통합 홈, 전공 필터, 학교 보드, 모집, 프로필 간 관계를 정리하고, 빈 게시판 문제를 줄이는 IA를 제안했다. |
| [06-launch-major-strategy.md](./06-launch-major-strategy.md) | 물리치료, 작업치료, 방사선, 임상병리 4개 전공군을 동시에 시작하는 전략을 다룬다. 초기 밀도 확보와 확장 전략까지 포함했다. |
| [07-supabase-data-model-draft.md](./07-supabase-data-model-draft.md) | Supabase/Postgres 기준 데이터 모델 초안이다. 핵심 테이블, 관계, RLS 방향, 통합 홈과 학교 보드 지원 방식을 정리했다. |
| [08-auth-verification-moderation.md](./08-auth-verification-moderation.md) | 인증, 익명성, 운영 정책을 다룬다. 학교 이메일 인증, 학생증 수동 인증, 신고/차단/제재 정책을 MVP 기준으로 설계했다. |
| [09-screen-list-and-prd.md](./09-screen-list-and-prd.md) | 실제 구현이 필요한 화면 목록과 화면별 핵심 요구사항을 정리했다. 어떤 순서로 개발을 시작해야 하는지까지 포함한다. |
| [10-metrics-and-analytics.md](./10-metrics-and-analytics.md) | MVP 성공 판단 지표와 이벤트 설계를 다룬다. 가입, 인증, 첫 활동, 리텐션, 모집 참여를 어떤 이벤트로 추적할지 제안했다. |
| [11-roadmap.md](./11-roadmap.md) | Phase 단위의 개발 로드맵과 주차별 초안을 담는다. 목표, 구현 범위, 선행조건, 리스크를 함께 정리했다. |
| [12-open-questions.md](./12-open-questions.md) | 아직 결정되지 않은 제품, 운영, 기술 이슈를 모았다. 각 항목마다 추천 방향과 선택지 비교를 함께 적었다. |
| [13-cross-review-brief.md](./13-cross-review-brief.md) | 다른 모델이나 리뷰어에게 문서 세트 교차검증을 요청할 때 쓰는 지시서다. 충돌, 과범위, 운영 리스크를 중심으로 보게 만든다. |
| [14-phase1-cross-review-brief.md](./14-phase1-cross-review-brief.md) | 최신 기준으로 문서 정합성과 Phase 1 구현 계획을 함께 검토하는 지시서다. 4탭 구조, 모집 댓글 방식, 권한 매트릭스, 파일 작업 순서까지 같이 보게 만든다. |
| [15-phase1-implementation-review-brief.md](./15-phase1-implementation-review-brief.md) | 실제 구현된 Phase 1 골격 코드를 검토하는 지시서다. 라우팅, 세션 가드, 더미 데이터 구조, 문서-구현 일치 여부를 코드 리뷰 관점에서 보게 만든다. |
| [16-supabase-connection-prep.md](./16-supabase-connection-prep.md) | 현재 앱 구조와 문서의 데이터 모델을 대조하고, Supabase 연결 직전에 필요한 env, 패키지, 파일 구조, 연결 우선순위를 정리한 준비 문서다. |
| [17-phase1-data-supabase-review-brief.md](./17-phase1-data-supabase-review-brief.md) | 타입, mock 데이터, Supabase 연결 전 준비 상태를 다시 교차검증받기 위한 최신 지시서다. 데이터 구조와 다음 단계 연결성 중심으로 보게 만든다. |
| [18-supabase-auth-implementation-review-brief.md](./18-supabase-auth-implementation-review-brief.md) | Supabase Auth 구현 단계를 교차검증하기 위한 최신 지시서다. 세션 유지, 이메일 auth 흐름, auth/tabs 분기, 다음 단계 `profiles` 연결성을 중심으로 보게 만든다. |
| [19-onboarding-profile-implementation-review-brief.md](./19-onboarding-profile-implementation-review-brief.md) | 인증 이후 온보딩/프로필 초기 설정 구현을 교차검증하기 위한 최신 지시서다. 학교/전공군 선택, `profiles` 저장 경계, 홈 진입 조건, SQL-타입-코드 정합성을 중심으로 보게 만든다. |
| [20-post-implementation-cross-verification-instructions.md](./20-post-implementation-cross-verification-instructions.md) | 작업 완료 후 최종 점검용 교차검증 지시서다. 다른 개발자나 다른 모델이 설계 문서와 실제 결과물을 대조해 치명적 누락, 과범위, 정체성 이탈을 검토할 수 있게 만들었다. |
| [21-posts-comments-implementation-review-brief.md](./21-posts-comments-implementation-review-brief.md) | 게시글 작성과 댓글 구현 단계를 교차검증하기 위한 최신 지시서다. 글쓰기/댓글 흐름, 전공·학교 보드 진입, 권한 분기, 로컬 저장 경계, 다음 단계 Supabase 연결성을 중심으로 보게 만든다. |
| [TASKS.md](../TASKS.md) | 실제 실행 체크리스트다. 오늘 할 일, 이번 주 할 일, MVP 전 필수, 출시 전 필수로 나눠 개발자가 바로 움직일 수 있게 작성했다. |

## 문서 사용 원칙

- 용어 기준은 [01-product-definition.md](./01-product-definition.md)의 정의를 따른다.
- MVP 기능 판단은 [02-mvp-scope.md](./02-mvp-scope.md)를 우선 기준으로 삼는다.
- 화면 설계는 [05-information-architecture.md](./05-information-architecture.md)와 [09-screen-list-and-prd.md](./09-screen-list-and-prd.md)를 함께 본다.
- 데이터 구조는 [07-supabase-data-model-draft.md](./07-supabase-data-model-draft.md)를 기준으로 하고, 인증 정책은 [08-auth-verification-moderation.md](./08-auth-verification-moderation.md)와 맞춘다.
- 작업 완료 후 최종 점검은 [20-post-implementation-cross-verification-instructions.md](./20-post-implementation-cross-verification-instructions.md)를 기준으로 진행한다.

## 정합성 체크 메모

- 전공군 중심 전략, 학교는 인증과 제한된 학교 보드 수단이라는 원칙을 모든 문서에서 동일하게 사용했다.
- MVP에서는 커뮤니티 핵심 흐름을 우선하고, 실시간 채팅, 대규모 소셜 기능, 복잡한 랭킹은 제외하는 기준을 유지했다.
- 4개 전공군 동시 런칭을 전제로 하되, 통합 홈과 통합 모집으로 초기 빈 게시판 문제를 줄이는 방향을 일관되게 유지했다.
- MVP 네비게이션은 `홈 / 모집 / 학교 / 프로필`, 모집 참여는 댓글 기반, 수동 인증/신고는 SLA와 보관 기준까지 문서에 고정했다.
- 구현 완료 후 교차검증에서도 위 원칙을 그대로 재사용하도록 지시서를 추가했다.
