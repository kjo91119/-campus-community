# UI 디자인 개선 Phase 2 교차검증 지시서

> 이 문서는 UI 디자인 폴리시 Phase 1 (시맨틱 토큰, 타이포그래피, 컴포넌트 테마) 이후 진행한 Phase 2 (스켈레톤, 아이콘, 빈 상태, 애니메이션, 시각 개선) 작업의 검증 지시서입니다.
> 검증자는 아래 각 섹션의 주장을 코드와 대조하여 참/거짓을 판정하고, 불일치가 있으면 구체적 파일:라인을 근거로 보고해 주세요.

---

## 검증 대상 커밋 범위

워킹 트리 기준입니다. `git diff --name-only`와 `git status`로 변경/추가 파일 목록을 먼저 확인하세요.

---

## 1. 변경 및 추가 파일 범위 검증

### 1-1. 신규 생성 파일 (Phase 2에서 추가)

| # | 파일 | 용도 |
|---|------|------|
| 1 | `components/skeleton.tsx` | SkeletonCard, SkeletonFeed, SkeletonDetail — 펄스 애니메이션 로딩 컴포넌트 |
| 2 | `components/empty-state.tsx` | EmptyState — 아이콘 + 제목 + 설명 + CTA 버튼 구조의 빈 상태 컴포넌트 |
| 3 | `components/fade-in-view.tsx` | FadeInView — opacity + translateY 페이드인 애니메이션 래퍼 |

### 1-2. Phase 1에서 수정, Phase 2에서는 변경 없는 파일

아래 파일은 Phase 1 (시맨틱 토큰, 타이포그래피, 테마 정비)에서 수정되었으며, Phase 2에서는 추가 변경이 없습니다. `git diff --name-only`에 포함되지만 Phase 2 검증 대상은 아닙니다.

| # | 파일 | Phase 1 변경 요약 |
|---|------|-------------------|
| 1 | `app/_layout.tsx` | React Navigation 테마에 새 Colors 매핑 |
| 2 | `app/(tabs)/_layout.tsx` | 탭바 높이·패딩·아이콘 크기·색상 정비 |
| 3 | `app/(auth)/email.tsx` | 세그먼트 토글, 도메인 칩, pressed 피드백 |
| 4 | `app/(auth)/onboarding.tsx` | 체크박스 UI, 인포 행, 선택 카드 |
| 5 | `app/(auth)/manual-verification.tsx` | 인포 그리드, 경고/에러 카드, 체크박스 행 |
| 6 | `components/themed-text.tsx` | caption, label, sectionHeader 타입 추가 |
| 7 | `components/themed-view.tsx` | variant prop (surface, elevated, secondary) |
| 8 | `hooks/use-theme-color.ts` | `useThemeColors()` 훅 추가 |

### 1-3. Phase 2에서 수정한 기존 파일

| # | 파일 | Phase 2 변경 요약 |
|---|------|-------------------|
| 1 | `constants/theme.ts` | ButtonSize (sm/md/lg) 토큰 추가 |
| 2 | `app/(auth)/index.tsx` | 히어로 이모지 → Ionicons `medical-outline`, 아이콘 원 확대 + 외곽 링 |
| 3 | `app/(tabs)/index.tsx` | 스켈레톤 로딩, QuickActionCard 아이콘 Ionicons 교체, EmptyState 적용, 카드 shadow, FadeInView 적용 |
| 4 | `app/(tabs)/recruit.tsx` | 스켈레톤 로딩, 퀵액션 이모지 → Ionicons, EmptyState + CTA, 배지 밀도 축소 (mode 배지 제거), 카드 shadow, FadeInView 적용 |
| 5 | `app/(tabs)/recruit-write.tsx` | 스켈레톤 로딩 |
| 6 | `app/(tabs)/school.tsx` | 스켈레톤 로딩, EmptyState 2건, 섹션 헤더 Ionicons |
| 7 | `app/(tabs)/profile.tsx` | 프로필 카드 분리 (primary/secondary), 섹션 헤더 Ionicons, 차단 해제 버튼 아이콘 |
| 8 | `app/(tabs)/boards/[boardId].tsx` | 스켈레톤 로딩, EmptyState |
| 9 | `app/(tabs)/posts/[postId].tsx` | 스켈레톤 로딩, EmptyState, 댓글 액션 Ionicons (flag/ban), 댓글 깊이 강화 |
| 10 | `app/(tabs)/recruitments/[recruitmentId].tsx` | 스켈레톤 로딩, EmptyState, 댓글 액션 Ionicons |
| 11 | `app/(tabs)/write.tsx` | 스켈레톤 로딩 |

