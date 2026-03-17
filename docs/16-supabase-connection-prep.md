# 16. Supabase 연결 전 준비

문서 목적: 현재 문서의 데이터 모델과 앱 코드 구조를 대조하고, 실제 Supabase 연결 직전에 필요한 env, 초기화 파일 구조, 연결 우선순위를 안전하게 고정한다.

## 대조 기준

- 데이터 모델 기준 문서: `docs/07-supabase-data-model-draft.md`
- 인증/운영 기준 문서: `docs/08-auth-verification-moderation.md`
- MVP 범위 기준 문서: `docs/02-mvp-scope.md`
- 현재 앱 기준 파일: `types/domain.ts`, `data/mock-community.ts`, `hooks/use-app-session.tsx`, `app/(auth)/*`, `app/(tabs)/*`

## 문서와 앱 코드 구조 대조

| 문서 엔터티 | 현재 앱 코드 대응 | 상태 | 메모 |
| --- | --- | --- | --- |
| `profiles` | `Profile`, `use-app-session.tsx`, `MOCK_PROFILES` | 정렬됨 | 앱 코드는 camelCase, DB는 추후 snake_case 매핑으로 연결 |
| `universities` | `University`, `MOCK_UNIVERSITIES` | 정렬됨 | 학교 도메인과 지역 정보를 mock 단계에서 이미 포함 |
| `major_groups` | `MajorGroup`, `constants/major-groups.ts` | 정렬됨 | 초기 4개 전공군과 정렬 순서, 런칭 여부 반영 |
| `majors` | `Major`, `MOCK_MAJORS` | 준비됨 | UI는 아직 직접 쓰지 않지만 온보딩/검색 대비용으로 확보 |
| `verifications` | `VerificationRow`, `VerificationRecord`, `MOCK_VERIFICATIONS` | 정렬됨 | row 타입과 화면 표시용 보조 필드를 분리해 유지 |
| `boards` | `Board`, `MOCK_BOARDS` | 정렬됨 | 통합 홈, 전공군, 학교 보드 구조 모두 표현 가능 |
| `posts` | `PostRow`, `CommunityPost`, `MOCK_POSTS` | 정렬됨 | row와 피드 표시용 view model을 나눠도 현재 화면 골격을 유지 가능 |
| `comments` | `CommentRow`, `Comment`, `MOCK_COMMENTS` | 정렬됨 | `comment_kind` 방향을 반영해 일반 댓글과 모집 참여 의사 댓글을 구분 |
| `recruitments` | `RecruitmentRow`, `RecruitmentCard`, `MOCK_RECRUITMENTS` | 정렬됨 | row와 카드용 표시 필드를 분리해도 `post_id` 중심 구조 유지 |
| `reactions` | 없음 | 의도적 제외 | MVP 이후 검토 |
| `reports` | `ReportRecord`, `use-community-data.tsx`, `supabase/sql/06_add_reports_blocks_rpcs.sql` | 진행 중 | 로컬 UI와 RPC 초안은 연결됐고, 운영 검토 흐름은 `moderation_events`와 함께 확장 중 |
| `blocks` | `BlockRecord`, `use-community-data.tsx`, `supabase/sql/06_add_reports_blocks_rpcs.sql` | 진행 중 | 차단 필터와 차단 목록은 앱에 연결됐고, RPC 기반 원격 저장을 사용한다 |
| `notifications` | 없음 | 의도적 제외 | MVP 밖 |

## 지금 단계에서 고정한 앱 레벨 규칙

- 프론트엔드 타입은 camelCase를 유지한다.
- 실제 DB 연결 시 snake_case 변환은 API 계층 또는 mapper에서 처리한다.
- DB row 타입과 화면 view model은 분리하되, mock 데이터는 현재 화면이 바로 쓸 수 있는 view model 기준도 함께 유지한다.
- 모집 참여는 별도 `recruitment_applications` 없이 `comments.kind = recruitment_intent` 방향을 유지한다.
- 학교 보드는 `boards.scopeType = university`와 `posts.universityId` 스냅샷으로 처리한다.
- 인증 전 커뮤니티 접근은 막고, `verified + onboardingCompleted` 조합부터 탭 진입을 허용한다.

## 필요한 env 목록

필수:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 또는 `EXPO_PUBLIC_SUPABASE_ANON_KEY`

선택:

- `EXPO_PUBLIC_SUPABASE_VERIFICATION_BUCKET`

메모:

- 기본 버킷 이름은 `manual-verification-evidence`로 두고 있다.
- `SUPABASE_SERVICE_ROLE_KEY`는 Expo 앱에 절대 넣지 않는다.
- `lib/supabase/client.ts` bootstrap은 금지된 client env 키가 있으면 `invalid_env`로 실패하도록 잡는다.

## 필요한 패키지 목록

필수 후보:

- `@supabase/supabase-js`
- `react-native-url-polyfill`

세션 저장 전략 선택 시 필요:

- `expo-sqlite`
- `@react-native-async-storage/async-storage`

선택 후보:

