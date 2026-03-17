# 41. Moderation 스모크 실행 설명서 교차검증 지시서

이번 검토는 새 기능 구현 리뷰가 아니라 [40-moderation-smoke-runbook.md](/home/junoh/projects/campus-community/docs/40-moderation-smoke-runbook.md)가 현재 moderation SQL과 런치 운영 가정에 맞는지 보는 실행 문서 검증이다. linked report 제약, comment_count 재계산 확인, 복구 절차, launch guide와의 정합성이 맞는지 확인해라.

## 답변 작성 위치

- 답변은 반드시 [41-moderation-smoke-runbook-review-brief-validation.md](/home/junoh/projects/campus-community/docs/41-moderation-smoke-runbook-review-brief-validation.md)에 작성해라.

## 꼭 읽을 파일

- [40-moderation-smoke-runbook.md](/home/junoh/projects/campus-community/docs/40-moderation-smoke-runbook.md)
- [38-launch-seeding-and-qa-guide.md](/home/junoh/projects/campus-community/docs/38-launch-seeding-and-qa-guide.md)
- [36-launch-readiness-guide.md](/home/junoh/projects/campus-community/docs/36-launch-readiness-guide.md)
- [08-auth-verification-moderation.md](/home/junoh/projects/campus-community/docs/08-auth-verification-moderation.md)
- [06_add_reports_blocks_rpcs.sql](/home/junoh/projects/campus-community/supabase/sql/06_add_reports_blocks_rpcs.sql)
- [07_add_moderation_actions.sql](/home/junoh/projects/campus-community/supabase/sql/07_add_moderation_actions.sql)
- [20260316153000_create_community_tables.sql](/home/junoh/projects/campus-community/supabase/migrations/20260316153000_create_community_tables.sql)

## 이번 검토에서 중점적으로 볼 것

1. runbook의 실행 순서가 실제 `apply_moderation_action(...)` 제약과 맞는가
2. `p_report_id` linked report 조건이 문서에서 정확히 설명되는가
3. comment hide/restore 후 `posts.comment_count` 검증이 충분한가
4. restricted/banned/restored 확인 포인트가 앱 현재 동작과 맞는가
5. `38`과 `36`의 launch/QA 설명과 범위 충돌이 없는가

## 특히 찾고 싶은 리스크

- 무관한 `report_id`를 넣어도 성공할 것처럼 오해하게 만드는 표현
- post/comment/profile별 smoke 단계가 실제 SQL 경계와 어긋나는 부분
- restore 누락 때문에 QA 계정 상태가 꼬일 수 있는 절차
- launch readiness 문서와 moderation runbook 사이의 역할 중복 또는 충돌

## 답변 형식

아래 형식대로만 답변해라.

### 1. 핵심 발견사항

### 2. moderation 스모크 실행 경계 평가

### 3. 문서 / 코드 / SQL 충돌 여부

### 4. 운영 재현성 평가

### 5. 지금 단계에서 구현하지 말아야 할 것

### 6. 바로 보완할 것

### 7. 최종 판단
