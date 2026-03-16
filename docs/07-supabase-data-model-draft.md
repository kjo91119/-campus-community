# 07. Supabase 데이터 모델 초안

문서 목적: Supabase(Postgres) 기준으로 MVP 구현에 필요한 핵심 테이블, 관계, 권한 방향을 정리해 이후 백엔드 설계를 쉽게 만든다.

## 가정 (Assumptions)

- 인증의 실제 계정 엔티티는 `auth.users`를 사용한다.
- 앱 레벨 사용자 정보는 `profiles` 중심으로 관리한다.
- 초기 런칭은 4개 전공군 동시 운영이며, 통합 홈과 학교 보드를 모두 지원해야 한다.

## 설계 원칙

1. 학교와 전공군을 모두 모델링하되, 노출 중심 축은 전공군으로 둔다.
2. 게시판 스코프를 데이터 구조에서 명확히 구분한다.
3. 통합 홈 조회가 쉬워야 한다.
4. RLS로 학교 제한 보드와 인증 상태를 제어할 수 있어야 한다.

## 핵심 엔터티 개요

- `auth.users`: Supabase 인증 계정
- `profiles`: 앱 사용자 기본 정보
- `universities`: 학교 마스터
- `major_groups`: 전공군 마스터
- `majors`: 세부 전공 또는 학과명 매핑
- `verifications`: 인증 이력과 상태
- `boards`: 게시판 정의
- `posts`: 게시글
- `comments`: 댓글/대댓글
- `reactions`: 좋아요 또는 공감 반응
- `reports`: 신고
- `blocks`: 차단
- `recruitments`: 모집글 메타데이터
- `notifications`: 인앱 알림

## 테이블 초안

### 1. profiles

역할:

- 앱 내 공개 프로필과 상태를 관리한다.

주요 컬럼 예시:

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | `auth.users.id` 참조 |
| nickname | text | 공개 닉네임 |
| role | text | `user`, `moderator`, `admin` |
| status | text | `active`, `restricted`, `banned` |
| primary_university_id | uuid nullable | 인증된 학교 |
| primary_major_group_id | uuid nullable | 주 전공군 |
| major_label | text nullable | 사용자 입력 세부 학과명 |
| verification_status | text | `unverified`, `pending`, `verified`, `rejected` |
| onboarding_completed_at | timestamptz nullable | 온보딩 완료 시점 |
| created_at | timestamptz | 생성일 |

메모:

- 장기적으로는 `primary_university_id`, `primary_major_group_id`를 각 마스터 테이블을 참조하는 uuid FK로 두는 방향을 권장한다.
- 다만 현재 Phase 1 앱 구현과 초기 `profiles` 마이그레이션은 앱 내부 string ID 체계에 맞춰 두 컬럼을 `text`로 두고 있으며, 이후 `universities` / `major_groups` 실테이블 도입 시 FK 정규화가 필요하다.

### 2. universities

역할:

- 학교명, 도메인, 지역 정보 관리

주요 컬럼 예시:

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | 학교 ID |
| name_ko | text | 학교명 |
| email_domain | text nullable | 학교 이메일 도메인 |
| region | text nullable | 지역 |
| is_active | boolean | 사용 가능 여부 |

### 3. major_groups

역할:

- 앱의 핵심 커뮤니티 축인 전공군 정의

주요 컬럼 예시:

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | 전공군 ID |
| slug | text unique | `physical-therapy` 등 |
| name_ko | text | 전공군명 |
| sort_order | int | 노출 순서 |
| is_launch_group | boolean | 초기 런칭 대상 여부 |

### 4. majors

역할:

- 세부 전공 또는 학과명을 전공군에 매핑

주요 컬럼 예시:

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | 세부 전공 ID |
| major_group_id | uuid FK | 소속 전공군 |
| university_id | uuid nullable | 특정 학교 전용 세부 학과면 연결 |
| name_ko | text | 학과명 |
| is_active | boolean | 활성 여부 |

### 5. verifications

역할:

- 인증 수단과 상태 이력 저장

주요 컬럼 예시:

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | 인증 요청 ID |
| profile_id | uuid FK | 대상 사용자 |
| method | text | `email`, `student_id_manual` |
| university_id | uuid nullable | 인증 학교 |
| status | text | `pending`, `approved`, `rejected` |
| submitted_at | timestamptz | 제출 시각 |
| reviewed_at | timestamptz nullable | 검토 시각 |
| reviewer_profile_id | uuid nullable | 검토자 |
| evidence_url | text nullable | 수동 인증 자료 경로 |
| rejection_reason | text nullable | 반려 사유 |