- `expo-secure-store`

메모:

- Supabase 공식 Expo/RN 가이드 기준으로 `@supabase/supabase-js`와 RN 환경 보조 패키지 검토가 필요하다.
- 현재 저장소에는 위 패키지를 아직 설치하지 않았다.
- 세션 저장은 공식 quickstart처럼 `expo-sqlite` 기반으로 시작하거나, auth 중심 가이드처럼 `@react-native-async-storage/async-storage`를 쓰는 방식 중 하나를 고르면 된다.
- 민감도 요구가 높거나 소셜 로그인까지 고려하면 이후 `expo-secure-store` 조합을 검토한다.

## fresh DB 부트스트랩 순서

migration 기준:

1. `supabase/migrations/20260316120000_create_profiles.sql`
2. `supabase/migrations/20260316130000_create_verifications.sql`
3. `supabase/migrations/20260316153000_create_community_tables.sql`
4. `supabase/migrations/20260316170000_secure_profiles_and_auth_rpcs.sql`
5. `supabase/migrations/20260316180000_add_profile_summary_rpc.sql`
6. `supabase/migrations/20260316190000_add_reports_blocks_rpcs.sql`
7. `supabase/migrations/20260316191000_add_moderation_actions.sql`

로컬 SQL editor 기준:

1. `supabase/sql/03_create_verifications.sql`
2. `supabase/sql/04_secure_profiles_and_auth_rpcs.sql`
3. `supabase/sql/05_add_profile_summary_rpc.sql`
4. `supabase/sql/06_add_reports_blocks_rpcs.sql`
5. `supabase/sql/07_add_moderation_actions.sql`

메모:

- `03_create_verifications.sql`은 단독 해석용이 아니라 `04_secure_profiles_and_auth_rpcs.sql`과 순서대로 함께 적용하는 전제다.
- fresh DB에서는 `profiles` 생성 이후 `verifications`를 먼저 만들고, 그 다음에 권한/RPC hardening을 올리는 순서가 맞다.

## 클라이언트 초기화 파일 구조 제안

권장 구조:

- `lib/supabase/env.ts`
- `lib/supabase/client.ts`
- 추후 추가: `lib/supabase/mappers.ts`
- 추후 추가: `lib/supabase/queries/*`

역할:

- `env.ts`: env 키 이름과 필수값 체크
- `client.ts`: 금지 env 검증과 실제 `createClient` 초기화 위치
- `mappers.ts`: Supabase row와 앱 타입 간 snake_case / camelCase 변환
- `queries/*`: 인증, 프로필, 글, 댓글, 모집글 단위의 호출 정리

## 먼저 연결할 기능 1순위~5순위

1. 인증 세션 기초
2. `profiles` 조회/업데이트
3. `posts` 목록과 상세 조회
4. `comments` 목록/작성
5. `recruitments` 메타데이터 연결

### 연결 순서 설명

- 1순위 인증 세션: 현재 `use-app-session.tsx` 더미 상태를 실제 세션으로 바꾸는 가장 작은 진입점이다.
- 2순위 프로필: 인증 직후 온보딩과 접근 제어가 모두 `profiles`에 걸려 있으므로 먼저 안정화해야 한다.
- 3순위 게시글: 홈/학교/모집 대부분의 UI 골격이 `posts`를 중심으로 돌아간다.
- 4순위 댓글: MVP 핵심 루프이자 모집 참여 방식과 직접 연결된다.
- 5순위 모집글: 별도 테이블이지만 `posts` 위에 얹는 메타데이터 구조라 후순위가 맞다.

## 지금 당장 연결하지 않을 기능

- 좋아요/공감 반응
- 저장, 내가 쓴 글, 활동 요약
- 관리자용 검토 UI
- 실시간 채팅
- 학교별 다중 보드 세분화

메모:

- 신고/차단 자체는 더 이상 완전 제외가 아니다. 현재는 `reports`, `blocks`, `moderation_events` SQL과 앱 UI/RPC 골격까지 들어갔고, 다음 단계는 운영자용 검토 도구와 실제 운영 절차를 붙이는 일이다.

## 현재 코드에서 실제 연결 직전까지 허용하는 최소 준비

- env 읽기 유틸 작성
- 필수 env 누락 체크
- Supabase client 초기화 파일 자리 확보
- 타입과 mock 데이터 기준점 고정

아직 하지 않는 것:

- 실서비스 키 주입
- 외부 네트워크 호출
- SQL 작성/실행
- auth redirect URI 세팅
- storage 업로드 구현

## 결론

현재 앱 구조는 Supabase 연결 전 단계로서 충분히 정리된 편이다. 핵심 타입과 mock 데이터가 `profiles`, `boards`, `posts`, `comments`, `recruitments`, `verifications` 축으로 맞춰졌고, env와 초기화 파일 위치도 고정했다. 다음 단계는 패키지 설치 여부를 확정한 뒤, `auth -> profiles -> posts -> comments -> recruitments` 순서로 실제 연결을 시작하면 된다.
