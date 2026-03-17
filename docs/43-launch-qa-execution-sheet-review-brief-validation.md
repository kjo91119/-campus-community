# 43. 런치 QA 실행 기록서 교차검증 검증 결과

### 1. 핵심 발견사항

- 중간: [42-launch-qa-execution-sheet.md](/home/junoh/projects/campus-community/docs/42-launch-qa-execution-sheet.md)의 읽기/쓰기 QA와 신고/차단 QA는 [36-launch-readiness-guide.md](/home/junoh/projects/campus-community/docs/36-launch-readiness-guide.md)의 현재 launch 필수 시나리오를 전부 기록하지 못한다. 특히 "학교 보드 same-school 접근 제한 확인", "remote snapshot 성공 후 stale local row 정리", "차단/신고 network 실패 시 로컬 fallback 메시지 확인"이 명시적 체크 행으로 없다. 관련: `docs/42-launch-qa-execution-sheet.md:64-96`, `docs/36-launch-readiness-guide.md:46-61`
- 중간: analytics 기록 항목이 launch 최소 기준 11개에는 맞지만, 현재 실제 계측 범위 전체를 담지는 못한다. 코드와 [10-metrics-and-analytics.md](/home/junoh/projects/campus-community/docs/10-metrics-and-analytics.md)는 `manual_verification_started`, `onboarding_started`, `major_filter_applied`, `school_board_viewed`, `post_opened`, `recruitment_list_viewed`, `recruitment_opened`, `user_restricted`, `user_banned` 등을 이미 기록하는데, 실행 기록서에는 확인 칸이 없다. 관련: `docs/42-launch-qa-execution-sheet.md:133-152`, `docs/10-metrics-and-analytics.md:45-95`, `docs/10-metrics-and-analytics.md:151-157`, `hooks/use-analytics.tsx:11-38`
- 낮음: moderation 섹션은 대체로 잘 맞지만, [40-moderation-smoke-runbook.md](/home/junoh/projects/campus-community/docs/40-moderation-smoke-runbook.md)의 핵심 기대값인 "linked `p_report_id` 자동 `resolved`"를 따로 기록하는 칸이 없고, `unresolved blocked profile`이라는 표현은 launch 문서 묶음의 다른 표현보다 덜 직관적이다. 관련: `docs/42-launch-qa-execution-sheet.md:85-120`, `docs/40-moderation-smoke-runbook.md:79-95`, `docs/40-moderation-smoke-runbook.md:206-223`, `docs/36-launch-readiness-guide.md:59-60`

### 2. 실행 기록 범위 평가

- `대체로 적절하지만 몇 가지 필수 기록 칸이 빠짐`
- 메타데이터, 시딩 실행 여부, baseline 수치, moderation ID 메모, 인증/계정 상태 QA, 이슈 목록, Go / No-Go 섹션은 실무적으로 충분하다. 관련: `docs/42-launch-qa-execution-sheet.md:11-63`, `docs/42-launch-qa-execution-sheet.md:98-170`
- 시딩 섹션도 `09 -> 08` 순서와 baseline 기대값 `32 / 8 / 16`을 적어 두어 [38-launch-seeding-and-qa-guide.md](/home/junoh/projects/campus-community/docs/38-launch-seeding-and-qa-guide.md) 및 SQL 결과와 맞는다. 관련: `docs/42-launch-qa-execution-sheet.md:44-63`, `docs/38-launch-seeding-and-qa-guide.md:47-64`, `supabase/sql/08_seed_launch_qa_snapshot.sql:379-441`, `supabase/sql/09_reset_launch_qa_snapshot.sql:1-8`
- 다만 `36`의 커뮤니티 QA 항목 중 same-school 접근 제한, stale local row 정리, 신고/차단 fallback 메시지 확인이 빠져 있어서 "launch 필수 체크를 한 장에 남긴다"는 목적에는 약간 빈칸이 남는다. 관련: `docs/36-launch-readiness-guide.md:47-61`, `docs/42-launch-qa-execution-sheet.md:64-96`

### 3. 문서 / 코드 / SQL 충돌 여부

- `직접 충돌은 없지만 기록 범위가 현재 구현보다 좁음`
- baseline 기대값과 reset/seed 순서는 현재 SQL과 맞는다. 관련: `docs/42-launch-qa-execution-sheet.md:44-63`, `supabase/sql/08_seed_launch_qa_snapshot.sql:1-14`, `supabase/sql/08_seed_launch_qa_snapshot.sql:379-441`, `supabase/sql/09_reset_launch_qa_snapshot.sql:1-8`
- moderation 단계 구성도 현재 `apply_moderation_action(...)` 경계와 맞는다. `content_restored`, `user_restricted`, `user_banned`, `user_restored`, unrelated `p_report_id` 실패 확인까지 현재 SQL과 정렬돼 있다. 관련: `docs/42-launch-qa-execution-sheet.md:98-120`, `supabase/sql/07_add_moderation_actions.sql:75-219`
- 충돌에 더 가까운 부분은 analytics다. 실행 기록서는 [36-launch-readiness-guide.md](/home/junoh/projects/campus-community/docs/36-launch-readiness-guide.md)의 최소 이벤트 목록만 담았지만, 실제 앱 타입과 계측 호출은 더 넓은 이벤트 집합을 이미 사용한다. 관련: `docs/36-launch-readiness-guide.md:109-128`, `hooks/use-analytics.tsx:11-38`, `app/(auth)/manual-verification.tsx:65`, `app/(auth)/onboarding.tsx:49`, `app/(tabs)/index.tsx:44-57`, `app/(tabs)/school.tsx:33`, `app/(tabs)/posts/[postId].tsx:71`, `app/(tabs)/recruitments/[recruitmentId].tsx:77`

### 4. 운영 실사용성 평가

- `좋지만 약간 더 구체적이어야 함`
- 실행자가 seed 계정 매핑, baseline 수치, moderation 대상 id, 이슈 severity와 담당자를 한 장에 남길 수 있다는 점은 좋다. 실제 운영 회고나 재실행 준비에 필요한 기본 정보는 있다. 관련: `docs/42-launch-qa-execution-sheet.md:35-63`, `docs/42-launch-qa-execution-sheet.md:112-170`
- analytics 확인 방식도 AsyncStorage/debug log 확인 시각과 누락/중복 의심 이벤트 메모 칸이 있어 현재 로컬 buffer 구조와 맞는다. 관련: `docs/42-launch-qa-execution-sheet.md:149-152`, `docs/36-launch-readiness-guide.md:124-127`
- 다만 현재 형태로는 QA 실행자가 "학교 보드 권한 거부를 어떤 계정 조합으로 확인했는지", "fallback 메시지를 봤는지", "linked report가 실제로 resolved 됐는지"를 일관되게 적기 어렵다.
- `unresolved blocked profile`은 내부 검토 문맥에서는 이해되더라도 실제 QA 실행 템플릿에서는 `작성자 요약이 사라진 차단 사용자`처럼 더 바로 읽히는 표현이 낫다.

### 5. 지금 단계에서 구현하지 말아야 할 것

- 실행 기록서를 별도 QA 관리 툴이나 관리자 대시보드로 확장하는 작업
- launch 직전 템플릿에 analytics 전체 taxonomy를 전부 강제로 넣어 과도하게 무겁게 만드는 작업
- baseline QA 기록서에 공개 beta 최종 콘텐츠 밀도 점검표까지 한 문서로 섞는 작업

### 6. 바로 보완할 것

- 4장에 `학교 보드 same-school 접근 제한`, `remote snapshot 후 stale local row 정리`, `fallback write 후 임시 row 정리 문구`, `학교/홈 비활성 보드 CTA 차단`을 더 직접적으로 기록하는 행을 추가
- 5장에 `차단/신고 network 실패 시 fallback 메시지 확인` 행을 추가하고, `unresolved blocked profile` 표현은 `작성자 요약이 사라진 차단 사용자 해제 가능`처럼 문서 묶음 기준 표현으로 바꾸기
- 6장 SQL 메모에 `linked report resolved 확인 결과` 칸을 추가
- 8장은 최소 기준 표는 유지하되, `현재 구현 추가 이벤트` 메모나 보조 표를 붙여 `manual_verification_started`, `onboarding_started`, `major_filter_applied`, `school_board_viewed`, `post_opened`, `recruitment_list_viewed`, `recruitment_opened`, `user_restricted`, `user_banned` 정도는 같이 기록할 수 있게 하기

### 7. 최종 판단

- [42-launch-qa-execution-sheet.md](/home/junoh/projects/campus-community/docs/42-launch-qa-execution-sheet.md)는 뼈대 자체는 맞고, 시딩/ moderation / 인증 / Go / No-Go 기록 템플릿으로 바로 쓸 수 있는 수준이다.
- 다만 현재 launch 필수 QA와 실제 analytics 계측 범위를 완전히 담지는 못해서, 지금 상태를 최종본으로 보기엔 약간 모자라다.
- 큰 구조를 바꿀 필요는 없고, 누락된 QA 행과 보조 analytics 기록 칸만 추가하면 실사용 문서로 충분하다.

검증: 지정 브리프의 문서/코드/SQL 수동 대조
