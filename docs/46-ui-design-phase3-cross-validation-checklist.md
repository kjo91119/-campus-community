# UI 디자인 개선 Phase 3 교차검증 지시서

> Phase 2 이후 진행한 Phase 3 (웹 shadow, Pull-to-Refresh, 인증 화면 스켈레톤, FlatList 가상화, 헤더 스크롤 애니메이션, 다크모드 전환 애니메이션) 작업의 검증 지시서입니다.
> 검증자는 아래 각 섹션의 주장을 코드와 대조하여 참/거짓을 판정하고, 불일치가 있으면 구체적 파일:라인을 근거로 보고해 주세요.

---

## 검증 대상 커밋 범위

워킹 트리 기준입니다. `git diff --name-only`와 `git status`로 변경/추가 파일 목록을 먼저 확인하세요.

---

## 1. 변경 파일 범위 검증

### Phase 3에서 수정한 파일

| # | 파일 | Phase 3 변경 요약 |
|---|------|-------------------|
| 1 | `constants/theme.ts` | `CardShadow` 헬퍼 추가 — `Platform.select`로 iOS/Android/Web shadow 통합 |
| 2 | `hooks/use-community-data.tsx` | `refresh`, `isRefreshing` 추가 — `performHydrate` 콜백 추출, `useCallback`/`useRef` 활용 |
| 3 | `app/_layout.tsx` | 다크모드 전환 시 `Animated.View` opacity fade (0.85→1, 250ms) |
| 4 | `app/(auth)/index.tsx` | `return null` → `SkeletonDetail` 스켈레톤 전환 |
| 5 | `app/(auth)/onboarding.tsx` | `return null` → `SkeletonDetail` 스켈레톤 전환 |
| 6 | `app/(auth)/manual-verification.tsx` | `return null` → `SkeletonDetail` 스켈레톤 전환 |
| 7 | `app/(tabs)/index.tsx` | `ScrollView` → `Animated.FlatList`, `RefreshControl`, 헤더 스크롤 애니메이션, `CardShadow` |
| 8 | `app/(tabs)/recruit.tsx` | `ScrollView` → `Animated.FlatList`, `RefreshControl`, 헤더 스크롤 애니메이션, `CardShadow` |
| 9 | `app/(tabs)/school.tsx` | `RefreshControl` 추가 |
| 10 | `app/(tabs)/boards/[boardId].tsx` | `RefreshControl` 추가 |
| 11 | `app/(tabs)/posts/[postId].tsx` | `RefreshControl` 추가 |
| 12 | `app/(tabs)/recruitments/[recruitmentId].tsx` | `RefreshControl` 추가 |

**검증 방법:**
- `git diff --name-only`와 위 표를 대조하세요.
- 위 표에 없지만 변경된 파일이 있으면 보고하세요 (Phase 1/2 변경 파일, docs/, 및 아래 범위 밖 파일 제외).

**범위 밖 변경 파일 (Phase 3 무관):**
- `hooks/use-supabase-auth.tsx` — Phase 1/2 carry-over 변경
- `supabase/sql/08_seed_launch_qa_snapshot.sql` — QA 시드 데이터 변경 (UI 무관)

---

## 2. 웹 shadow 보완 검증

**주장:** iOS(shadowColor/Offset/Opacity/Radius), Android(elevation), Web(boxShadow) 세 플랫폼 모두에 카드 그림자가 적용된다.

### 검증 방법

1. `constants/theme.ts`에서 `CardShadow` export를 찾아 `Platform.select`로 ios/android/web 세 분기가 있는지 확인:
   - `ios`: `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`
   - `android`: `elevation: 1`
   - `web`: `boxShadow: '0 1px 3px rgba(0,0,0,0.06)'`

2. `app/(tabs)/index.tsx`에서 기존 `Platform.select` 인라인 패턴이 `CardShadow`로 교체되었는지 확인. `Platform` import가 제거되었는지 확인.

