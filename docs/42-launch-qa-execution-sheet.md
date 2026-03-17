# 42. 런치 QA 실행 기록서

문서 목적: [36-launch-readiness-guide.md](/home/junoh/projects/campus-community/docs/36-launch-readiness-guide.md), [38-launch-seeding-and-qa-guide.md](/home/junoh/projects/campus-community/docs/38-launch-seeding-and-qa-guide.md), [40-moderation-smoke-runbook.md](/home/junoh/projects/campus-community/docs/40-moderation-smoke-runbook.md)를 실제로 실행했을 때 결과를 한 장에 남기는 운영 기록 템플릿이다.

사용 방법:

- launch 직전 QA를 돌릴 때 이 문서를 복제해서 날짜별 실행본으로 쓴다.
- `pass / fail / blocked / skipped`를 명시하고, 실패 항목은 재현 경로와 담당자를 같이 적는다.
- 최종 Go / No-Go 판단은 이 문서 하단에서 남긴다.

## 1. 실행 메타데이터

- 실행 일시:
- 실행 환경:
- 앱 빌드 / 커밋:
- Supabase 프로젝트:
- 실행자:
- 참조 문서:
  - [36-launch-readiness-guide.md](/home/junoh/projects/campus-community/docs/36-launch-readiness-guide.md)
  - [38-launch-seeding-and-qa-guide.md](/home/junoh/projects/campus-community/docs/38-launch-seeding-and-qa-guide.md)
  - [40-moderation-smoke-runbook.md](/home/junoh/projects/campus-community/docs/40-moderation-smoke-runbook.md)

## 2. 사전 체크

| 항목 | 상태 | 메모 |
| --- | --- | --- |
| 필수 migration 적용 완료 |  |  |
| `05_add_profile_summary_rpc.sql` 적용 완료 |  |  |
| `06_add_reports_blocks_rpcs.sql` 적용 완료 |  |  |
| `07_add_moderation_actions.sql` 적용 완료 |  |  |
| boards active 상태 확인 |  |  |
| moderator/admin QA 계정 준비 |  |  |
| verified QA 계정 4개 준비 |  |  |

QA 계정 매핑:

| seed key | 이메일 | profile id | 학교 | 전공군 | 준비 상태 |
| --- | --- | --- | --- | --- | --- |
| `yonsei_pt` |  |  | 연세대학교 | 물리치료 |  |
| `konyang_ot` |  |  | 건양대학교 | 작업치료 |  |
| `daegu_rad` |  |  | 대구보건대학교 | 방사선 |  |
| `eulji_cp` |  |  | 을지대학교 | 임상병리 |  |

## 3. 시딩 실행 기록

| 단계 | 실행 여부 | 실행 시각 | 결과 / 메모 |
| --- | --- | --- | --- |
| `09_reset_launch_qa_snapshot.sql` |  |  |  |
| `08_seed_launch_qa_snapshot.sql` |  |  |  |

baseline 결과:

| 항목 | 기대값 | 실제값 | 상태 |
| --- | --- | --- | --- |
| `seeded_posts` | `32` |  |  |
| `seeded_recruitments` | `8` |  |  |
| `seeded_comments` | `16` |  |  |

메모:

- deterministic baseline 복원이 목적이면 `09 -> 08` 순서를 기본으로 쓴다.
- `08`은 SQL editor에서 파일 전체를 한 번에 실행해야 한다.

## 4. 읽기 / 쓰기 QA

| 시나리오 | 상태 | 메모 |
| --- | --- | --- |
| 통합 홈 비활성화 시 CTA/피드 차단 |  |  |
| 홈 진입 |  |  |
| 전공군 필터 전환 |  |  |
| major board 상세 |  |  |
| 학교 보드 same-school 접근 제한 |  |  |
| school board 상세 |  |  |
| 모집 탭 / 모집 상세 |  |  |
| 일반글 작성 |  |  |
| 학교 보드 글 작성 |  |  |
| 모집글 작성 |  |  |
| 일반 댓글 작성 |  |  |
| 모집 참여 의사 댓글 작성 |  |  |
| remote snapshot 후 stale local row 정리 |  |  |
| fallback write 후 임시 row 정리 문구 |  |  |

