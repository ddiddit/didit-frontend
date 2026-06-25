# Amplitude 이벤트 정의서 (Tracking Plan)

> didit 프론트엔드의 앰플리튜드 이벤트 명세. 새 이벤트를 추가하거나 프로퍼티를 바꿀 때 이 문서를 함께 갱신한다.

## 기본 원칙

- **이벤트명**: `object_action` 형태의 snake_case (예: `retrospect_completed`)
- **프로퍼티명**: snake_case
- **사전 등록 불필요**: `track()` 호출 즉시 앰플리튜드에 수집된다. 이 문서는 거버넌스/일관성용.
- **수집 환경**: `import.meta.dev`일 때는 전송 안 됨(`app/plugins/amplitude.client.ts`). 프로덕션에서 `amplitudeApiKey` 필요.

## 유저 식별 (User Identity)

| 시점 | 동작 | 위치 |
|---|---|---|
| 로그인/회원가입 | `identify(accessToken, { provider })` → JWT `sub`로 `setUserId` | `login.vue`, `auth/kakao/callback.vue` |
| 탈퇴 | `reset()` | `my/account/withdraw.vue` |

- 리텐션·DAU·MAU·stickiness는 위 식별 + 이벤트 타임스탬프로 **앰플리튜드가 자동 계산**한다(별도 이벤트 불필요).
- SDK가 userId를 자체 저장하므로 세션이 바뀌어도(토큰 자동로그인) 식별이 유지된다.
- (보강 제안) 앱 부팅 시 토큰이 있으면 `setUserId`를 호출해 식별 누락 엣지 케이스를 방지.

---

## 현재 구현된 이벤트

| 이벤트명 | 트리거 | 현재 프로퍼티 | 위치 |
|---|---|---|---|
| `user_signed_up` | 신규 회원가입 성공 | `provider` | `login.vue`, `kakao/callback.vue` |
| `user_logged_in` | 기존 로그인 성공 | `provider` | `login.vue`, `kakao/callback.vue` |
| `user_withdrew` | 탈퇴 완료 | `reason` | `my/account/withdraw.vue` |
| `onboarding_completed` | 온보딩 완료 | `job`, `age`, `experience`, `marketing_agreed` | `onboarding.vue` |
| `home_viewed` | 홈 진입 | — | `home.vue` |
| `retrospect_started` | 회고 시작 버튼 | — | `home.vue` |
| `retrospect_completed` | 회고 질문 종료 → 결과로 이동 | — | `retrospect/start.vue` |
| `retrospect_saved` | 회고 제목 확정 저장 | — | `retrospect/result.vue` |
| `retrospect_list_viewed` | 회고 목록 진입 | — | `retrospects/index.vue` |
| `retrospect_search_viewed` | 검색 화면 진입 | — | `retrospects/search.vue` |
| `retrospect_searched` | 검색 실행 | `keyword` | `retrospects/search.vue` |
| `project_list_viewed` | 프로젝트 목록 진입 | — | `projects/index.vue` |
| `project_created` | 프로젝트 생성 | `count` | `projects/index.vue` |
| `project_deleted` | 프로젝트 삭제 | `project_name` | `projects/index.vue` |
| `notification_center_viewed` | 알림함 진입 | — | `notifications.vue` |
| `notification_clicked` | 알림 클릭 | `type` | `notifications.vue` |
| `badge_list_viewed` | 뱃지 목록 진입 | — | `badges/index.vue` |
| `badge_detail_viewed` | 뱃지 상세 조회 | `badge_name`, `badge_code`, `is_acquired` | `badges/index.vue` |
| `badge_acquired` | 뱃지 획득 | `badge_name`, `badge_code` | `useBadgeAcquired.ts` |
| `my_page_viewed` | 마이페이지 진입 | — | `my/index.vue` |
| `marketing_consent_changed` | 마케팅 수신 동의 토글 | `agreed`(bool) | `my/notification-settings.vue` |
| `night_push_consent_changed` | 야간 푸시 동의 토글 | `consent`(bool) | `my/notification-settings.vue` |
| `notification_setting_changed` | 알림 설정 변경(리마인더 시간/전체 토글) | `type`(`reminder_time`\|`enabled`), `value` | `my/notification-settings.vue` |
| `inquiry_submitted` | 문의 등록 성공 | `category` | `my/inquiry/index.vue` |

---

## 점검 결과 / 적용 내역 (✅ 반영 완료)

### A. 네이밍 통일

- ✅ `notification_center_viewed` → `notification_viewed` : `notification_clicked`와 접두사 통일.

### B. 핵심 이벤트 프로퍼티 보강

| 이벤트 | 추가된 프로퍼티 |
|---|---|
| `retrospect_started` | ✅ `source` (예: `home`) |
| `retrospect_completed` | ✅ `answer_count`, `deep_question_answered`(bool), `duration_sec` |
| `retrospect_saved` | ✅ `has_project`, `tag_count`, `title_length` |
| `retrospect_searched` | ✅ `keyword`, `result_count` — 결과 페이지(`retrospects/index.vue`)에서 발생하도록 이동 |
| `onboarding_completed` | ✅ `night_push_agreed` |

### C. 누락 이벤트 추가

| 추가된 이벤트 | 트리거 | 프로퍼티 | 위치 |
|---|---|---|---|
| `login_failed` | 로그인/콜백 실패 | `provider` | `login.vue`, `kakao/callback.vue` |
| `retrospect_start_failed` | 회고 시작 실패(횟수 소진 등) | `reason` | `retrospect/start.vue` |
| `answer_submitted` | 답변 1건 제출 성공 | `question_no`, `is_deep`(bool) | `retrospect/start.vue` |
| `deep_question_shown` | 심화질문(Q4_DEEP) 노출 | — | `retrospect/start.vue` |
| `deep_question_skipped` | 심화질문 스킵 | — | `retrospect/start.vue` |
| `retrospect_save_failed` | 저장 실패 | — | `retrospect/result.vue` |
| `retrospect_viewed` | 회고 상세 진입 | `retrospect_id` | `retrospects/[id].vue` |
| `user_logged_out` | 로그아웃 | — | `my/account/index.vue` |

### 유저 식별 보강

- ✅ 앱 부팅 시 `accessToken`이 있으면 `setUserId` 호출 (`amplitude.client.ts`) — 토큰 자동 로그인 시 리텐션 집계 누락 방지.

### D. 알림 설정 / 문의 이벤트 추가

마이페이지 설정·CS 화면에 추적이 없어 동의율 변화·문의 발생을 집계하지 못하던 구멍을 보강.

| 추가된 이벤트 | 트리거 | 프로퍼티 | 위치 |
|---|---|---|---|
| `marketing_consent_changed` | 마케팅 수신 동의 토글 | `agreed`(bool) | `my/notification-settings.vue` |
| `night_push_consent_changed` | 야간 푸시 동의 토글 | `consent`(bool) | `my/notification-settings.vue` |
| `notification_setting_changed` | 리마인더 시간 저장 / 알림 전체 토글 | `type`(`reminder_time`\|`enabled`), `value` | `my/notification-settings.vue` |
| `inquiry_submitted` | 문의 등록 성공 | `category` | `my/inquiry/index.vue` |

- 온보딩에서 1회 수집하던 동의 여부(`marketing_agreed`/`night_push_agreed`)의 **이후 변경**을 추적해 동의율 코호트·이탈 분석이 가능해짐.
