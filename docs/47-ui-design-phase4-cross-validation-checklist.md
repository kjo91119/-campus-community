# UI 디자인 개선 Phase 4 교차검증 지시서

> Phase 3 이후 진행한 Phase 4 (키보드 UX, 글자수 카운터, 폼 로딩 강화, 파괴적 액션 확인 다이얼로그, 댓글 입력 UX, 접근성) 작업의 검증 지시서입니다.
> 검증자는 아래 각 섹션의 주장을 코드와 대조하여 참/거짓을 판정하고, 불일치가 있으면 구체적 파일:라인을 근거로 보고해 주세요.

---

## 검증 대상 커밋

커밋 `3cb70f5` 기준입니다. Phase 4에서 추가된 변경만 검증합니다.

---

## 1. 변경 파일 범위 검증

### Phase 4에서 수정한 파일

| # | 파일 | Phase 4 변경 요약 |
|---|------|-------------------|
| 1 | `app/(auth)/email.tsx` | `keyboardDismissMode`, `keyboardShouldPersistTaps`, `returnKeyType`, `autoComplete`, `onSubmitEditing`, `ActivityIndicator`, `accessibilityLabel/Role` |
| 2 | `app/(tabs)/write.tsx` | `keyboardDismissMode`, `keyboardShouldPersistTaps`, `autoFocus`, `returnKeyType`, `onSubmitEditing`, 글자수 카운터, `ActivityIndicator`, `accessibilityLabel/Role` |
| 3 | `app/(tabs)/recruit-write.tsx` | `keyboardDismissMode`, `keyboardShouldPersistTaps`, `returnKeyType`, `onSubmitEditing`, 글자수 카운터, `ActivityIndicator`, `accessibilityLabel/Role` |
| 4 | `app/(tabs)/posts/[postId].tsx` | `keyboardDismissMode`, `keyboardShouldPersistTaps`, 댓글 글자수 카운터, `ActivityIndicator`, `accessibilityLabel/Role`, `inlineActionButton` 스타일 |
| 5 | `app/(tabs)/recruitments/[recruitmentId].tsx` | `keyboardDismissMode`, `keyboardShouldPersistTaps`, 댓글 글자수 카운터, `ActivityIndicator`, `accessibilityLabel/Role`, `inlineActionButton` 스타일 |
| 6 | `app/(tabs)/profile.tsx` | `Alert.alert` 확인 다이얼로그 (로그아웃, 차단 해제), `accessibilityLabel/Role` |

**검증 방법:**
- 커밋 `3cb70f5`는 Phase 1-4 통합 커밋이므로 `git show --name-only`로 파일 범위를 대조하지 마세요.
- 대신 위 표의 6개 파일 각각을 열어 Phase 4 변경 사항(키보드 UX, 글자수 카운터, ActivityIndicator, Alert.alert, accessibilityLabel)이 실제로 존재하는지 코드 내 기능 존재 여부로 검증하세요.
- 커밋에 포함된 그 외 파일(Phase 1-3 UI 파일, `hooks/use-supabase-auth.tsx`, `supabase/sql/08_seed_launch_qa_snapshot.sql`, `docs/` 등)은 Phase 4 검증 대상에서 제외합니다.

---

## 2. 키보드 UX 검증

**주장:** 폼이 있는 화면 5개에 `keyboardDismissMode="on-drag"`, `keyboardShouldPersistTaps="handled"`를 적용하고, 입력 필드에 `returnKeyType`과 `onSubmitEditing`으로 포커스 이동을 구현했다.

### 2-1. ScrollView 키보드 설정

아래 5개 파일의 메인 `ScrollView`에 두 prop이 있는지 확인:

| # | 파일 | `keyboardDismissMode` | `keyboardShouldPersistTaps` |
|---|------|----------------------|---------------------------|
| 1 | `app/(tabs)/write.tsx` | `"on-drag"` | `"handled"` |
| 2 | `app/(tabs)/recruit-write.tsx` | `"on-drag"` | `"handled"` |
| 3 | `app/(tabs)/posts/[postId].tsx` | `"on-drag"` | `"handled"` |
| 4 | `app/(tabs)/recruitments/[recruitmentId].tsx` | `"on-drag"` | `"handled"` |
| 5 | `app/(auth)/email.tsx` | `"on-drag"` | `"handled"` |

### 2-2. 입력 필드 포커스 체인

