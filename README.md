# Campus Community

Expo Router 기반의 보건의료기사 계열 전공 커뮤니티 MVP 실험 앱입니다.

## 실행

```bash
npm install
npm run start
```

플랫폼별 실행:

```bash
npm run android
npm run ios
npm run web
```

## 검증

```bash
npm run lint
npm run typecheck
npm run doctor
```

## 현재 구조

- `app/(auth)/*`: 이메일 인증, 수동 인증 placeholder, 온보딩
- `app/(tabs)/index.tsx`: 통합 홈
- `app/(tabs)/school.tsx`: 학교 게시판 진입
- `app/(tabs)/recruit.tsx`: 모집 탭 골격
- `app/(tabs)/profile.tsx`: 인증 상태와 프로필 확인
- `app/(tabs)/boards/[boardId].tsx`: 게시판 목록
- `app/(tabs)/posts/[postId].tsx`: 게시글 상세와 댓글
- `app/(tabs)/write.tsx`: 게시글 작성

## 메모

- 라우팅은 Expo Router 파일 기반 구조를 사용합니다.
- 인증과 프로필 저장은 Supabase 연결 기준으로 준비되어 있습니다.
- 게시글/댓글은 현재 로컬 저장 계층으로 먼저 구현되어 있습니다.
- 기획/로드맵/교차검증 문서는 [`docs/README.md`](./docs/README.md)에 정리되어 있습니다.
