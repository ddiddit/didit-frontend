# 백엔드 API 수정 요청 (회의용)

> 작성일: 2026-06-15 (명세 점검 반영: 2026-06-16)
> 기준: 앱 문서 `dev-api.didit.ai.kr/docs/app/index.html`, 백엔드 `didit-api`, 기능 명세서
> 구성: ① 화면이 쓰는데 없는 응답 필드(level/hasUnreadNotifications) → ② 명세 점검에서 나온 백엔드 수정 항목(B-1~B-8)

---

## 추가 필요 필드

### 1. `GET /api/v2/users/profile` → `level: number` 추가
- **근거**: `app/pages/my/index.vue:15` 에서 `Lv.{{ profile?.level ?? 1 }}` 로 레벨 배지 렌더
- **현재 문제**: 응답에 `level`이 없어 **항상 `Lv.1` 고정** 표시
- **현재 응답 필드**: `nickname, job, email, age, experience, provider, recentBadges`

### 2. `GET /api/v1/home` → `hasUnreadNotifications: boolean` 추가
- **근거**: `app/pages/home.vue` 상단 종 아이콘 on/off
- **현재 문제**: 이 boolean 하나 때문에 홈 진입 시 **`/api/v1/notification-histories` 전체 목록을 추가 호출**해서 `.some(n => !n.isRead)` 로 계산 중
- **효과**: 홈 응답에 포함되면 홈 진입당 API **2회 → 1회**
- **구현 참고**: `existsByUserIdAndIsReadFalse(userId)` 정도로 계산 가능

---

## 확인 결과 — 변경 불필요 (회의 참고용)

- **`notification-histories[].createdAt`**: 문서 예시엔 `null`로 보이지만, 백엔드는 `@CreatedDate` + `@EnableJpaAuditing` 로 저장 시 자동 기록하고 컬럼도 `NOT NULL`. 실제 응답엔 정상 시각이 들어옴 → **수정 불필요** (문서 예시 artifact)
- **`projects[].retrospectiveCount`**: 프론트가 화면에 렌더하지 않음(죽은 코드라 프론트에서 제거) → **불필요**
- **`projects[].order`**: 프론트가 서버 반환 배열 순서에 의존, 명시적 사용 없음 → 서버 정렬만 보장하면 됨
- **`tags[].retrospectiveCount`**: 화면 미사용 → 현재 불필요

---

## 별도 안건 — 프로젝트 최대 10개 제한 (백엔드 미강제, 확인 완료)

- **프론트**: `MAX_PROJECTS = 10` 으로 클라이언트에서만 차단(`app/pages/projects/index.vue:192`)
- **백엔드 확인 결과**: `ProjectRegisterService.create()` 는 유저 확인 → 이름 중복 확인 → 저장만 하고 **개수 제한 로직이 없음**. 도메인 `Project.create()` 도 이름 검증(공백·15자)만 함
- **결론**: API를 직접 호출하면 **11개 이상 생성 가능** (이중 방어 부재) → 서버에 생성 개수 제한 추가 권장
  - 예: `create()` 진입 시 `countByUserIdAndDeletedAtIsNull(userId) >= 10` 이면 예외

---

# 백엔드 수정 필요 (명세 점검 결과)

> 기능 명세서 대비 백엔드 점검에서 나온 수정 항목. (프론트 수정분은 별도 처리)

## 검증/제한 로직 추가

### B-1. 프로젝트 최대 10개 제한 추가
- 현재 `ProjectRegisterService.create()` 에 개수 제한 없음 → API 직접 호출 시 11개+ 생성 가능
- `create()` 진입 시 `countByUserIdAndDeletedAtIsNull(userId) >= 10` 이면 예외

### B-2. 태그 길이 검증(1~10자) 추가
- 명세: 태그 1~10자. 현재 백엔드는 길이 검증 없음
- `Tag.kt`(`Tag.create` 가 `isNotBlank` 만 검사), `TagCreateRequest.kt`(`@Size` 없음) → 1~10자 검증 추가

### B-3. 닉네임 정규식에서 숫자 제거
- 명세/프론트: 닉네임에 숫자·특수문자 불가 (한글/영문만)
- 현재 백엔드 정규식 `^[가-힣a-zA-Z0-9]{2,10}$` 로 **숫자 허용** → `0-9` 제거 (`OnboardingRequestV2.kt:10`, `OnboardingRequest.kt`)

### B-4. 문의내역 최근 1년 필터 추가
- 프론트 안내 문구는 "최근 1년간 문의한 내역만 조회 가능합니다." 인데, 백엔드는 전체 조회(필터 없음)
- `InquiryFinderService.findAllByUserIdAndDeletedAtIsNull` 에 `createdAt >= now-1year` 조건 추가

## 알림 유형

### B-5. "회고 결과 생성 완료" 알림 유형 추가
- 명세 알림 2종: 회고 작성 알림 / **회고 결과 생성 완료 알림**
- 현재 `NotificationType` enum = `DAILY_REMINDER`(회고 작성), `INQUIRY_ANSWERED`(문의 답변)
- "회고 결과 생성 완료" 타입이 없음 → enum 추가 + 회고 결과 생성 시 발송 로직 필요

## 응답 필드 (회고 리스트/홈)

### B-6. 회고 리스트 응답에 `projectName`, `tags` 추가
- 프론트 회고 카드가 `projectName`/`tags` 를 렌더하지만 리스트 DTO에 없어 **항상 빈 값**
- `RetrospectiveListItemResponse`(전체 리스트), `RetrospectiveListResponse`(프로젝트별) 둘 다 `id, title, summary, completedAt` 만 → `projectName`, `tags` 추가

### B-7. 회고 검색에 태그 검색 추가
- 명세: 제목 + 태그 검색. 현재 백엔드는 제목(title)만 LIKE 검색 (`RetrospectiveRepository`)
- 태그명으로도 매칭되도록 검색 쿼리 보완

### B-8. 홈 응답 보완
- `recentRetrospectives` 에 `projectName` 없음 (명세 카드: 프로젝트명+날짜+제목) → 추가
- 개수 limit이 **5** (`HomeApi.kt` `limit = 5`) 인데 명세는 **최대 3** → 3으로 조정 (또는 명세 확인)
