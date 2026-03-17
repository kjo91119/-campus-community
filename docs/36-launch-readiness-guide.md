# 36. MVP 런치 준비 설명서

문서 목적: 현재 구현 상태를 기준으로 베타 직전 필요한 QA, 콘텐츠 시딩, 운영/정책 정리를 한 장으로 묶어 실제 런치 준비를 빠뜨리지 않게 만든다.

## 범위

- 인증 / 온보딩 / 커뮤니티 읽기 / 글쓰기 / 모집 / 신고·차단의 MVP 마감 점검
- 초기 빈 피드 방지를 위한 시딩 기준
- 수동 인증 / 신고 / 제재 운영 정책의 런치 전 확인 포인트

## 1. 출시 전 필수 SQL 적용 체크

- `supabase/migrations/20260316120000_create_profiles.sql`
- `supabase/migrations/20260316130000_create_verifications.sql`
- `supabase/migrations/20260316153000_create_community_tables.sql`
- `supabase/migrations/20260316170000_secure_profiles_and_auth_rpcs.sql`
- `supabase/migrations/20260316180000_add_profile_summary_rpc.sql`
- `supabase/migrations/20260316190000_add_reports_blocks_rpcs.sql`
- `supabase/migrations/20260316191000_add_moderation_actions.sql`

메모:

- 로컬 SQL 파일은 `supabase/sql/*.sql`에 같은 내용을 유지한다.
- SQL editor로 수동 적용할 때는 `03_create_verifications.sql -> 04_secure_profiles_and_auth_rpcs.sql -> 05 -> 06 -> 07` 순서를 유지한다.
- 운영 DB에는 migration 또는 SQL editor 기준으로 실제 적용 이력을 남긴다.
- QA baseline 시딩과 reset 절차는 [38-launch-seeding-and-qa-guide.md](/home/junoh/projects/campus-community/docs/38-launch-seeding-and-qa-guide.md)를 따른다.
- launch 직전 moderation 운영 재현 절차는 [40-moderation-smoke-runbook.md](/home/junoh/projects/campus-community/docs/40-moderation-smoke-runbook.md)를 따른다.

## 2. QA 핵심 시나리오

### 인증 / 온보딩

1. 지원 학교 이메일 가입 -> 이메일 인증 -> 온보딩 완료 -> 홈 진입
2. 일반 이메일 가입 -> 학생증 수동 인증 제출 -> pending 확인
3. manual verification 네트워크 실패 -> 로컬 재시도 상태 -> 재제출 -> 서버 pending 수렴
4. verified + onboarding 미완료 -> 온보딩 강제
5. restricted 계정 -> 읽기만 가능, 쓰기 차단 확인
6. banned 계정 -> 커뮤니티 접근 차단 확인

메모:

- 현재 앱 내 로컬 데모 제어는 `active`, `restricted` 위주다.
- banned QA는 `apply_moderation_action('user_banned', 'profile', <target_profile_id>, ...)` 같은 서버 RPC/SQL 경로로 재현하거나, QA용 별도 계정 상태를 DB에서 직접 맞춰 두는 절차를 함께 사용한다.

### 커뮤니티 읽기 / 쓰기

1. 통합 홈 보드 비활성화 시 홈 피드와 글쓰기 CTA가 정확히 닫히는지 확인
2. 학교 보드에서 같은 학교 사용자만 읽기 가능한지 확인
3. 글 작성 -> 댓글 작성 -> 상세/목록 반영 확인
4. 모집글 작성 -> 참여 의사 댓글 -> 모집 상세 반영 확인
5. remote snapshot 성공 시 stale local row가 정리되는지 확인
6. 로컬 fallback 쓰기 후 remote snapshot 성공 시 임시 row가 사라지는 정책 문구 확인

### 신고 / 차단 / 운영 상태

1. 글 / 댓글 / 모집글 / 프로필 신고 가능 여부 확인
2. 내 글 / 내 댓글 / 내 모집글 / 내 프로필 self-report 차단 확인
3. 작성자 차단 후 목록/상세에서 숨김 처리 확인
4. 작성자 요약이 사라진 차단 사용자도 프로필 화면에서 차단 해제 가능한지 확인
5. 차단/신고 network 실패 시 로컬 데모 fallback 메시지가 정확한지 확인

## 3. 시딩 최소 기준

### 목표 기준

- 전공군별 일반글 10개 이상
- 전공군별 질문/정보성 글이 최소 3개 이상 섞일 것
- 모집글 8개 이상
- 학교 보드 예시 글 학교당 2개 이상
- 댓글이 달린 글 비율 30% 이상

### 시딩 원칙

- 실제 beta 전에 `mock-community`만 믿지 말고 Supabase `posts/comments/recruitments`에 seed snapshot을 넣는다.
- server-first snapshot 구조이므로 원격 데이터가 비어 있으면 앱은 다시 빈 피드처럼 느껴질 수 있다.
- `posts/comments/recruitments`뿐 아니라 `boards.is_active` 설정과 작성자 요약 RPC가 참조하는 `profiles` 데이터도 함께 준비돼 있어야 한다.
- 통합 홈, 전공 보드, 학교 보드, 모집 탭이 모두 최소 한 번은 채워져 있어야 하고, 필요한 board row가 실제로 활성화돼 있어야 한다.

### 시딩 체크 포인트

- 4개 전공군 모두 첫 화면에서 최소 3개 이상 글이 보이는지
- 모집 탭 필터 `전체 / 내 전공 / 유형별`에서 빈 화면만 나오지 않는지
- 학교 보드가 있는 학교는 학교 피드도 최소 1회 이상 검증하는지
- 통합 홈 CTA, 전공 보드 진입, 학교 보드 진입이 `boards.is_active` 설정 때문에 닫히지 않는지
- 작성자 닉네임/학교/전공 요약이 `알 수 없는 사용자`로 대량 노출되지 않도록 seed 대상 `profiles`가 준비됐는지

## 4. 운영 / 정책 핸드오프 체크

### 학생증 수동 인증

- 검토 담당자 1명 + 백업 담당자 1명 지정
- 접수 24시간 / 최종 처리 72시간 SLA 재확인
- 반려 사유 문구와 재제출 가이드 확정
- 증빙 삭제 기준 7일 / 예외 시 최대 30일 재확인

### 신고 / 제재

- 긴급 신고와 일반 신고 분류 기준 정리
- `content_hidden`, `user_restricted`, `user_banned`, `user_restored` 운영 기준 확정
- 이의제기 접수 채널과 응답 책임자 확정
- 운영자가 실제로 사용할 SQL/RPC 실행 경로 문서화

### 공개 범위 / 개인정보

- 공개 정보는 닉네임, 전공군, 제한적 학교 정보만 사용
- 실명, 학번, 학생증 파일은 공개 범위에서 제외
- 작성자 요약 RPC와 banned 제외 정책이 실제 운영 의도와 맞는지 재확인

## 5. 분석 / 관측 최소 기준

- `auth_started`
- `school_email_submitted`
- `school_email_verified`
- `manual_verification_submitted`
- `onboarding_completed`
- `home_viewed`
- `post_created`
- `comment_created`
- `recruitment_created`
- `report_submitted`
- `user_blocked`

메모:

- 현재는 로컬 analytics buffer를 쓰므로, beta 전에는 적어도 이벤트가 저장되는지 디버그 로그와 storage 기준으로 확인한다.
- 정식 운영 직전에는 PostHog 등 외부 도구 연결 여부를 결정한다.
- QA baseline을 다시 맞출 때는 `reset -> seed` 순서를 기본으로 삼는다.

## 6. 런치 전 마지막 확인

1. 필수 SQL 적용 완료
2. 인증/온보딩/커뮤니티/신고·차단 QA 통과
3. 초기 시딩 데이터 반영
4. 학생증 수동 인증과 신고 처리 담당자 확정
5. 이의제기 / 개인정보 / 증빙 삭제 정책 문구 확정
6. analytics 최소 이벤트 확인

## 결론

현재 구조는 server-first 읽기와 기본 moderation 골격까지 들어가 있으므로, beta 직전 리스크는 기능 자체보다 운영 준비와 빈 피드 방지에 더 가깝다. 런치 전에는 새로운 큰 기능보다 위 체크리스트를 닫는 편이 안전하다.