**검증 방법:**
- `git diff --name-only`와 `git status --short`의 출력과 위 세 표 (1-1, 1-2, 1-3)를 대조하세요.
- 위 표들에 없지만 변경된 파일이 있으면, 아래 범위 밖 항목에 해당하는지 확인하세요.

> **UI 폴리시 범위 밖 변경** (이 지시서의 검증 대상이 아닙니다):
> - `hooks/use-supabase-auth.tsx` — 이메일 확인 리디렉션 로직, UI 폴리시와 별개
> - `supabase/sql/08_seed_launch_qa_snapshot.sql` — QA 시드 데이터 갱신, UI 폴리시와 별개
> - `docs/` 디렉토리 — 지시서/체크리스트 문서
>
> 위 파일 외에 범위 밖 변경이 추가로 존재하면 보고하세요.

---

## 2. 불변 파일 무결성 검증

아래 파일/디렉토리는 Phase 1·2 모두에서 **수정하지 않았다**고 주장합니다.

| # | 경로 | 설명 |
|---|------|------|
| 1 | `supabase/` (08_seed 제외) | SQL 스키마, RLS 정책, 마이그레이션 |
| 2 | `types/` | 도메인 타입 정의 |
| 3 | `lib/` | 비즈니스 로직, 메타데이터 유틸 |
| 4 | `hooks/use-community-data.tsx` | 데이터 페치/뮤테이션 로직 |
| 5 | `hooks/use-app-session.tsx` | 세션/프로필 관리 |
| 6 | `hooks/use-analytics.tsx` | 분석 이벤트 |
| 7 | `constants/community.ts` | 커뮤니티 상수 |
| 8 | `constants/auth-policy.ts` | 인증 정책 상수 |

**검증 방법:**
- `git diff --name-only`에 위 경로가 포함되어 있지 않은지 확인하세요.

**라우팅 구조 불변 주장:**
- `app/` 디렉토리 아래 파일 추가/삭제가 없어야 합니다 (수정만 허용).
- `git status`에서 `app/` 하위에 untracked(??), deleted(D), renamed(R) 파일이 없는지 확인하세요.

---

## 3. 스켈레톤 로딩 전수 검증

**주장:** 탭 계열 화면 8개에서 `isHydrating` 시 `return null` 대신 스켈레톤 UI를 표시한다. 인증 화면(`app/(auth)/index.tsx`, `app/(auth)/onboarding.tsx`, `app/(auth)/manual-verification.tsx`)은 Phase 2 대상이 아니며 여전히 `return null`을 사용한다.

### 검증 방법

아래 **탭 화면 8개**에서 `isHydrating` 또는 유사한 로딩 가드를 찾아, `return null` 대신 `SkeletonFeed` 또는 `SkeletonDetail`을 렌더링하는지 확인하세요.

| # | 파일 | 스켈레톤 종류 |
|---|------|-------------|
| 1 | `app/(tabs)/index.tsx` | `SkeletonFeed` |
| 2 | `app/(tabs)/recruit.tsx` | `SkeletonFeed` |
| 3 | `app/(tabs)/school.tsx` | `SkeletonFeed` |
| 4 | `app/(tabs)/boards/[boardId].tsx` | `SkeletonFeed` |
| 5 | `app/(tabs)/posts/[postId].tsx` | `SkeletonDetail` |
| 6 | `app/(tabs)/recruitments/[recruitmentId].tsx` | `SkeletonDetail` |
| 7 | `app/(tabs)/write.tsx` | `SkeletonDetail` |
| 8 | `app/(tabs)/recruit-write.tsx` | `SkeletonDetail` |