### 6. boards

역할:

- 게시판 스코프를 정의

주요 컬럼 예시:

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | 보드 ID |
| scope_type | text | `network`, `major_group`, `university` |
| title | text | 보드명 |
| slug | text | URL 키 |
| major_group_id | uuid nullable | 전공군 보드면 연결 |
| university_id | uuid nullable | 학교 보드면 연결 |
| visibility | text | `verified_all`, `verified_same_university` |
| post_type_default | text nullable | 기본 글 유형 |
| is_active | boolean | 운영 여부 |

설명:

- `network`: 통합 홈용 전역 보드
- `major_group`: 물리치료 등 전공군 보드
- `university`: 학교 인증 사용자 전용 보드

### 7. posts

역할:

- 글 본문 저장

주요 컬럼 예시:

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | 글 ID |
| board_id | uuid FK | 소속 보드 |
| author_profile_id | uuid FK | 작성자 |
| title | text | 제목 |
| body | text | 본문 |
| category | text | `practice`, `exam`, `career`, `qna`, `free`, `recruitment` |
| post_type | text | `general`, `question`, `recruitment` |
| major_group_id | uuid nullable | 필터 성능용 스냅샷 |
| university_id | uuid nullable | 학교 보드면 스냅샷 |
| is_anonymous | boolean | 공개 노출 익명 여부 |
| status | text | `published`, `hidden`, `deleted` |
| comment_count | int | 댓글 수 캐시 |
| created_at | timestamptz | 생성일 |

### 8. comments

역할:

- 댓글과 대댓글 저장

주요 컬럼 예시:

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | 댓글 ID |
| post_id | uuid FK | 대상 글 |
| author_profile_id | uuid FK | 작성자 |
| parent_comment_id | uuid nullable | 대댓글인 경우 부모 댓글 |
| depth | int | 1 또는 2 |
| body | text | 내용 |
| comment_kind | text | `general`, `recruitment_intent` |
| status | text | `published`, `hidden`, `deleted` |
| created_at | timestamptz | 생성일 |

### 9. reactions

역할:

- 좋아요, 공감 등 가벼운 반응 저장

메모:

- MVP에서는 생략 가능하지만, 스키마는 초안 수준으로 미리 고려한다.

### 10. reports

역할:

- 글, 댓글, 모집글 신고 접수

주요 컬럼 예시:

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | 신고 ID |
| reporter_profile_id | uuid FK | 신고자 |
| target_type | text | `post`, `comment`, `profile` |
| target_id | uuid | 대상 ID |
| reason_code | text | 신고 사유 |
| detail | text nullable | 상세 사유 |
| status | text | `open`, `reviewing`, `resolved`, `dismissed` |
| created_at | timestamptz | 생성일 |

### 11. blocks

역할:

- 사용자의 차단 관계 관리

주요 컬럼 예시:

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | 차단 ID |
| blocker_profile_id | uuid FK | 차단한 사용자 |
| blocked_profile_id | uuid FK | 차단당한 사용자 |
| created_at | timestamptz | 생성일 |

### 12. recruitments

역할:

- 모집글의 구조화된 메타데이터 저장

주요 컬럼 예시:

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | 모집 ID |
| post_id | uuid FK | 연결된 게시글 |
| recruitment_type | text | `study`, `assignment`, `contest`, `project` |
| headcount | int nullable | 모집 인원 |
| mode | text nullable | `online`, `offline`, `hybrid` |
| status | text | `open`, `closed`, `completed` |
| preferred_major_group_id | uuid nullable | 선호 전공군 |
| deadline_at | timestamptz nullable | 마감일 |

MVP 메모:

- 모집 참여 의사는 별도 `recruitment_applications` 테이블 없이 `comments`로 처리한다.
- 모집 상세 화면의 CTA는 "참여 의사 댓글 남기기"로 통일한다.
- 별도 지원 테이블은 모집량과 운영 필요가 커진 뒤 V1 이후 검토한다.

### 13. notifications

역할:

- 인앱 알림 저장

주요 컬럼 예시:

| 컬럼 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid PK | 알림 ID |
| recipient_profile_id | uuid FK | 수신자 |
| type | text | 댓글, 답글, 모집 참여 등 |
| entity_type | text | 대상 종류 |
| entity_id | uuid | 대상 ID |
| is_read | boolean | 읽음 여부 |
| created_at | timestamptz | 생성일 |

## 관계 요약

- `profiles.primary_university_id -> universities.id`
- `profiles.primary_major_group_id -> major_groups.id`
- `majors.major_group_id -> major_groups.id`
- `verifications.profile_id -> profiles.id`
- `boards.major_group_id -> major_groups.id`
- `boards.university_id -> universities.id`
- `posts.board_id -> boards.id`
- `posts.author_profile_id -> profiles.id`
- `comments.post_id -> posts.id`
- `comments.parent_comment_id -> comments.id`
- `recruitments.post_id -> posts.id`

## 통합 홈, 전공 보드, 학교 보드 구분 방식

### 통합 홈

- `boards.scope_type = network`
- 또는 `network` + `major_group` 글을 묶어 조회하는 피드 쿼리

### 전공군 피드

- `posts.major_group_id = 선택된 전공군`
- 또는 `boards.scope_type = major_group`

### 학교 보드

- `boards.scope_type = university`
- `boards.university_id = viewer.primary_university_id`

이 구조를 쓰면 같은 `posts` 테이블을 유지한 채 피드, 전공 필터, 학교 제한을 모두 처리할 수 있다.

## RLS 관점의 high-level 권한 모델

### 읽기

- `unverified`: 소개, 정책, 인증 화면만 접근 허용
- `pending`: 인증 상태 확인, 재제출, 고객지원 화면만 접근 허용
- `verified`: 통합 홈, 전공군 필터 피드, 모집, 글 상세 읽기 허용
- `verified` + 학교 일치: 학교 보드 읽기 허용
- `restricted`: 네트워크 읽기만 제한적으로 허용하고 쓰기는 차단
- `banned`: 앱 콘텐츠 접근 차단, 이의제기 안내만 노출

### 쓰기

- 글/댓글/모집 작성은 `verified` 사용자만 허용
- 학교 보드 작성은 `verified` 이면서 해당 `university_id` 일치 조건 필요
- 모집 참여는 별도 신청이 아니라 모집글 댓글 작성으로 처리
- `pending`, `rejected`, `restricted`, `banned`는 새 콘텐츠 작성 불가

### 민감 데이터

- 수동 인증 증빙 자료는 일반 사용자 접근 금지
- 운영자 또는 서비스 역할만 접근 가능

### 운영 데이터

- 신고 내역과 제재 정보는 운영자만 전체 조회 가능

## 인증 상태별 권한 매트릭스 요약

| 상태 | 홈/모집 읽기 | 학교 보드 읽기 | 글/댓글 작성 | 인증 재시도 | 비고 |
| --- | --- | --- | --- | --- | --- |
| `unverified` | 불가 | 불가 | 불가 | 가능 | 소개/정책/인증 진입만 허용 |
| `pending` | 불가 | 불가 | 불가 | 가능 | 수동 인증 검토 대기 |
| `verified` | 가능 | 같은 학교만 가능 | 가능 | 불필요 | 정상 사용자 |
| `rejected` | 불가 | 불가 | 불가 | 가능 | 반려 사유 확인 후 재제출 |
| `restricted` | 제한적 가능 | 제한적 또는 불가 | 불가 | 불가 | 운영 제재 상태 |
| `banned` | 불가 | 불가 | 불가 | 이의제기만 가능 | 계정 정지 |

## 구현 시 유의점

- 피드 성능을 위해 `posts.major_group_id`, `posts.university_id`, `posts.category`에 인덱스가 필요하다.
- 차단 관계는 피드 조회에서 필터링되도록 서버 쿼리 또는 뷰 설계가 필요하다.
- 학교 보드 권한 검사는 클라이언트가 아니라 RLS에서 최종 보장해야 한다.
- MVP에서는 모집 참여 의사 댓글과 일반 댓글을 구분하기 위해 `comments.comment_kind`를 포함하는 방향으로 고정한다.

## 결론

이 데이터 모델 초안은 "학교 인증 기반 신뢰"와 "전공군 중심 네트워크"를 동시에 지원하는 것을 목표로 한다. 핵심은 `boards.scope_type`과 `posts`의 스냅샷 컬럼을 이용해 통합 홈, 전공 필터, 학교 보드를 하나의 구조 안에서 처리하는 것이다.
