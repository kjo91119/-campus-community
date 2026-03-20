# Phase 5 UI 현대화 — 교차 검증 작업지시서

> **커밋**: `6a9dbaa` — Modernize UI design system with enhanced visual hierarchy
> **변경 파일**: `constants/theme.ts`, `components/themed-text.tsx`, `components/themed-view.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/recruit.tsx`
> **범위 외 파일**: 이번 커밋에 포함되지 않은 파일(auth 화면, posts/[postId], recruitments/[recruitmentId], write, recruit-write, profile 등)은 검증 대상이 아닙니다.

---

## 1. 디자인 토큰 (constants/theme.ts)

- [ ] `Shadow` 객체에 `sm`, `md`, `lg` 3단계가 모두 존재하는가
- [ ] 각 Shadow 레벨에 `ios`, `android`, `web` 플랫폼별 값이 있는가
- [ ] `CardShadow`가 `Shadow.md`의 deprecated alias로 남아있는가
- [ ] Dark mode `textSecondary`가 `#94A0AC`인가 (기존 `#8B949E`에서 변경)
- [ ] Dark mode `cardBorder`가 `#333D47`인가 (기존 `#30363D`에서 변경)
- [ ] `surfaceTertiary` 토큰이 light/dark 양쪽에 존재하는가

**검증 방법**: `constants/theme.ts` 파일을 읽고 위 항목 확인

---

## 2. ThemedText (components/themed-text.tsx)

- [ ] `sectionHeader` 스타일: `fontSize: 13`, `fontWeight: '700'`, `letterSpacing: 0.2`인가
- [ ] `sectionHeader`에 `textTransform: 'uppercase'`가 **없는가** (삭제 확인)
- [ ] `sectionHeader` 색상이 `textSecondary`인가 (기존 `textTertiary`에서 변경)

**검증 방법**: `components/themed-text.tsx` 파일의 styles 및 color 로직 확인

---

## 3. ThemedView (components/themed-view.tsx)

- [ ] `Platform` import가 **없고** `Shadow`를 `@/constants/theme`에서 import하는가
- [ ] `surface` variant가 light mode에서 `Shadow.sm`을 적용하는가
- [ ] `elevated` variant가 light mode에서 `Shadow.md`를 적용하는가
- [ ] dark mode에서는 shadow가 빈 객체 `{}`인가

**검증 방법**: `components/themed-view.tsx` 파일 전체 확인

---

## 4. 탭바 (_layout.tsx)

- [ ] `tabBarStyle`에 `...Shadow.lg`가 적용되어 있는가
- [ ] `borderTopWidth`가 `StyleSheet.hairlineWidth`인가 (기존 고정값에서 변경)
- [ ] `TabIcon` 컴포넌트가 `focused` 상태일 때 `activeDot` (4x4, Brand.primary)를 렌더링하는가
- [ ] `IconSymbol` size가 `26`인가
- [ ] `TabIcon`의 `name` prop 타입이 `ComponentProps<typeof IconSymbol>['name']`인가 (string이 아닌 정확한 타입)
- [ ] `npx tsc --noEmit` 실행 시 이 파일에서 타입 에러가 없는가

**검증 방법**: `app/(tabs)/_layout.tsx` 파일 확인 + TypeScript 빌드 검증

---

## 5. 홈 화면 (index.tsx)

### 5-1. Quick Actions
- [ ] `QuickActionCard` 컴포넌트가 **삭제**되었는가
- [ ] 3개의 compact pill 버튼(글쓰기, 학교, 모집)이 `quickPill` 스타일로 렌더링되는가
- [ ] 각 pill에 28x28 원형 아이콘(`quickPillIcon`)이 있는가

### 5-2. Board Grid
- [ ] 게시판이 2열 그리드(`boardGrid`: `flexDirection: 'row', flexWrap: 'wrap'`)로 표시되는가
- [ ] 각 `boardCard`에 3px 높이의 `boardAccentBar`가 상단에 있는가

### 5-3. Feed Cards
- [ ] 피드 카드에 `borderLeftWidth: 3`과 `borderLeftColor: accentColor`가 적용되는가
- [ ] 배지(badge)에 `borderWidth: 1`과 `borderColor: accentColor + '40'`이 있는가
- [ ] 배지 배경색 opacity가 `'2A'`인가 (기존 `'1A'`에서 변경)

### 5-4. Section Title
- [ ] `SectionTitle` 컴포넌트가 3px 너비 × 18px 높이의 tint색 accent bar를 렌더링하는가

### 5-5. 기타
- [ ] `ThemedView` import가 **없는가** (사용하지 않으므로 제거됨)
- [ ] `handleSelectMajorFilter`가 `useCallback`으로 감싸져 있는가
- [ ] `renderHeader`의 dependency array에 `handleSelectMajorFilter`가 포함되어 있는가
- [ ] `Shadow`를 `@/constants/theme`에서 import하는가 (`CardShadow` 아님)

**검증 방법**: `app/(tabs)/index.tsx` 파일 확인

---

## 6. 모집 화면 (recruit.tsx)

### 6-1. Quick Actions
- [ ] 2개의 compact pill 버튼(모집 작성, 내 전공)이 `quickPill` 스타일로 렌더링되는가

### 6-2. Recruit Cards
- [ ] 모집 카드에 `borderLeftWidth: 3`과 `borderLeftColor: accentColor`가 적용되는가
- [ ] 배지에 `borderWidth: 1`과 적절한 border color가 있는가

### 6-3. Toggle Chip
- [ ] 마감 포함 토글에 `checkmark-circle` / `ellipse-outline` 아이콘이 사용되는가

### 6-4. 기타
- [ ] `Shadow`를 `@/constants/theme`에서 import하는가

**검증 방법**: `app/(tabs)/recruit.tsx` 파일 확인

---

## 7. 빌드 및 린트

- [ ] `npx tsc --noEmit` — 에러 0개
- [ ] `npm run lint` — 에러 0개 (경고만 허용, 단 변경 파일에서 발생한 경고는 0개여야 함)

**검증 방법**: 두 명령 실행 후 출력 확인

---

## 8. 시각적 일관성 (수동 확인 — 선택사항)

- [ ] 웹(`npx expo start --web`)에서 라이트/다크 모드 전환 시 레이아웃 깨짐 없음
- [ ] 탭바 active dot이 선택된 탭에만 표시됨
- [ ] 홈 화면 게시판 그리드가 2열로 정렬됨
- [ ] 피드 카드 좌측 accent 색상이 전공군 색상과 일치

---

## 검증 결과 요약

| 섹션 | 결과 | 비고 |
|------|------|------|
| 1. 디자인 토큰 | | |
| 2. ThemedText | | |
| 3. ThemedView | | |
| 4. 탭바 | | |
| 5. 홈 화면 | | |
| 6. 모집 화면 | | |
| 7. 빌드/린트 | | |
| 8. 시각적 일관성 | | |