**스켈레톤 컴포넌트 자체 검증:**
- `components/skeleton.tsx`에 `SkeletonCard`, `SkeletonFeed`, `SkeletonDetail`이 export되는지 확인하세요.
- 펄스 애니메이션이 `Animated.loop` + `Animated.sequence`로 구현되었는지 확인하세요.

**보고 형식:** 누락이 있으면 `파일 — return null 잔존` 형태로 보고하세요.

---

## 4. 이모지 → Ionicons 교체 검증

**주장:** 화면에 표시되는 이모지 아이콘을 모두 `@expo/vector-icons`의 `Ionicons`로 교체했다.

### 검증 대상

| # | 파일 | 교체 내용 |
|---|------|-----------|
| 1 | `app/(tabs)/index.tsx` | QuickActionCard `icon` prop: `"✏️"` → `"create-outline"`, `"🏫"` → `"school-outline"` |
| 2 | `app/(tabs)/recruit.tsx` | 퀵액션 `"+"` → `Ionicons "add-circle-outline"`, `"🎯"` → `Ionicons "school-outline"` |
| 3 | `app/(auth)/index.tsx` | 히어로 `"+"` → `Ionicons "medical-outline"` |
| 4 | `app/(tabs)/posts/[postId].tsx` | 댓글 액션 텍스트 앞에 `Ionicons "flag-outline"`, `"ban-outline"` 추가 |
| 5 | `app/(tabs)/recruitments/[recruitmentId].tsx` | 댓글 액션 텍스트 앞에 `Ionicons "flag-outline"`, `"ban-outline"` 추가 |
| 6 | `app/(tabs)/profile.tsx` | 섹션 헤더에 `Ionicons` (`person-outline`, `shield-checkmark-outline`, `ban-outline`, `settings-outline`) |
| 7 | `app/(tabs)/school.tsx` | 섹션 헤더에 `Ionicons` (`key-outline`, `grid-outline`, `newspaper-outline`) |

**검증 방법:**
- 위 파일에서 `Ionicons` import가 있는지 확인하세요.
- 이모지 문자(✏️, 🏫, 🎯 등)가 렌더링 코드에 남아 있지 않은지 `grep` 하세요.
- `grep -rn '[✏🏫🎯]' app/` 결과가 비어야 합니다.

---

## 5. EmptyState 컴포넌트 적용 검증

**주장:** 단조로운 텍스트 빈 상태를 `EmptyState` 컴포넌트 (아이콘 + 제목 + 설명 + 선택적 CTA)로 교체했다.

### 검증 대상

| # | 파일 | EmptyState 사용 위치 |
|---|------|---------------------|
| 1 | `app/(tabs)/index.tsx` | 게시판 목록 비어있을 때, 피드 비어있을 때 |
| 2 | `app/(tabs)/recruit.tsx` | 모집 목록 비어있을 때 (CTA: "모집 작성" 버튼 포함) |
| 3 | `app/(tabs)/school.tsx` | 학교 보드 없을 때, 학교 피드 비어있을 때 |
| 4 | `app/(tabs)/boards/[boardId].tsx` | 게시글 목록 비어있을 때 |
| 5 | `app/(tabs)/posts/[postId].tsx` | 댓글 비어있을 때 |
| 6 | `app/(tabs)/recruitments/[recruitmentId].tsx` | 댓글 비어있을 때 |

**EmptyState 컴포넌트 자체 검증:**
- `components/empty-state.tsx`에서 `icon`, `title`, `description`, `actionLabel`, `onAction` props를 받는지 확인하세요.
- 아이콘 원(`iconCircle`) + 제목 + 설명 + 조건부 CTA 버튼 구조인지 확인하세요.

---

## 6. 카드 shadow 적용 검증

**주장:** 홈 피드 보드 카드와 모집 카드에 `Platform.select` shadow를 적용했다.

### 검증 방법

| # | 파일 | shadow 적용 위치 |
|---|------|-----------------|
| 1 | `app/(tabs)/index.tsx` | 전공 게시판 보드 카드 (`boardItem` Pressable의 style) |
| 2 | `app/(tabs)/recruit.tsx` | 모집 카드 (`recruitCard` Pressable의 style) |

