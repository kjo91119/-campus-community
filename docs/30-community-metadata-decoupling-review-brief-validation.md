# 30. Community Metadata Decoupling Review Validation

## 1. 핵심 발견사항

- 중간: `data/mock-community.ts`가 아직 metadata helper를 export하고 있다. `findUniversityByEmail`, `getUniversityById`, `getMajorGroupById`가 남아 있어 row seed 전용 파일로 완전히 닫히지 않았다. 관련: `data/mock-community.ts`
- 낮음: `scripts/check-community-metadata-lookups.mjs`의 범위가 `app`, `hooks`로만 제한돼 있다. 지금 단계 목표가 "metadata 재의존 방지"라면 `lib`까지 함께 보는 편이 더 안전하다. 관련: `scripts/check-community-metadata-lookups.mjs`

## 2. metadata source of truth 평가

- `약간 위험함`
- 현재 앱과 세션/auth 화면의 학교/전공 lookup은 대부분 `lib/community/metadata.ts`로 모였다.
- `SUPPORTED_UNIVERSITIES`와 `findUniversityByEmail()` 결과도 `04_secure_profiles_and_auth_rpcs.sql`의 지원 학교 목록과 일치한다.
- 다만 `data/mock-community.ts`가 여전히 metadata helper API를 제공하고 있고, 회귀 체크도 이를 구조적으로 막는 수준은 아니다.

## 3. 문서 / 코드 충돌 여부

- `충돌 있음`
- 이번 30번 문서는 `data/mock-community.ts`가 metadata source of truth 역할을 하지 않도록 정리됐는지를 보라고 적고 있다.
- 하지만 현재 `data/mock-community.ts`는 여전히 metadata helper export를 포함한다.
- `docs/07-supabase-data-model-draft.md`, `docs/08-auth-verification-moderation.md`, `docs/11-roadmap.md`의 상위 방향과는 큰 충돌이 없다.

## 4. 저장 / fallback 경계 평가

- 현재 단계에서는 `대체로 적절하지만 보완 필요`다.
- `hooks/use-community-data.tsx`는 community row seed만 `mock-community`에서 가져오고, 학교/전공 lookup은 별도 metadata 레이어로 분리돼 있다.
- `hooks/use-app-session.tsx`, `hooks/use-supabase-auth.tsx`, 주요 auth/community 화면도 같은 metadata 레이어를 사용한다.
- 남은 위험은 재유입 가능성이다. `mock-community`에 helper export가 남아 있으니 이후 작업에서 다시 잘못 가져다 쓸 여지가 있다.

## 5. 지금 단계에서 구현하지 말아야 할 것

- `universities`, `major_groups` 실테이블 추가
- FK 정규화 전면 작업
- 운영자용 학교/전공 메타데이터 관리 UI
- 프로필 공개 범위 확장

## 6. 바로 보완할 것

- `data/mock-community.ts`에서 metadata helper export를 제거하거나 deprecated 처리해서 row seed 전용 파일로 정리
- `scripts/check-community-metadata-lookups.mjs`를 `lib`까지 포함하도록 넓히고, `lib/community/metadata.ts`가 `mock-community`를 참조하지 않는지도 검사
- metadata 진입점을 `lib/community/metadata.ts` 하나로 더 명확히 고정

## 7. 최종 판단

- 이 구현 상태로 커뮤니티 읽기 경로 다음 단계에 들어가도 되는가? 조건부로는 가능하다.
- 들어가기 전에 먼저 수정해야 할 상위 3개 항목은 1) `data/mock-community.ts`의 metadata helper export 제거, 2) `check-community-metadata-lookups.mjs` 범위 확장, 3) metadata 진입점 단일화다.

## 검증 메모

- `node scripts/check-community-metadata-lookups.mjs` 통과
- `npm run typecheck` 통과
- `npm run lint` 통과
