# 백엔드 API 수정 요청 — 회고 플로우 (회의용)

> 작성일: 2026-06-22
> 기준: 앱 문서 `dev-api.didit.ai.kr/docs/app/index.html`, 백엔드 `didit-backend`, 기능 명세서
> 범위: 회고 진행(채팅)·완료·결과·상세·리스트·캘린더·배지. 프론트 화면 구현 중 발견한 항목.

---

## A. 버그 — 구현된 화면이 정상 동작하려면 즉시 수정 필요

### A-1. 배지 "최초 1회만 노출"이 안 됨 — 매번 팝업이 뜸
회고 저장 후 `GET /api/v1/badges/popup`(`findUnnotified`)을 호출해 신규 배지 팝업을 띄우는데, 이미 획득·노출한 배지가 **매번 다시 반환**됨.

원인: `BadgeQueryService`가 **클래스 레벨 `@Transactional(readOnly = true)`** 라서, `findUnnotified` 내부의 `markAsNotified()` + `save()`가 **커밋되지 않음**. 즉 `isNotified`가 영원히 `false`로 남아 같은 배지를 계속 반환.
- `application/achievement/BadgeQueryService.kt:11` (`@Transactional(readOnly = true)`)
- `application/achievement/BadgeQueryService.kt:40-52` (`findUnnotified` 안에서 `markAsNotified()` 후 `save()`)

수정: `findUnnotified` 메서드에 **쓰기 트랜잭션**을 명시해 `readOnly`를 오버라이드.
```kotlin
@Transactional
override fun findUnnotified(userId: UUID): List<BadgeResponse> { ... }
```
> 프론트는 임시로 localStorage 기기별 1회 노출 가드를 넣어둠. 이 수정이 적용되면 가드 없이도 정상 동작하며, 가드는 무해.

### A-2. 캘린더 날짜별(daily) 응답에 `projectName`, `tags` 누락
캘린더 날짜별 카드도 리스트 카드와 동일하게 "프로젝트명 / 제목 / 요약 / 태그칩"을 렌더하나, daily 응답 DTO에 두 필드가 없어 표시 안 됨.
- `GET /api/v2/retrospectives` (리스트) — `projectName`, `tags` **포함됨**(정상). 리스트 탭은 OK.
- `GET /api/v1/retrospectives/calendar/daily` (캘린더 날짜별) — `id, title, summary, completedAt` 뿐, `projectName`/`tags` **누락**.

수정: daily 응답 DTO에 `projectName: String?`, `tags: List<TagListResponse>` 추가(v2 리스트와 동일하게).
> 프론트 임시 보강: daily 항목을 이미 로드된 v2 리스트 데이터와 id 매칭해 프로젝트명·태그를 채워 표시 중. 백엔드가 daily에 두 필드를 내려주면 매칭 의존 없이도 동작하며, 보강 로직은 무해(응답 우선).

### A-3. "10회 기록" 배지(TOTAL_10) 조건 미구현 → 영원히 잠금
배지 카탈로그의 `record-10`(10회 기록)에 대응하는 `conditionType`이 백엔드에 없음(`TOTAL_30`만 존재). 회고를 10개 이상 저장해도 이 배지는 **절대 획득 불가**(항상 잠금).
- 프론트는 conditionType 없는 배지를 항상 잠금 처리하므로, 백엔드에 조건이 없으면 화면상 영구 잠금.

수정: `TOTAL_10` 조건을 추가하고 `/api/v1/badges`·`/api/v1/badges/popup` 응답에 포함.

---

## B. 안정성 / 정합성 (권장)

### B-1. 요약 배열을 `\n` join 저장 → split 복원: 데이터 손실 위험
`blockedPoint`/`solutionProcess`/`lessonLearned`를 `"\n"`으로 join해 단일 문자열로 저장하고, 조회 시 `.split("\n")`으로 배열 복원. **원소 내부에 줄바꿈이 있으면 배열 개수가 깨짐.**
- 저장: `application/retrospect/RetrospectService.kt:212-218`
- 복원: `adapter/webapi/retrospect/dto/RetrospectiveDetailResponse.kt:26-28`

수정: 별도 테이블/컬럼 또는 JSON 컬럼으로 배열을 그대로 저장.

### B-2. 심화질문 비동기 중복 생성 가드 우회
`generateDeepQuestionAsync()`가 `canAddDeepQuestion()`(`!hasDeepQuestion()`) 가드를 거치지 않고 호출됨. Q3 중복 제출/재시도 시 심화질문이 2개 이상 생성될 여지.
- `application/retrospect/RetrospectService.kt:435`, `:134-165`, 가드 `domain/retrospect/Retrospective.kt:57-64`