3. `app/(tabs)/recruit.tsx`에서 동일하게 `CardShadow`로 교체, `Platform` import 제거 확인.

---

## 3. 인증 화면 스켈레톤 검증

**주장:** 인증 화면 3개에서 `isHydrating` 시 `return null` 대신 `SkeletonDetail`을 표시한다.

### 검증 방법

| # | 파일 | 확인 사항 |
|---|------|-----------|
| 1 | `app/(auth)/index.tsx` | `SkeletonDetail` import + `isHydrating` 분기에서 `ScrollView > SkeletonDetail` 렌더링 |
| 2 | `app/(auth)/onboarding.tsx` | 동일 |
| 3 | `app/(auth)/manual-verification.tsx` | 동일 |

- 각 파일에서 `return null` 패턴이 완전히 제거되었는지 확인하세요.
- `SkeletonDetail`이 `@/components/skeleton`에서 import되는지 확인하세요.

---

## 4. Pull-to-Refresh 검증

**주장:** 커뮤니티 데이터 훅에 `refresh`/`isRefreshing`을 추가하고, 피드/상세 화면 6개에 `RefreshControl`을 적용했다.

### 4-1. 훅 변경 검증

`hooks/use-community-data.tsx`에서:
1. `CommunityContextValue` 타입에 `isRefreshing: boolean`과 `refresh: () => Promise<void>`가 있는지 확인
2. `performHydrate`가 `useCallback`으로 정의되어 있는지 확인
3. `refresh` 함수가 `setIsRefreshing(true)` → `performHydrate()` → `setIsRefreshing(false)` 순서인지 확인
4. Provider value에 `isRefreshing`과 `refresh`가 포함되어 있는지 확인

### 4-2. 화면 적용 검증

아래 6개 파일에서 `RefreshControl` import + `refreshControl` prop이 메인 스크롤 컴포넌트에 있는지 확인:

| # | 파일 | 스크롤 컴포넌트 |
|---|------|----------------|
| 1 | `app/(tabs)/index.tsx` | `Animated.FlatList` |
| 2 | `app/(tabs)/recruit.tsx` | `Animated.FlatList` |
| 3 | `app/(tabs)/school.tsx` | `ScrollView` |
| 4 | `app/(tabs)/boards/[boardId].tsx` | `ScrollView` |
| 5 | `app/(tabs)/posts/[postId].tsx` | `ScrollView` |
| 6 | `app/(tabs)/recruitments/[recruitmentId].tsx` | `ScrollView` |

각 `RefreshControl`에 `refreshing={isRefreshing}`, `onRefresh={refresh}`, `tintColor={colors.textTertiary}` 세 prop이 있는지 확인하세요.

---

## 5. 리스트 가상화 (FlatList 전환) 검증

**주장:** `app/(tabs)/index.tsx`와 `app/(tabs)/recruit.tsx`의 메인 ScrollView를 `Animated.FlatList`로 전환하여 피드/모집 목록을 가상화했다.

### 검증 방법

두 파일 각각에서:
1. 최상위 스크롤이 `Animated.FlatList`인지 확인 (`ScrollView`가 아닌지)
2. `data` prop에 피드 데이터 배열이 전달되는지 확인
3. `renderItem` prop이 `useCallback`으로 정의된 함수인지 확인
4. `ListHeaderComponent`에 헤더/필터/퀵액션 등 비리스트 UI가 포함되어 있는지 확인
5. `ListEmptyComponent`에 `EmptyState`가 있는지 확인
6. `keyExtractor`가 `(item) => item.id`인지 확인
7. 기존 `ScrollView` import가 제거되었는지 확인 (recruit.tsx는 필터용 수평 `ScrollView`가 남아 있어야 함)

---

## 6. 헤더 스크롤 애니메이션 검증

**주장:** 홈(index.tsx)과 모집(recruit.tsx) 화면에서 스크롤 시 헤더(Welcome/모집 타이틀) 섹션이 페이드아웃 + 위로 이동하는 애니메이션이 적용되었다.

