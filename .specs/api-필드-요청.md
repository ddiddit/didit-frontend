# 백엔드 API 수정 요청 (회의용)

> 작성일: 2026-06-15 (명세 점검 반영: 2026-06-16)
> 기준: 앱 문서 `dev-api.didit.ai.kr/docs/app/index.html`, 백엔드 `didit-api`, 기능 명세서

---

## A. 응답 필드 추가/보완

### A-1. `GET /api/v2/users/profile` → `level: number` 추가
화면이 `Lv.{level}` 을 렌더하나 응답에 없어 항상 `Lv.1` 고정. (`my/index.vue:15`)

### A-2. `GET /api/v1/home` 보완
- `hasUnreadNotifications: boolean` 추가 — 종 아이콘용. 지금은 이거 하나 때문에 `/api/v1/notification-histories` 전체를 추가 호출 중(홈 진입당 2회→1회). `existsByUserIdAndIsReadFalse` 정도로 계산.
- `recentRetrospectives[]` 에 `projectName` 추가 — 명세 카드 구성: 프로젝트명+날짜+제목.
- limit이 5(`HomeApi.kt`)인데 명세는 최대 3 → 3으로 조정(또는 명세 확인).

### A-3. 회고 리스트 응답에 `projectName`, `tags` 추가
프론트 카드가 렌더하나 리스트 DTO에 없어 항상 빈 값. `RetrospectiveListItemResponse`(전체), `RetrospectiveListResponse`(프로젝트별) 둘 다 `id, title, summary, completedAt` 만 있음.

---

## B. 검증/제한 로직 추가

### B-1. 프로젝트 최대 10개 제한
`ProjectRegisterService.create()` 에 개수 제한 없음 → API 직접 호출 시 11개+ 생성 가능. `create()` 진입 시 `countByUserIdAndDeletedAtIsNull(userId) >= 10` 이면 예외. (프론트는 클라에서만 차단 중)

### B-2. 태그 길이 검증(1~10자)
명세는 태그 1~10자인데 검증 없음. `Tag.create` 가 `isNotBlank` 만, `TagCreateRequest` 에 `@Size` 없음.

### B-3. 닉네임 정규식에서 숫자 제거
명세/프론트는 한글·영문만 허용인데 백엔드 `^[가-힣a-zA-Z0-9]{2,10}$` 로 숫자 허용. `0-9` 제거. (`OnboardingRequestV2.kt:10`, `OnboardingRequest.kt`)

### B-4. 문의내역 최근 1년 필터
프론트 문구 "최근 1년간 문의한 내역만 조회 가능"인데 백엔드는 전체 조회. `InquiryFinderService.findAllByUserIdAndDeletedAtIsNull` 에 `createdAt >= now-1year` 추가.

---

## C. 기능 보완

### C-1. "회고 결과 생성 완료" 알림 유형 추가
명세 알림 2종(회고 작성 / 회고 결과 생성 완료) 중 후자가 없음. 현재 enum = `DAILY_REMINDER`, `INQUIRY_ANSWERED`. enum 추가 + 회고 결과 생성 시 발송 로직 필요.

### C-2. 회고 검색에 태그 검색 추가
명세는 제목+태그 검색인데 현재 제목(title)만 LIKE 검색(`RetrospectiveRepository`). 태그명도 매칭되도록 보완.
