# 39. 런치 시딩·QA 실행 설명서 교차검증 지시서

이번 검토는 새 기능 구현 리뷰가 아니라 `docs/38-launch-seeding-and-qa-guide.md`와 시드 SQL이 현재 코드/SQL/운영 기준에 맞는지 보는 실행 문서 검증이다. QA baseline 시딩, reset 경계, moderation 스모크 절차, launch guide와의 정합성이 맞는지 확인해라.

## 답변 작성 위치

- 답변은 반드시 [39-launch-seeding-and-qa-review-brief-validation.md](/home/junoh/projects/campus-community/docs/39-launch-seeding-and-qa-review-brief-validation.md)에 작성해라.

## 꼭 읽을 파일

- [38-launch-seeding-and-qa-guide.md](/home/junoh/projects/campus-community/docs/38-launch-seeding-and-qa-guide.md)
- [36-launch-readiness-guide.md](/home/junoh/projects/campus-community/docs/36-launch-readiness-guide.md)
- [16-supabase-connection-guide.md](/home/junoh/projects/campus-community/docs/16-supabase-connection-guide.md)
- [08_seed_launch_qa_snapshot.sql](/home/junoh/projects/campus-community/supabase/sql/08_seed_launch_qa_snapshot.sql)
- [09_reset_launch_qa_snapshot.sql](/home/junoh/projects/campus-community/supabase/sql/09_reset_launch_qa_snapshot.sql)
- [06_add_reports_blocks_rpcs.sql](/home/junoh/projects/campus-community/supabase/sql/06_add_reports_blocks_rpcs.sql)
- [07_add_moderation_actions.sql](/home/junoh/projects/campus-community/supabase/sql/07_add_moderation_actions.sql)
- [20260316153000_create_community_tables.sql](/home/junoh/projects/campus-community/supabase/migrations/20260316153000_create_community_tables.sql)
- [20260316120000_create_profiles.sql](/home/junoh/projects/campus-community/supabase/migrations/20260316120000_create_profiles.sql)
- [20260316130000_create_verifications.sql](/home/junoh/projects/campus-community/supabase/migrations/20260316130000_create_verifications.sql)

## 이번 검토에서 중점적으로 볼 것

1. QA baseline 시딩이 실제 schema 제약과 맞는가
2. seed SQL이 `auth.users`를 직접 만들지 않는 현재 운영 가정과 맞는가
3. `boards.is_active`, 작성자 요약용 `profiles`, 모집/댓글/comment_count` 경계가 문서와 SQL에서 맞는가
4. `09_reset_launch_qa_snapshot.sql`이 baseline 콘텐츠만 안전하게 지우는가
5. moderation 스모크 절차가 `apply_moderation_action(...)`의 실제 제약과 맞는가
6. `36-launch-readiness-guide.md`의 launch 기준과 `38`의 QA baseline 범위가 충돌하지 않는가

## 특히 찾고 싶은 리스크

- 시드 SQL이 실제 FK / check constraint에 막히는 부분
- 시드 SQL이 rerun 시 중복 row나 잘못된 comment_count를 남기는 부분
- reset SQL이 baseline 외 데이터까지 지울 수 있는 위험
- 문서가 "launch final density"와 "QA baseline snapshot"을 혼동하게 만드는 표현
- moderation SQL 예시가 현재 RPC 권한/연계 신고 검증과 어긋나는 부분

## 답변 형식

아래 형식대로만 답변해라.

### 1. 핵심 발견사항

### 2. 시딩 / reset 경계 평가

### 3. 문서 / 코드 / SQL 충돌 여부

### 4. 운영 / QA 실행 가능성 평가

### 5. 지금 단계에서 구현하지 말아야 할 것

### 6. 바로 보완할 것

### 7. 최종 판단
