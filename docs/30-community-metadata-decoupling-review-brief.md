# 30. Community Metadata Decoupling Review Brief

## 목적

`app`, `hooks`, `lib`가 학교/전공 메타데이터를 `data/mock-community.ts`에서 직접 가져오지 않도록 정리한 단계를 교차검증한다. 이번 단계의 목표는 실제 커뮤니티 row seed는 유지하되, 학교/전공 lookup만큼은 `lib/community/metadata.ts` 한 곳으로 모으고, 다음 단계 읽기 경로 확장 시 mock helper 재의존이 다시 생기지 않게 만드는 것이다.

## 이번 단계에서 검증할 것

1. `app`, `hooks`, `lib`의 학교/전공 lookup이 `@/lib/community/metadata`를 통해서만 이뤄지는지 확인
2. `SUPPORTED_UNIVERSITIES`, `getUniversityById`, `getMajorGroupById`, `findUniversityByEmail`가 더 이상 `@/data/mock-community`에서 직접 import되지 않는지 확인
3. `data/mock-community.ts`는 community seed/fallback row 용도로만 남고, 메타데이터 helper export를 갖지 않는지 확인
4. 온보딩, 인증, 홈, 학교, 글쓰기, 상세 화면이 모두 동일 metadata 레이어를 쓰는지 확인
5. 재유입 방지용 회귀 체크가 `app/hooks/lib` 범위까지 실제로 추가되었는지 확인

## 꼭 읽을 파일

- `constants/universities.ts`
- `lib/community/metadata.ts`
- `data/mock-community.ts`
- `app/(auth)/onboarding.tsx`
- `app/(auth)/manual-verification.tsx`
- `app/(auth)/email.tsx`
- `app/(auth)/index.tsx`
- `hooks/use-supabase-auth.tsx`
- `hooks/use-app-session.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/school.tsx`
- `app/(tabs)/profile.tsx`
- `app/(tabs)/write.tsx`
- `app/(tabs)/recruit-write.tsx`
- `app/(tabs)/posts/[postId].tsx`
- `app/(tabs)/recruitments/[recruitmentId].tsx`
- `scripts/check-community-metadata-lookups.mjs`

## 리뷰어에게 요청할 체크 포인트

### 1. 핵심 발견사항

- 치명도 순서대로 정리
- 가능하면 파일/라인 기준으로 적기
- 이번 단계 목표와 직접 충돌하는 항목을 먼저 적기

### 2. metadata source of truth 평가

- 학교/전공 lookup이 실제로 `lib/community/metadata.ts` 기준으로 모였는지
- `SUPPORTED_UNIVERSITIES`와 `MAJOR_GROUPS` 조합이 현재 SQL/RPC 하드코딩과 모순되지 않는지
- `findUniversityByEmail()` 결과가 현재 `04_secure_profiles_and_auth_rpcs.sql`의 지원 학교 목록과 일치하는지
- `data/mock-community.ts`가 metadata를 소비하는 쪽으로만 남고, source 역할을 다시 하지 않는지

### 3. 문서 / 코드 충돌 여부

- `docs/07-supabase-data-model-draft.md`
- `docs/08-auth-verification-moderation.md`
- `docs/11-roadmap.md`
- 이번 30번 문서

위 문서와 현재 코드 사이에 충돌이 있는지 봐 달라.

### 4. 저장 / fallback 경계 평가

- `data/mock-community.ts`가 아직 community row seed 전용으로만 남아 있는지
- 학교/전공 메타데이터는 mock row seed와 별도로 해석되도록 경계가 분리됐는지
- 다음 단계에서 실제 server-first read path를 더 넓혀도 metadata lookup 경계가 다시 흔들리지 않을지

### 5. 지금 단계에서 구현하지 말아야 할 것

- `universities`, `major_groups` 실테이블 추가
- FK 정규화 전면 작업
- 운영자용 학교/전공 메타데이터 관리 UI
- 프로필 공개 범위 확장

### 6. 바로 보완할 것

- 남아 있는 mock metadata import가 있으면 우선순위 높게 적기
- `check-community-metadata-lookups.mjs`의 범위가 너무 약하거나 빠진 디렉터리가 있으면 적기
- `data/mock-community.ts`에 metadata helper export가 다시 생겼는지도 같이 봐 달라
- 다음 단계로 넘어가기 전에 metadata 경계에서 꼭 더 닫아야 할 부분이 있으면 적기

### 7. 최종 판단

- 이 구현 상태로 커뮤니티 읽기 경로 다음 단계에 들어가도 되는가?
- 들어가기 전에 먼저 수정해야 할 상위 3개 항목이 있으면 적기
- 없으면 `필수 수정 없음`이라고 명시해 달라