- 각 Pressable의 style 함수 내에 `Platform.select({ ios: [{ shadowColor, shadowOffset, shadowOpacity, shadowRadius }], android: [{ elevation }] })` 패턴이 있는지 확인하세요.

---

## 7. 프로필 화면 시각 계층 검증

**주장:** 프로필 화면의 단일 정보 카드를 primary/secondary로 분리하고 섹션 헤더에 아이콘을 추가했다.

### 검증 방법

`app/(tabs)/profile.tsx`에서:
1. 닉네임이 `type="subtitle"` (또는 유사한 큰 타이포)로 표시되는지 확인
2. 인증 상태와 계정 상태가 colored badge로 표시되는지 확인
3. 나머지 세부 정보 (이메일, 학교, 전공군 등)가 별도 카드에 있는지 확인
4. 섹션 헤더 4개에 각각 `Ionicons` 아이콘이 있는지 확인 (`person-outline`, `shield-checkmark-outline`, `ban-outline`, `settings-outline`)

---

## 8. 모집 카드 배지 밀도 검증

**주장:** 모집 카드의 3-badge 행 (유형 + 모드 + 상태)에서 모드 배지를 제거하고 메타 텍스트에 통합했다.

### 검증 방법

`app/(tabs)/recruit.tsx`에서:
1. `badgeRow` 안에 배지가 2개 (유형 + 상태)만 있는지 확인
2. `metaRow` 텍스트에 `RECRUITMENT_MODE_LABELS[recruitment.mode ?? 'online']`이 포함되어 있는지 확인
3. `Brand.secondaryMuted` 배경의 모드 배지 `<View>`가 제거되었는지 확인

---

## 9. FadeInView 애니메이션 검증

**주장:** 홈 피드와 모집 목록의 카드에 staggered fade-in 애니메이션을 적용했다.

### 검증 방법

| # | 파일 | FadeInView 사용 |
|---|------|----------------|
| 1 | `app/(tabs)/index.tsx` | `filteredPosts.map` 내부에서 각 카드를 `<FadeInView delay={index * 50}>` 으로 래핑 |
| 2 | `app/(tabs)/recruit.tsx` | `recruitments.map` 내부에서 각 카드를 `<FadeInView delay={index * 50}>` 으로 래핑 |

**FadeInView 컴포넌트 자체 검증:**
- `components/fade-in-view.tsx`에서 `Animated.Value`로 `opacity`(0→1)와 `translateY`(8→0)를 애니메이션하는지 확인
- `delay` prop이 `Animated.timing`에 전달되는지 확인
- `useNativeDriver: true` 사용 확인

---

## 10. ButtonSize 토큰 검증

**주장:** `constants/theme.ts`에 `ButtonSize` (sm/md/lg) 토큰을 추가했다.

### 검증 방법

`constants/theme.ts`에서 아래 값이 정확한지 대조하세요.

| 크기 | paddingVertical | paddingHorizontal | borderRadius | fontSize |
|------|----------------|-------------------|-------------|----------|
| `sm` | `Spacing.sm` (8) | `Spacing.md` (12) | `Radius.md` (12) | 13 |
| `md` | `Spacing.md` (12) | `Spacing.lg` (16) | `Radius.lg` (16) | 15 |
| `lg` | `Spacing.lg` (16) | `Spacing.xl` (20) | `Radius.lg` (16) | 15 |

---

## 11. 히어로 섹션 검증

**주장:** 인증 랜딩 화면의 히어로 아이콘을 `"+"` 텍스트에서 `Ionicons "medical-outline"`으로 교체하고, 아이콘 원을 확대(72x72) + 외곽 링(88x88)을 추가했다.

### 검증 방법

`app/(auth)/index.tsx`에서:
1. `Ionicons` import 확인
2. `name="medical-outline"` 사용 확인
3. 아이콘 원 크기가 72x72 (borderRadius: 36)인지 확인
4. 외곽 링이 88x88 (borderRadius: 44, borderWidth: 2, borderColor: Brand.primaryMuted)인지 확인

