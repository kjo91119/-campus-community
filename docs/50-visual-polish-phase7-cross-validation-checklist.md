# Phase 7: 시각 밀도 폴리시 교차 검증 체크리스트

커밋: `4a7bbc1` — Polish visual density: compact welcome, enlarge pills, reduce spacing, icon-only tabs

---

## 섹션 1: 환영 섹션 컴팩트화 (index.tsx)

**변경 사항:**
- 기존 `type="title"` 인사말 → `type="subtitle"` + 닉네임만 표시
- 닉네임 아래 `type="caption"`으로 대학교 · 전공군 정보 표시
- `welcomeRow` flexDirection: 'row'로 닉네임/읽기전용 배지 가로 배치

**검증 방법:**
1. `app/(tabs)/index.tsx`의 `renderHeader` 내부 Welcome 섹션 확인
2. `<ThemedText type="subtitle">`에 `{profile.nickname} 님`만 표시되는지 확인
3. `<ThemedText type="caption">`에 `{currentUniversity?.name} · {currentMajorGroup?.label}` 패턴이 있는지 확인
4. `styles.welcomeRow`에 `flexDirection: 'row'`, `alignItems: 'center'`, `justifyContent: 'space-between'`이 있는지 확인

---

## 섹션 2: 게시판 카드 시각 강화 (index.tsx)

**변경 사항:**
- `boardAccentBar` height: 3 → 4px
- `boardIconCircle` (24x24) 추가 — `book-outline` 아이콘 + 전공군 accent color 배경
- `boardCardHeader` row 레이아웃으로 아이콘 + 제목 배치

**검증 방법:**
1. `styles.boardAccentBar`의 `height`가 `4`인지 확인
2. `styles.boardIconCircle`이 `width: 24, height: 24, borderRadius: 12`인지 확인
3. `renderHeader` 내 boardCard에서 `<Ionicons name="book-outline" size={14} color={mg?.accentColor ?? Brand.primary} />`가 있는지 확인
4. `boardCardHeader` 스타일에 `flexDirection: 'row'`, `alignItems: 'center'`, `gap: Spacing.sm`이 있는지 확인

---

## 섹션 3: 피드 카드 간격 축소 (index.tsx)

**변경 사항:**
- `content` padding: `Spacing.xl` → `Spacing.lg`, gap: `Spacing.lg` → `Spacing.md`
- `feedCard` gap: `Spacing.md` → `Spacing.sm`, padding: `Spacing.lg` → `Spacing.md`, borderRadius: `Radius.lg` → `Radius.md`
- `filterScroll` marginHorizontal/paddingHorizontal: `Spacing.xl` → `Spacing.lg`로 content padding과 일치

**검증 방법:**
1. `styles.content`에서 `padding: Spacing.lg`, `gap: Spacing.md`인지 확인
2. `styles.feedCard`에서 `gap: Spacing.sm`, `padding: Spacing.md`, `borderRadius: Radius.md`인지 확인
3. `styles.filterScroll`에서 `marginHorizontal: -Spacing.lg`, `paddingHorizontal: Spacing.lg`인지 확인

---

## 섹션 4: 퀵 액션 필 확대 (index.tsx, recruit.tsx)

**변경 사항:**
- `quickPill`에 `flex: 1` 추가 (균등 너비)
- `justifyContent: 'center'` 추가 (중앙 정렬)
- `paddingVertical`: `Spacing.sm` → `Spacing.md`
- `borderRadius`: `Radius.pill` → `Radius.md`
- `quickPillIcon` 크기: 28 → 32 (반지름 14 → 16)
- 아이콘 크기: 16 → 18

**검증 방법 (index.tsx):**
1. `styles.quickPill`에 `flex: 1`, `justifyContent: 'center'`, `paddingVertical: Spacing.md`, `borderRadius: Radius.md`가 있는지 확인
2. `styles.quickPillIcon`에 `width: 32, height: 32, borderRadius: 16`이 있는지 확인
3. 모든 quickPill 내 `<Ionicons>` 컴포넌트의 `size`가 `18`인지 확인

**검증 방법 (recruit.tsx):**
1. `styles.quickPill`에 동일한 속성(`flex: 1`, `justifyContent: 'center'`, `paddingVertical: Spacing.md`, `borderRadius: Radius.md`)이 있는지 확인
2. `styles.quickPillIcon`에 `width: 32, height: 32, borderRadius: 16`이 있는지 확인
3. `<Ionicons name="add-circle-outline" size={18}>`과 `<Ionicons name="school-outline" size={18}>`인지 확인

---

## 섹션 5: 모집 탭 간격 축소 (recruit.tsx)

**변경 사항:**
- `content` padding: `Spacing.xl` → `Spacing.lg`, gap: `Spacing.lg` → `Spacing.md`

**검증 방법:**
1. `styles.content`에서 `padding: Spacing.lg`, `gap: Spacing.md`인지 확인

---

## 섹션 6: 탭 바 아이콘 전용 (\_layout.tsx)

**변경 사항:**
- `tabBarShowLabel: false` 설정
- 탭 바 높이 축소: iOS 88 → 78, default 64 → 56
- 패딩 축소: paddingBottom iOS 28 → 24, default 8 → 4, paddingTop 8 → 4
- `tabBarLabelStyle`과 `tabBarIconStyle` 제거

**검증 방법:**
1. `screenOptions.tabBarShowLabel`이 `false`인지 확인
2. `tabBarStyle.height`가 `Platform.select({ ios: 78, default: 56 })`인지 확인
3. `tabBarStyle.paddingBottom`이 `Platform.select({ ios: 24, default: 4 })`인지 확인
4. `tabBarStyle.paddingTop`이 `4`인지 확인
5. `tabBarLabelStyle`과 `tabBarIconStyle` 속성이 없는지 확인

---

## 섹션 7: 빌드 / 린트

**검증 방법:**
1. `npx tsc --noEmit` 실행 → 종료 코드 0 확인
2. `npm run lint` 실행 → 에러 0건 확인

---

## 수정된 파일 목록

| 파일 | 주요 변경 |
|------|----------|
| `app/(tabs)/index.tsx` | 환영 섹션 컴팩트, 게시판 카드 아이콘, 피드 간격 축소, 퀵 필 확대 |
| `app/(tabs)/recruit.tsx` | 퀵 필 확대, content 간격 축소 |
| `app/(tabs)/_layout.tsx` | 아이콘 전용 탭 바, 높이/패딩 축소 |