| # | 파일 | 필드 | `returnKeyType` | `onSubmitEditing` |
|---|------|------|-----------------|-------------------|
| 1 | `app/(tabs)/write.tsx` | title | `"next"` | `bodyRef.current?.focus()` |
| 2 | `app/(tabs)/write.tsx` | title | `autoFocus` 적용 | — |
| 3 | `app/(tabs)/recruit-write.tsx` | title | `"next"` | `bodyRef.current?.focus()` |
| 4 | `app/(auth)/email.tsx` | email | `"next"` | `passwordRef.current?.focus()` |
| 5 | `app/(auth)/email.tsx` | password | `"done"` | `handleSubmit()` 호출 |

각 파일에서 `useRef<TextInputType>(null)` 선언과 해당 `TextInput`의 `ref` prop이 매칭되는지 확인하세요.

### 2-3. email.tsx 자동완성

- email `TextInput`에 `autoComplete="email"` 확인
- password `TextInput`에 `autoComplete="password"` 확인

---

## 3. 글자수 카운터 검증

**주장:** `write.tsx`와 `recruit-write.tsx`의 제목/본문 입력 아래에 실시간 글자수 카운터를 표시한다.

### 검증 방법

두 파일 각각에서:

1. 제목 `TextInput` 바로 아래에 `<ThemedText type="caption">` 으로 `{title.length}/80` 표시 확인
2. 제목 카운터에 70자 이상일 때 `Brand.primary` 색상, 미만일 때 `colors.textTertiary` 색상 확인
3. 본문 `TextInput` 바로 아래에 `<ThemedText type="caption">` 으로 `{body.length}자` 표시 확인
4. 두 카운터 모두 `alignSelf: 'flex-end'` 스타일 확인

---

## 4. 폼 제출 로딩 상태 강화 검증

**주장:** 3개 화면의 제출 버튼에서 `isSubmitting`/`isLoading` 중 텍스트 대신 `ActivityIndicator`를 표시한다.

### 검증 방법

| # | 파일 | 조건 | 로딩 시 | 기본 시 |
|---|------|------|---------|---------|
| 1 | `app/(tabs)/write.tsx` | `isSubmitting` | `<ActivityIndicator color="#FFFFFF" size="small" />` | `게시글 등록` |
| 2 | `app/(tabs)/recruit-write.tsx` | `isSubmitting` | `<ActivityIndicator color="#FFFFFF" size="small" />` | `모집글 등록` |
| 3 | `app/(auth)/email.tsx` | `isLoading` | `<ActivityIndicator color="#FFFFFF" size="small" />` | 모드별 텍스트 |

각 파일에서:
1. `ActivityIndicator` import 확인
2. 제출 `Pressable` 내부에 삼항 연산자 (`isSubmitting ? ActivityIndicator : ThemedText`) 구조 확인
3. 기존 `'등록 중...'` 텍스트가 제거되었는지 확인

---

## 5. 파괴적 액션 확인 다이얼로그 검증

**주장:** `profile.tsx`에서 로그아웃과 차단 해제에 `Alert.alert` 확인 다이얼로그를 추가했다.

### 검증 방법

`app/(tabs)/profile.tsx`에서:

1. `Alert` import 확인 (`import { Alert, ... } from 'react-native'`)
2. `handleSignOut` 함수가 `Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [...])` 형태인지 확인
   - 취소 버튼: `{ text: '취소', style: 'cancel' }`
   - 확인 버튼: `{ text: '로그아웃', style: 'destructive', onPress: async () => { ... } }`
3. `handleUnblockProfile` 함수가 `Alert.alert('차단 해제', '이 사용자의 차단을 해제하시겠습니까?', [...])` 형태인지 확인
   - 취소 버튼: `{ text: '취소', style: 'cancel' }`
   - 확인 버튼: `{ text: '해제', onPress: async () => { ... } }`
4. `handleSignOut`과 `handleUnblockProfile` 모두 더 이상 `async` 함수가 아닌지 확인 (Alert 내부 onPress만 async)
5. `onPress={handleSignOut}` (void 래퍼 제거) 확인
6. `onPress={() => handleUnblockProfile(entry.profileId)}` (void 래퍼 제거) 확인

---

## 6. 댓글 입력 UX 검증

**주장:** 댓글이 있는 2개 화면에서 글자수 카운터와 `ActivityIndicator`를 추가했다.

### 검증 방법

두 파일 각각에서:

| # | 파일 | 확인 사항 |
|---|------|-----------|
| 1 | `app/(tabs)/posts/[postId].tsx` | 댓글 TextInput 아래 `{commentBody.length}자` 카운터 + `ActivityIndicator` |
| 2 | `app/(tabs)/recruitments/[recruitmentId].tsx` | 댓글 TextInput 아래 `{commentBody.length}자` 카운터 + `ActivityIndicator` |