---

## 12. Pressable 인터랙션 전수 검증

**주장:** 모든 Pressable 컴포넌트에 pressed 피드백과 disabled 시각 처리가 있다.

### 검증 방법

Phase 1 체크리스트의 섹션 5와 동일합니다. 아래 파일의 모든 `<Pressable` 태그를 찾아 각각 확인하세요.

**pressed 피드백 기준:**
- `style={({ pressed }) => [...]}` 형태 + `pressed && { opacity: ... }` 또는 `pressed && { backgroundColor: ... }`

**disabled 시각 처리 기준:**
- `disabled` prop이 있으면 `{ opacity: 0.5 }` 또는 `styles.disabledButton` 등 시각 처리

**검증 대상 파일:** `app/(auth)/*.tsx`, `app/(tabs)/*.tsx`, `app/(tabs)/boards/*.tsx`, `app/(tabs)/posts/*.tsx`, `app/(tabs)/recruitments/*.tsx`, `components/empty-state.tsx`

**보고 형식:** 누락이 있으면 `파일:라인 — pressed 누락 / disabled 시각 누락` 형태로 보고하세요.

---

## 13. 빌드 검증

| # | 항목 | 주장 결과 |
|---|------|-----------|
| 1 | `npx tsc --noEmit` | 통과 (에러 0) |
| 2 | `npm run lint` | 통과 |
| 3 | `npx expo start` → 앱 기동 | 미검증 |
| 4 | 실기기/시뮬레이터 렌더링 | 미검증 |

**검증 방법:**
- 1, 2번은 직접 실행하여 에러 여부를 확인하세요.

---

## 14. 기능 회귀 검증

Phase 1 체크리스트의 섹션 4와 동일합니다. Phase 2에서는 스타일 변경만 있으므로 아래 핵심 항목을 재확인하세요.

| # | 검증 항목 | 관련 파일 |
|---|-----------|-----------|
| 1 | 이메일 + 비밀번호 로그인/회원가입 로직 불변 | `app/(auth)/email.tsx` |
| 2 | 온보딩 완료 → 홈 이동 로직 불변 | `app/(auth)/onboarding.tsx` |
| 3 | 게시글 작성 → createPost 호출 불변 | `app/(tabs)/write.tsx` |
| 4 | 모집 작성 → createRecruitment 호출 불변 | `app/(tabs)/recruit-write.tsx` |
| 5 | 댓글 작성 → createComment 호출 불변 | `app/(tabs)/posts/[postId].tsx`, `app/(tabs)/recruitments/[recruitmentId].tsx` |
| 6 | 신고/차단 → reportPost, blockProfile 호출 불변 | `app/(tabs)/posts/[postId].tsx`, `app/(tabs)/recruitments/[recruitmentId].tsx` |
| 7 | 로그아웃 → signOut 호출 불변 | `app/(tabs)/profile.tsx` |

---

## 15. 보고 양식

검증 완료 후 아래 양식으로 결과를 보고해 주세요.

```
### 검증 결과 요약

| 섹션 | 결과 | 불일치 수 |
|------|------|-----------|
| 1. 변경 범위 | PASS / FAIL | |
| 2. 불변 파일 무결성 | PASS / FAIL | |
| 3. 스켈레톤 로딩 | PASS / FAIL | |
| 4. Ionicons 교체 | PASS / FAIL | |
| 5. EmptyState 적용 | PASS / FAIL | |
| 6. 카드 shadow | PASS / FAIL | |
| 7. 프로필 시각 계층 | PASS / FAIL | |
| 8. 모집 배지 밀도 | PASS / FAIL | |
| 9. FadeInView 애니메이션 | PASS / FAIL | |
| 10. ButtonSize 토큰 | PASS / FAIL | |
| 11. 히어로 섹션 | PASS / FAIL | |
| 12. Pressable 인터랙션 | PASS / FAIL | |
| 13. 빌드 | PASS / FAIL | |
| 14. 기능 회귀 | PASS / FAIL | |

### 불일치 상세 (있을 경우)

- 섹션 X: [파일:라인] 주장과 다른 점 설명
```