### 검증 방법

두 파일 각각에서:
1. `scrollY = useRef(new Animated.Value(0)).current` 선언 확인
2. `headerOpacity` = `scrollY.interpolate({ inputRange: [0, 80], outputRange: [1, 0] })` 확인
3. `headerTranslateY` = `scrollY.interpolate({ inputRange: [0, 80], outputRange: [0, -10] })` 확인
4. 헤더 섹션이 `<Animated.View style={[..., { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }]}>` 으로 래핑되어 있는지 확인
5. `Animated.FlatList`에 `onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}` 확인
6. `scrollEventThrottle={16}` 확인

---

## 7. 다크모드 전환 애니메이션 검증

**주장:** `app/_layout.tsx`에서 `colorScheme` 변경 시 전체 화면이 부드러운 opacity fade (0.85 → 1, 250ms)로 전환된다.

### 검증 방법

`app/_layout.tsx`에서:
1. `fadeAnim = useRef(new Animated.Value(1)).current` 선언 확인
2. `prevSchemeRef = useRef(colorScheme)` 선언 확인
3. `useEffect` 내에서 `prevSchemeRef.current !== colorScheme` 비교 후:
   - `fadeAnim.setValue(0.85)` 호출
   - `Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start()` 호출
4. `Stack`이 `<Animated.View style={[..., { opacity: fadeAnim }]}>` 으로 래핑되어 있는지 확인
5. `Animated.View`에 `flex: 1` 스타일이 있는지 확인 (레이아웃이 깨지지 않도록)

---

## 8. 기존 기능 불변 검증

Phase 3에서는 스타일/구조 변경만 있으므로 아래 핵심 로직이 불변인지 확인:

**의도된 변경 (불변 검증 제외):**
- 인증 화면 3개의 `isHydrating` 분기: `return null` → `SkeletonDetail` 렌더링 (섹션 3에서 검증 완료)

| # | 검증 항목 | 관련 파일 |
|---|-----------|-----------|
| 1 | `isHydrating` 조건 분기 로직 불변 (인증 화면 제외 — 탭 화면만) | 탭 화면 전체 |
| 2 | `createPost`, `createRecruitment`, `createComment` 호출 불변 | write, recruit-write, posts, recruitments |
| 3 | `reportTarget`, `blockProfile`, `unblockProfile` 호출 불변 | posts, recruitments, profile |
| 4 | `signOut` 호출 불변 | profile |
| 5 | 이메일+비밀번호 로그인 로직 불변 | email.tsx |
| 6 | 온보딩 완료 흐름 불변 | onboarding.tsx |
| 7 | 학생증 수동 인증 제출 흐름 불변 | manual-verification.tsx |

---

## 9. 빌드 검증

| # | 항목 | 주장 결과 |
|---|------|-----------|
| 1 | `npx tsc --noEmit` | 통과 (에러 0) |
| 2 | `npm run lint` | 통과 |
| 3 | 실기기/시뮬레이터 렌더링 | 미검증 |

**검증 방법:**
- 1번은 직접 실행하여 에러 여부를 확인하세요.

---

## 10. 보고 양식

```
### 검증 결과 요약

| 섹션 | 결과 | 불일치 수 |
|------|------|-----------|
| 1. 변경 파일 범위 | PASS / FAIL | |
| 2. 웹 shadow | PASS / FAIL | |
| 3. 인증 화면 스켈레톤 | PASS / FAIL | |
| 4. Pull-to-Refresh | PASS / FAIL | |
| 5. FlatList 가상화 | PASS / FAIL | |
| 6. 헤더 스크롤 애니메이션 | PASS / FAIL | |
| 7. 다크모드 전환 애니메이션 | PASS / FAIL | |
| 8. 기능 불변 | PASS / FAIL | |
| 9. 빌드 | PASS / FAIL | |

### 불일치 상세 (있을 경우)

- 섹션 X: [파일:라인] 주장과 다른 점 설명
```