추가 확인:

- `알 수 없는 사용자` 대량 노출 여부:
- inactive board 오노출 여부:
- 로컬 fallback 임시 row 정책 문구 확인:

## 5. 신고 / 차단 QA

| 시나리오 | 상태 | 메모 |
| --- | --- | --- |
| 글 신고 |  |  |
| 댓글 신고 |  |  |
| 모집글 신고 |  |  |
| 프로필 신고 |  |  |
| self-report 차단 |  |  |
| 작성자 차단 후 목록/상세 숨김 |  |  |
| 프로필에서 차단 해제 |  |  |
| 작성자 요약이 사라진 차단 사용자 해제 가능 |  |  |
| 신고/차단 network 실패 시 fallback 메시지 확인 |  |  |

## 6. moderation 스모크

| 단계 | 상태 | 메모 |
| --- | --- | --- |
| `report_reviewing` |  |  |
| `content_hidden` for post |  |  |
| linked report 자동 `resolved` 확인 |  |  |
| `content_restored` for post |  |  |
| `content_hidden` for comment |  |  |
| `content_restored` for comment |  |  |
| `user_restricted` |  |  |
| `user_banned` |  |  |
| `user_restored` |  |  |
| unrelated `p_report_id` 실패 확인 |  |  |

SQL 확인 메모:

- 대상 report id:
- 대상 post id:
- 대상 comment id:
- 대상 comment의 parent post id:
- 대상 profile id:
- linked report resolved 확인 결과:
- `moderation_events` 확인 결과:
- comment hide 후 `posts.comment_count` 확인 결과:

## 7. 인증 / 계정 상태 QA

| 시나리오 | 상태 | 메모 |
| --- | --- | --- |
| 지원 학교 이메일 가입 -> 인증 -> 온보딩 |  |  |
| 일반 이메일 -> 학생증 수동 인증 제출 |  |  |
| manual verification 네트워크 실패 후 재수렴 |  |  |
| verified + onboarding 미완료 강제 |  |  |
| restricted 계정 읽기 전용 |  |  |
| banned 계정 커뮤니티 진입 차단 |  |  |

## 8. analytics / 관측 확인

| 이벤트 / 항목 | 상태 | 메모 |
| --- | --- | --- |
| `auth_started` |  |  |
| `school_email_submitted` |  |  |
| `school_email_verified` |  |  |
| `manual_verification_submitted` |  |  |
| `onboarding_completed` |  |  |
| `home_viewed` |  |  |
| `post_created` |  |  |
| `comment_created` |  |  |
| `recruitment_created` |  |  |
| `report_submitted` |  |  |
| `user_blocked` |  |  |

현재 구현 추가 이벤트:

| 이벤트 / 항목 | 상태 | 메모 |
| --- | --- | --- |
| `manual_verification_started` |  |  |
| `onboarding_started` |  |  |
| `manual_verification_approved` |  |  |
| `manual_verification_rejected` |  |  |
| `nickname_set` |  |  |
| `major_group_selected` |  |  |
| `major_filter_applied` |  |  |
| `school_board_viewed` |  |  |
| `post_create_started` |  |  |
| `post_opened` |  |  |
| `recruitment_list_viewed` |  |  |
| `recruitment_opened` |  |  |
| `user_restricted` |  |  |
| `user_banned` |  |  |
| `user_unblocked` |  |  |

확인 방식:

- AsyncStorage / debug log 확인 일시:
- 누락 / 중복 의심 이벤트:

## 9. 이슈 목록

| severity | 영역 | 증상 | 재현 경로 | 담당자 | 상태 |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

## 10. 최종 판단

- Go / No-Go:
- 바로 수정해야 할 상위 3개:
1.
2.
3.

- 다음 실행 예정 시각:
- 비고:
