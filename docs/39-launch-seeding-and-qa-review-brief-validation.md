# 39. 런치 시딩·QA 실행 설명서 교차검증 검증 결과

### 1. 핵심 발견사항

- 중간: `08_seed_launch_qa_snapshot.sql`은 첫 임시 테이블을 `on commit drop`으로 만들지만, 문서와 SQL 어디에도 "한 트랜잭션으로 실행해야 한다"는 설명이 없다. 실행 환경이 statement 단위 auto-commit이면 `temp_launch_seed_profile_map`가 다음 구문 전에 사라질 수 있어 seed 자체가 깨질 위험이 있다. 관련: `supabase/sql/08_seed_launch_qa_snapshot.sql:13-21`, `docs/38-launch-seeding-and-qa-guide.md:48-51`
- 낮음: deterministic baseline 복원은 사실상 `reset -> seed` 순서를 강하게 요구한다. 현재 seed는 seeded post의 `comment_count`를 "해당 post에 존재하는 모든 published comment" 기준으로 다시 계산하므로, reset 없이 재실행하면 baseline 외 QA 댓글이 남은 상태로 UI count가 커질 수 있다. 관련: `supabase/sql/08_seed_launch_qa_snapshot.sql:367-374`, `docs/38-launch-seeding-and-qa-guide.md:48-57`, `docs/38-launch-seeding-and-qa-guide.md:188-192`
- 나머지 큰 방향은 맞다. seed SQL은 `auth.users`를 직접 만들지 않고 실제 verified QA 계정을 재사용하며, `boards.is_active`, 작성자 요약용 `profiles`, `recruitment/comment/comment_count` 경계도 문서와 SQL이 대체로 정렬돼 있다. 관련: `supabase/sql/08_seed_launch_qa_snapshot.sql:8-11`, `supabase/sql/08_seed_launch_qa_snapshot.sql:39-47`, `supabase/sql/08_seed_launch_qa_snapshot.sql:69-92`

### 2. 시딩 / reset 경계 평가

- `대체로 적절하지만 실행 전제 두 개를 더 못 박아야 함`
- seed SQL 자체는 현재 schema 제약과 맞는다. QA 계정이 `verified + active`이고 학교/전공군 매핑이 맞는지 먼저 확인하고, 필수 board가 active가 아니면 예외를 내도록 닫아 두었다. 관련: `supabase/sql/08_seed_launch_qa_snapshot.sql:39-47`, `supabase/sql/08_seed_launch_qa_snapshot.sql:49-94`
- 게시글, 모집글, 댓글 upsert 후 seeded post의 `comment_count`를 다시 계산하므로 기본 baseline 정합성은 맞는다. 관련: `supabase/sql/08_seed_launch_qa_snapshot.sql:180-246`, `supabase/sql/08_seed_launch_qa_snapshot.sql:320-374`
- reset SQL은 deterministic post id만 직접 지우므로 seeded post 바깥의 일반 post까지 건드리지는 않는다. 다만 seeded post에 달린 추가 댓글과 recruitments는 FK cascade로 함께 사라진다. 관련: `supabase/sql/09_reset_launch_qa_snapshot.sql:1-40`, `supabase/migrations/20260316153000_create_community_tables.sql`

### 3. 문서 / 코드 / SQL 충돌 여부

- `작은 충돌 있음`
- `38`의 moderation 메모는 현재 SQL과 맞는다. `apply_moderation_action(...)`는 `p_report_id`를 받을 때 `id + target_type + target_id`가 일치하는 신고만 닫는다. 관련: `docs/38-launch-seeding-and-qa-guide.md:183-186`, `supabase/sql/07_add_moderation_actions.sql:181-195`
- `36`의 launch 최종 밀도와 `38`의 QA baseline 범위도 충돌하지 않는다. `38`이 baseline은 최소 스냅샷이고 공개 beta 최종 밀도는 `36`을 우선한다고 명시한다. 관련: `docs/36-launch-readiness-guide.md:61-69`, `docs/38-launch-seeding-and-qa-guide.md:59-62`, `docs/38-launch-seeding-and-qa-guide.md:194-203`
- 다만 `38`은 seed SQL 실행 전제를 너무 느슨하게 적고 있다. 실제로는 "한 트랜잭션으로 실행"과 "deterministic baseline 복원 시 reset 선행"이 더 강하게 문서화돼야 한다.

### 4. 운영 / QA 실행 가능성 평가

- `실행 가능하지만 운영자 안내를 조금 더 엄격히 써야 함`
- QA baseline 목표, boards/profile smoke 확인, 신고/차단/운영 상태 smoke 순서는 현재 앱과 잘 맞는다. 관련: `docs/38-launch-seeding-and-qa-guide.md:64-119`
- seed SQL이 `auth.users`를 직접 만들지 않는 운영 가정도 `16`과 `36`의 현재 launch 흐름과 충돌하지 않는다. 관련: `docs/16-supabase-connection-guide.md:79-102`, `docs/36-launch-readiness-guide.md:11-26`, `supabase/sql/08_seed_launch_qa_snapshot.sql:8-11`
- 다만 실행자 입장에서는 "transaction-aware SQL editor/session에서 실행", "baseline을 되돌릴 때는 reset 먼저"라는 운영 규칙이 빠져 있어 재현성이 문서만큼 단단하지 않다.

### 5. 지금 단계에서 구현하지 말아야 할 것

- QA baseline 시드를 공개 beta 최종 밀도 시드로 바로 확대하는 작업
- `auth.users`를 SQL로 직접 만들어 seed에 끼워 넣는 작업
- reset SQL을 전체 DB wipe 성격으로 넓히는 작업

### 6. 바로 보완할 것

- `08_seed_launch_qa_snapshot.sql` 상단 주석과 `38` 설명서에 "한 트랜잭션으로 실행하거나 `on commit drop`을 제거한 버전으로 실행"을 명시
- deterministic baseline 복원을 원하면 `09_reset_launch_qa_snapshot.sql` 선행이 사실상 필수라는 점을 `38` 2단계와 6단계에 더 강하게 적기
- `09_reset_launch_qa_snapshot.sql` 설명에 "seeded post의 자식 comments / recruitments도 함께 지워진다"는 점을 명시해 baseline 외 descendant data 삭제를 오해하지 않게 하기

### 7. 최종 판단

- 문서와 seed/reset SQL의 큰 방향은 맞고, launch guide와 QA baseline 범위도 잘 분리돼 있다.
- 다만 seed 실행의 transaction 전제와 reset-first 재시드 규칙이 문서상 충분히 강하지 않아서, 그대로는 운영자가 재현성 있게 반복 실행하기에 살짝 불안하다. 이 두 군데를 먼저 다듬는 편이 안전하다.

검증: 지정 브리프의 문서/SQL/마이그레이션 수동 대조, `npm run check:moderation-wiring`, `npm run typecheck`