수정: 비동기 생성 진입 시에도 `canAddDeepQuestion()` 가드 적용.

### B-3. restart가 하루 제한(DAILY_LIMIT)에 걸릴 수 있음
`POST /{id}/restart`가 내부에서 `start()`를 호출 → `DAILY_LIMIT` 검사를 받음. 하루 3회 소진 상태에서 "다시 시작" 시 `DAILY_LIMIT_EXCEEDED` 발생 가능.
- `application/retrospect/RetrospectService.kt:264-278`

수정: restart는 기존 회고 대체이므로 제한 검사 제외할지 정책 검토.

### B-4. 하루 카운트 쿼리가 soft delete 미필터
`countByUserIdAndStatusNotAndCreatedAtBetween`에 `deletedAt` 조건이 없어, **소프트 삭제된(IN_PROGRESS/COMPLETED) 회고도 하루 횟수에 포함**됨. restart/exit로 버린 회고도 횟수를 소진.
- `application/retrospect/RetrospectQueryService.kt:52-62`, `application/retrospect/required/RetrospectiveRepository.kt:22-27`

수정: 카운트 쿼리에 `deletedAt IS NULL` 추가 (정책 확정 후).

### B-5. `/api/v2/home` 의 `nickname` 이 stale — 프로필 변경이 반영 안 됨
닉네임을 `프로필수정`에서 변경해도 `GET /api/v2/home` 응답의 `nickname` 은 옛 값을 그대로 반환(예: "디바" → "디딧" 변경 후에도 home 은 "디바"). 마이페이지(`/api/v2/users/profile`)와 불일치.
- home 응답이 닉네임을 비정규화 저장/캐시하고 프로필 업데이트 시 동기화하지 않는 것으로 추정.

수정: home 의 nickname 도 프로필 변경 시 최신값을 반영(또는 조회 시점 user 에서 직접 read).
> 프론트 임시 대응: 홈 화면 닉네임을 home 응답 대신 `/api/v2/users/profile`(authoritative)에서 가져오도록 변경함. 백엔드 동기화 시에도 무해.

---

## C. 프론트 분기 편의

### C-1. 에러 응답 `code` 필드가 enum명이 아니라 한글 메시지
`ProblemDetail`의 `code`가 `errorCode.detail`(한글 message)로 세팅됨. 프론트가 `DAILY_LIMIT_EXCEEDED` 같은 **식별 코드로 분기 불가** (현재 한글 `detail`을 그대로 노출 중).
- `adapter/webapi/exception/ApiControllerAdvice.kt:34-47` (`setProperty("code", errorCode.detail)`)
- 예) 하루 제한 초과: HTTP 400, `detail`/`code` = `"오늘 회고 횟수를 모두 사용했습니다."`

수정: `setProperty("code", errorCode.name)` 으로 변경(또는 별도 식별 코드 필드 추가). 그러면 프론트가 코드 기반 분기/문구 처리 가능.

### C-2. 배지 진행 카운트(현재/목표) 미제공
`/api/v1/badges` 응답에 countable 배지(10회/30회)의 **현재 진행 수가 없음**. 프론트가 진행도 표기를 위해 `/api/v2/retrospectives`를 따로 받아 완료 회고 수를 세고 있음(배지 화면 진입 시 추가 호출 1회).
- 응답에 `current`/`progress` 같은 카운트가 있으면 프론트의 추가 조회를 제거해 최적화 가능.

수정(선택): countable 배지 응답에 진행 수 포함.

### C-3. 음성 업로드 포맷에 webm 미허용
`/answers/voice`, `/answers/voice/transcribe`가 wav/m4a/mp3/aac/ac3/ogg/flac만 허용 → 웹 `MediaRecorder` 기본 출력(webm/opus, 특히 크롬)을 거부(`지원하지 않는 음성 파일 형식입니다.` 400).
- 프론트 임시 대응: 업로드 전 Web Audio API로 wav 변환(네이티브 m4a는 변환 없이 그대로).

수정(선택): webm/opus도 허용하면 프론트 변환 없이 원본 업로드 가능(변환 비용·품질 손실 제거). 필수는 아님 — 음성은 본래 네이티브 전용.

---

## 우선순위 요약
- **즉시(P0)**: A-1(배지 팝업 중복), A-2(캘린더 daily projectName/tags), A-3(10회 배지 조건 미구현) — 구현된 화면 데이터/동작 직접 영향
- **권장(P1)**: B-1(직렬화 손실), B-2(심화질문 중복), B-5(home 닉네임 stale)
- **검토(P2)**: B-3, B-4, C-1, C-2(배지 카운트), C-3(음성 webm)
