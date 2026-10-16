# Amplitude 이벤트 정의서

## 공통 기준

- 운영 빌드에서만 전송하며 모든 이벤트에 `environment`, `app_surface`, `app_version`, `account_type`을 자동으로 붙인다.
- `account_type`은 `CUSTOMER`, `TEAM`, `TEST`이며 프로필 로드 전에는 `UNKNOWN`이다.
- 답변 본문, 회고 결과, 제목, 이메일, 닉네임은 전송하지 않는다.
- 회고 ID와 서버 턴 ID 기반 `insert_id`로 재시도·새로고침 중복을 제거한다.
- 유입 정보는 마지막 이메일·푸시 클릭부터 7일간 유지한다.

## 핵심 회고 이벤트

| 이벤트 | 발생 시점 | 주요 속성 |
|---|---|---|
| `retrospect_start_clicked` | 회고 시작 버튼 클릭 | `source` |
| `retrospect_started` | V2 회고 생성 API 성공 | `retrospective_id`, `flow_version`, `source`, 유입 정보 |
| `retrospect_start_failed` | 회고 생성 실패 | `reason`, `source` |
| `retrospect_restarted` | 기존 회고 다시 시작 성공 | `previous_retrospective_id`, `retrospective_id` |
| `retrospect_restart_failed` | 기존 회고 다시 시작 실패 | `previous_retrospective_id`, `reason` |
| `retrospect_answer_submitted` | 답변이 서버에 저장됨 | `retrospective_id`, `turn_id`, `turn_number`, `input_type`, `ready_to_complete` |
| `retrospect_exited` | 사용자가 나가기를 확정 | `retrospective_id`, `last_completed_turn`, `exit_reason` |
| `retrospect_result_generated` | finish와 결과 조회 성공 | `retrospective_id`, `answer_count` |
| `retrospect_completed` | DB 완료 전환과 결과 조회 성공 | `retrospective_id`, `answer_count`, `turn_count`, `elapsed_duration_sec`, `active_duration_sec`, 유입 정보 |
| `retrospect_complete_failed` | 완료 또는 결과 조회 실패 | `retrospective_id`, `reason`, `last_completed_turn` |

`elapsed_duration_sec`는 생성부터 완료까지의 전체 시간이고, `active_duration_sec`는 화면이 활성 상태였던 시간이다. 앱 강제 종료는 마지막 성공 답변 뒤 퍼널 이탈로 본다.

## 유입과 사용자 식별

- `campaign_opened`: 이메일 링크 또는 푸시 탭. `entry_channel`, `campaign_id`, `link_target`, UTM 정보를 포함한다.
- 로그인과 자동 로그인은 JWT `sub`를 User ID로 사용한다.
- 프로필 로드 후 `provider`, `account_type`, `account_created_at`을 Identify로 갱신한다.
- 로그아웃·탈퇴 시 유입 정보를 지우고 `reset()`을 호출한다.

## 분석 기준

- 기본 필터: `environment = production`, `account_type = CUSTOMER`.
- 퍼널: `retrospect_started → retrospect_answer_submitted → retrospect_completed`.
- 공식 완료율·14일 재회고율·복귀·신규 가입·답변 수·전체 경과 시간은 DB 기반 어드민 지표를 사용한다.

기존 일반 화면 이벤트는 계속 수집하지만 공식 업데이트 KPI는 위 이벤트를 사용한다.
