# Phase 6: 품질 개선 교차 검증 체크리스트

커밋: `3d6e320` — Add input validation, error handling, search, pagination, and accessibility

---

## 섹션 1: 입력 검증 모듈 (lib/validation.ts)

**변경 사항:**
- `validateEmail(email, requireSchoolDomain?)` — 이메일 형식 + 학교 도메인 체크
- `validatePassword(password)` — 8자 이상 체크
- `validateTitle(title)` — `COMMUNITY_VALIDATION.titleMinLength` 이상
- `validateBody(body)` — `COMMUNITY_VALIDATION.bodyMinLength` 이상
- `validateComment(body)` — `COMMUNITY_VALIDATION.commentMinLength` 이상
- `validateHeadcount(value)` — 숫자 검증 + min/max 범위 체크
- `validatePostInput(title, body)` — 복합 검증, `{ ok, errors }` 반환
- `validateRecruitmentInput(title, body, headcount)` — 복합 검증

**검증 방법:**
1. `lib/validation.ts` 파일이 존재하는지 확인
2. `COMMUNITY_VALIDATION` 상수를 `constants/community.ts`에서 import하는지 확인
3. `SUPPORTED_UNIVERSITIES`를 `lib/community/metadata`에서 import하는지 확인
4. 단일 validator(`validateEmail`, `validatePassword` 등)는 `{ ok: boolean; message?: string }` 반환, 복합 validator(`validatePostInput`, `validateRecruitmentInput`)는 `{ ok: boolean; errors: Record<string, string> }` 반환인지 확인
5. `validateHeadcount`가 `recruitmentHeadcountMin`(2)과 `recruitmentHeadcountMax`(20) 범위를 체크하는지 확인

---

## 섹션 2: 에러 바운더리 (components/error-boundary.tsx)

**변경 사항:**
- React 클래스 컴포넌트 `ErrorBoundary` 생성
- `getDerivedStateFromError`로 에러 캐치
- 폴백 UI: "문제가 발생했습니다" + 에러 메시지 + "다시 시도" 버튼
- `onError` 콜백 prop 지원

**검증 방법:**
1. `components/error-boundary.tsx` 파일이 존재하는지 확인
2. `Component` from `react`를 import하는 클래스 컴포넌트인지 확인
3. `getDerivedStateFromError` 정적 메서드가 있는지 확인
4. "다시 시도" 버튼이 `this.setState({ hasError: false })` 호출하는지 확인
5. `app/_layout.tsx`에서 `<ErrorBoundary>`로 `<Stack>`을 감싸는지 확인

---

## 섹션 3: 토스트 알림 시스템 (components/toast.tsx)

**변경 사항:**
- `ToastProvider` 컨텍스트 + `useToast()` 훅
- `showToast(text, variant)` — variant: success | error | warning | info
- 자동 3초 후 사라짐 + 닫기 버튼
- Animated 슬라이드업 + 페이드 인/아웃
- Brand 팔레트 기반 variant별 색상 (accent bar + border)

**검증 방법:**
1. `components/toast.tsx`에 `ToastProvider`, `useToast` export가 있는지 확인
2. `TOAST_DURATION`이 3000(3초)인지 확인
3. `VARIANT_COLORS`에 success/error/warning/info 4가지가 정의되어 있는지 확인
4. `app/_layout.tsx`에서 `<ToastProvider>`가 `<ErrorBoundary>` 바깥에 있는지 확인
5. 각 화면에서 `useToast()`를 호출하고 `showToast`를 사용하는지 확인:
   - `app/(tabs)/write.tsx` — 성공/실패/네트워크 에러 토스트
   - `app/(tabs)/recruit-write.tsx` — 동일 패턴
   - `app/(auth)/email.tsx` — 검증 경고 토스트 + 로그인 성공 토스트 + 네트워크 에러 토스트 (auth 실패는 기존 `setFeedback`으로 인라인 표시)
   - `app/(tabs)/posts/[postId].tsx` — 댓글 성공/실패 토스트
   - `app/(tabs)/recruitments/[recruitmentId].tsx` — 동일 패턴

---

## 섹션 4: 오프라인 배너 (hooks/use-network-status.ts + components/offline-banner.tsx)

**변경 사항:**
- `useNetworkStatus()` 훅: web에서 `navigator.onLine` + online/offline 이벤트 리스닝
- `OfflineBanner` 컴포넌트: 오프라인 시 "오프라인 상태입니다" 경고 배너 표시
- `accessibilityLiveRegion="polite"` + `accessibilityRole="alert"` 설정

**검증 방법:**
1. `hooks/use-network-status.ts`가 존재하고 `useNetworkStatus` 함수를 export하는지 확인
2. `Platform.OS !== 'web'`일 때 항상 `isOnline: true`를 반환하는지 확인
3. `components/offline-banner.tsx`가 `useNetworkStatus`를 사용하는지 확인
4. `isOnline === true`일 때 `null`을 반환하는지 확인
5. `app/_layout.tsx`에 `<OfflineBanner />`가 `<Stack>` 위에 배치되어 있는지 확인

---

## 섹션 5: 검색 기능 (components/search-bar.tsx)

**변경 사항:**
- `SearchBar` 컴포넌트: 검색 아이콘 + 텍스트 입력 + 지우기 버튼
- 300ms 디바운스 (`debounceMs` prop으로 커스텀 가능)
- `onSearch(query)` 콜백으로 부모에 전달

**검증 방법:**
1. `components/search-bar.tsx` 파일이 존재하고 `SearchBar`를 export하는지 확인
2. `useEffect` 내에서 `setTimeout` 디바운스를 구현하는지 확인
3. `app/(tabs)/index.tsx`에서 `<SearchBar placeholder="게시글 검색" onSearch={handleSearch} />`가 renderHeader 내부에 있는지 확인
4. `app/(tabs)/recruit.tsx`에서 `<SearchBar placeholder="모집글 검색" onSearch={handleSearch} />`가 renderHeader 내부에 있는지 확인
5. 검색 시 `filteredPosts`/`recruitments` 배열이 title/summary 기반으로 필터링되는지 확인

---

## 섹션 6: 페이지네이션 (hooks/use-paginated-list.ts)

**변경 사항:**
- `usePaginatedList<T>(data, pageSize=20)` 훅
- `visibleData`, `hasMore`, `loadMore`, `reset` 반환
- 클라이언트사이드 슬라이싱 (전체 데이터에서 `pageSize`씩 추가)

**검증 방법:**
1. `hooks/use-paginated-list.ts`가 존재하고 `usePaginatedList`를 export하는지 확인
2. 기본 `pageSize`가 20인지 확인
3. `app/(tabs)/index.tsx`에서:
   - `usePaginatedList(filteredPosts)` 호출이 있는지 확인
   - `Animated.FlatList`의 `data`가 `paginatedPosts`인지 확인
   - `onEndReached={loadMore}` + `onEndReachedThreshold={0.5}` 설정이 있는지 확인
   - `ListFooterComponent`에 `hasMore` 기반 `ActivityIndicator`가 있는지 확인
4. `app/(tabs)/recruit.tsx`에서 동일 패턴이 적용되었는지 확인

---

## 섹션 7: 입력 검증 적용 (write.tsx, recruit-write.tsx, email.tsx)

**변경 사항:**
- 실시간 인라인 검증 에러 표시 (제목/본문 아래 빨간색 텍스트)
- `canSubmit` 플래그: 검증 통과 + 미제출 중일 때만 제출 가능
- try-catch로 비동기 에러 핸들링
- write.tsx / recruit-write.tsx: 성공/실패/네트워크 에러 시 토스트 표시
- email.tsx: 검증 경고 + 로그인 성공 + 네트워크 에러 시 토스트 표시 (auth 실패 메시지는 기존 `setFeedback` 인라인 유지)

**검증 방법:**
1. `app/(tabs)/write.tsx`:
   - `validatePostInput` import가 있는지 확인
   - `useMemo(() => validatePostInput(title, body), [title, body])` 호출이 있는지 확인
   - `validation.errors.title` / `validation.errors.body` 인라인 에러가 표시되는지 확인
   - 제출 버튼이 `disabled={!canSubmit}`인지 확인
   - `handleSubmit`이 try-catch로 감싸져 있는지 확인
2. `app/(tabs)/recruit-write.tsx`:
   - `validateRecruitmentInput` import가 있는지 확인
   - `validation.errors.headcount` 인라인 에러가 표시되는지 확인
   - 동일한 try-catch + toast 패턴 확인
3. `app/(auth)/email.tsx`:
   - `validateEmail` + `validatePassword` import가 있는지 확인
   - 인라인 에러가 이메일/비밀번호 아래에 표시되는지 확인
   - `canSubmit`이 두 검증 모두 통과해야 true인지 확인
   - auth 실패 시 `setFeedback(result.message)`로 인라인 피드백이 유지되는지 확인 (토스트가 아님)

---

## 섹션 8: 댓글 에러 핸들링 (posts/[postId].tsx, recruitments/[recruitmentId].tsx)

**변경 사항:**
- `validateComment` 검증 적용
- `canSubmitComment` 플래그로 제출 버튼 제어
- try-catch + toast 에러 피드백
- 성공 시 "댓글이 등록되었습니다" / "참여 의사가 등록되었습니다" 토스트

**검증 방법:**
1. `app/(tabs)/posts/[postId].tsx`에서:
   - `validateComment` import가 있는지 확인
   - `canSubmitComment` 변수가 `commentAccess.ok && !isSubmitting && commentValidation.ok`인지 확인
   - 제출 버튼이 `disabled={!canSubmitComment}`인지 확인
2. `app/(tabs)/recruitments/[recruitmentId].tsx`에서 동일 패턴 확인

---

## 섹션 9: 접근성 개선

**변경 사항:**
- `ThemedText`: title/subtitle/sectionHeader 타입에 `accessibilityRole="header"` 자동 설정
- FilterChip (index.tsx, recruit.tsx): `accessibilityLabel`, `accessibilityRole="button"`, `accessibilityState={{ selected }}`
- 피드 카드 (index.tsx): `accessibilityLabel={\`${post.title}, 댓글 ${post.commentCount}개\`}`
- 모집 카드 (recruit.tsx): `accessibilityLabel={\`${recruitment.title}, ${status}\`}`
- 폼 입력: write.tsx, recruit-write.tsx, email.tsx, posts/[postId].tsx, recruitments/[recruitmentId].tsx의 모든 TextInput에 `accessibilityLabel` 추가

**검증 방법:**
1. `components/themed-text.tsx`에서 `isHeading` 변수가 title/subtitle/sectionHeader를 체크하는지 확인
2. `accessibilityRole={isHeading ? 'header' : rest.accessibilityRole}`가 `<Text>`에 전달되는지 확인
3. `index.tsx` FilterChip에 `accessibilityState={{ selected }}`가 있는지 확인
4. `recruit.tsx` FilterChip에 동일하게 적용되었는지 확인
5. 다음 TextInput들에 `accessibilityLabel`이 있는지 확인:
   - write.tsx: "게시글 제목", "게시글 본문"
   - recruit-write.tsx: "모집 인원", "모집글 제목", "모집글 본문"
   - email.tsx: "이메일 주소", "비밀번호"
   - posts/[postId].tsx: "댓글 입력"
   - recruitments/[recruitmentId].tsx: "참여 의사 댓글 입력"

---

## 섹션 10: 루트 레이아웃 통합 (app/_layout.tsx)

**변경 사항:**
- `ErrorBoundary`, `OfflineBanner`, `ToastProvider` import 추가
- Provider 스택 순서: ThemeProvider → AnalyticsProvider → SupabaseAuthProvider → AppSessionProvider → CommunityProvider → **ToastProvider** → **ErrorBoundary** → OfflineBanner + Stack
- `ToastProvider`가 `ErrorBoundary` 바깥에 위치 (에러 바운더리 발동 시에도 토스트 렌더링 가능)

**검증 방법:**
1. `app/_layout.tsx`에서 3개의 새 import가 있는지 확인
2. `<ToastProvider>`가 `<ErrorBoundary>`를 감싸는지 확인 (반대가 아닌지)
3. `<OfflineBanner />`가 `<Animated.View>` 위에 있는지 확인
4. 기존 provider 순서가 유지되는지 확인

---

## 섹션 11: 빌드 / 린트

**검증 방법:**
1. `npx tsc --noEmit` 실행 → 종료 코드 0 확인
2. `npm run lint` 실행 → 에러 0건 확인

---

## 새로 생성된 파일 목록

| 파일 | 역할 |
|------|------|
| `lib/validation.ts` | 클라이언트 입력 검증 함수 모듈 |
| `components/error-boundary.tsx` | React 에러 바운더리 |
| `components/toast.tsx` | 토스트 알림 시스템 (Provider + Hook + UI) |
| `components/offline-banner.tsx` | 오프라인 상태 배너 |
| `components/search-bar.tsx` | 디바운스 검색 바 |
| `hooks/use-network-status.ts` | 네트워크 상태 감지 훅 |
| `hooks/use-paginated-list.ts` | 클라이언트 페이지네이션 훅 |

## 수정된 파일 목록

| 파일 | 주요 변경 |
|------|----------|
| `app/_layout.tsx` | ErrorBoundary + ToastProvider + OfflineBanner 통합 |
| `app/(auth)/email.tsx` | 이메일/비밀번호 검증 + try-catch + toast + 접근성 |
| `app/(tabs)/write.tsx` | 게시글 검증 + try-catch + toast + 접근성 |
| `app/(tabs)/recruit-write.tsx` | 모집글 검증 + try-catch + toast + 접근성 |
| `app/(tabs)/posts/[postId].tsx` | 댓글 검증 + try-catch + toast + 접근성 |
| `app/(tabs)/recruitments/[recruitmentId].tsx` | 댓글 검증 + try-catch + toast + 접근성 |
| `app/(tabs)/index.tsx` | 검색 + 페이지네이션 + 접근성 |
| `app/(tabs)/recruit.tsx` | 검색 + 페이지네이션 + 접근성 |
| `components/themed-text.tsx` | heading role 자동 설정 |

---

## 수동 검증 필요 항목

- [ ] 웹에서 오프라인 모드 전환 시 배너가 나타나는지 확인
- [ ] 토스트가 하단에 3초간 표시 후 사라지는지 확인
- [ ] 검색 입력 시 디바운스 후 목록이 필터링되는지 확인
- [ ] 스크롤 끝까지 내릴 때 다음 20개가 로드되는지 확인
- [ ] 제목 4자 미만 입력 시 빨간색 인라인 에러가 표시되는지 확인
- [ ] 제출 버튼이 검증 미통과 시 비활성화 상태인지 확인