각 파일에서:
1. `ActivityIndicator` import 확인
2. 댓글 `TextInput` 바로 아래에 `<ThemedText type="caption">` 으로 `{commentBody.length}자` 표시 확인
3. 제출 버튼에 `isSubmitting ? <ActivityIndicator> : <ThemedText>` 삼항 구조 확인
4. `</Pressable>` 닫는 태그가 정상 존재하는지 확인

---

## 7. 접근성(Accessibility) 검증

**주장:** 주요 인터랙티브 요소에 `accessibilityLabel`과 `accessibilityRole="button"`을 추가했다.

### 검증 방법

| # | 파일 | 요소 | `accessibilityLabel` | `accessibilityRole` |
|---|------|------|---------------------|---------------------|
| 1 | `app/(tabs)/write.tsx` | 게시글 등록 버튼 | `"게시글 등록"` | `"button"` |
| 2 | `app/(tabs)/recruit-write.tsx` | 모집글 등록 버튼 | `"모집글 등록"` | `"button"` |
| 3 | `app/(auth)/email.tsx` | 로그인/회원가입 버튼 | `mode === 'sign_in' ? '로그인' : '회원가입'` | `"button"` |
| 4 | `app/(tabs)/profile.tsx` | 로그아웃 버튼 | `"로그아웃"` | `"button"` |
| 5 | `app/(tabs)/profile.tsx` | 차단 해제 버튼 | `"${entry.displayName} 차단 해제"` | `"button"` |
| 6 | `app/(tabs)/posts/[postId].tsx` | 댓글 신고 인라인 버튼 | `"댓글 신고"` | `"button"` |
| 7 | `app/(tabs)/posts/[postId].tsx` | 작성자 차단 인라인 버튼 | 동적 (차단/해제) | `"button"` |
| 8 | `app/(tabs)/recruitments/[recruitmentId].tsx` | 댓글 신고 인라인 버튼 | `"댓글 신고"` | `"button"` |
| 9 | `app/(tabs)/recruitments/[recruitmentId].tsx` | 작성자 차단 인라인 버튼 | 동적 (차단/해제) | `"button"` |

인라인 액션 버튼에 `inlineActionButton` 스타일 (`flexDirection: 'row'`, `alignItems: 'center'`, `gap: 4`, `paddingVertical: 4`, `paddingHorizontal: 2`)이 적용되어 터치 영역이 확보되었는지도 확인하세요.

---

## 8. 기존 기능 불변 검증

Phase 4에서는 UX 보강만 있으므로 아래 핵심 로직이 불변인지 확인:

| # | 검증 항목 | 관련 파일 |
|---|-----------|-----------|
| 1 | `createPost` 호출 인자 및 흐름 불변 | write.tsx |
| 2 | `createRecruitment` 호출 인자 및 흐름 불변 | recruit-write.tsx |
| 3 | `createComment` 호출 인자 및 흐름 불변 | posts/[postId], recruitments/[recruitmentId] |
| 4 | `signInWithEmail` / `signUpWithEmail` 호출 불변 | email.tsx |
| 5 | `reportTarget` / `blockProfile` / `unblockProfile` 호출 불변 | posts/[postId], recruitments/[recruitmentId], profile |
| 6 | `signOut` 호출 로직 불변 (Alert 래퍼 추가만, 내부 로직 동일) | profile.tsx |

---

## 9. 빌드 검증

| # | 항목 | 주장 결과 |
|---|------|-----------|
| 1 | `npx tsc --noEmit` | 통과 (에러 0) |
| 2 | `npm run lint` | 통과 (경고 0) |
| 3 | 실기기/시뮬레이터 렌더링 | 미검증 |

**검증 방법:**
- 1, 2번은 직접 실행하여 에러/경고 여부를 확인하세요.

---

## 10. 보고 양식

```
### 검증 결과 요약

| 섹션 | 결과 | 불일치 수 |
|------|------|-----------|
| 1. 변경 파일 범위 | PASS / FAIL | |
| 2. 키보드 UX | PASS / FAIL | |
| 3. 글자수 카운터 | PASS / FAIL | |
| 4. 폼 로딩 상태 | PASS / FAIL | |
| 5. 파괴적 액션 다이얼로그 | PASS / FAIL | |
| 6. 댓글 입력 UX | PASS / FAIL | |
| 7. 접근성 | PASS / FAIL | |
| 8. 기능 불변 | PASS / FAIL | |
| 9. 빌드 | PASS / FAIL | |

### 불일치 상세 (있을 경우)

- 섹션 X: [파일:라인] 주장과 다른 점 설명
```
