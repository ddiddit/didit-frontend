# didit 프론트엔드

> Claude Code가 이 프로젝트에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

AI 기반 회고(retrospective) 앱의 프론트엔드.
백엔드 API(`https://api.didit.ai.kr`)와 연동하며, Nuxt 웹을 WebView(Capacitor)로 감싸 iOS/Android 앱으로 패키징.

- **단계**: 웹 MVP 개발 중
- **개발자**: 1인 사이드 프로젝트
- **디자인 컨셉**: 모바일 우선, 미니멀
- **플랫폼 전략 (앱 우선)**: **제품 = 네이티브 앱**(Capacitor). 공개 도메인 루트(`/`)는 **랜딩 페이지**(소개 + 다운로드/베타 신청), 실제 앱은 앱으로 배포. 일반 대중에게 **웹 버전을 제품 표면으로 제공하지 않음**.
  - **결제는 앱 IAP 전용** → 웹엔 구독 결제 노출 안 함. (자세한 근거·세금·사업자 메모는 `.specs/roadmap.md` 수익화 섹션)
  - **QA는 하이브리드 (운영 환경 기준)**: ① **운영 앱 도메인**(예: `app.didit.ai.kr` — 프로덕션 빌드+운영 API, 로그인 게이트로 일반인 자연 차단)에서 UI·로직 QA + ② TestFlight(iOS)/구글플레이 내부테스트(결제·푸시·네이티브 실동작)
    - 버셀 **프리뷰 배포는 Deployment Protection(팀 로그인)** 때문에 외부 QA가 못 들어옴 → **프로덕션 배포는 공개**라 운영 도메인에서 QA하면 접근 문제 없음.
- **향후 계획**: Capacitor로 iOS/AOS 패키징

## 주요 화면 (MVP)

1. 소셜 로그인 (카카오 · 구글 · 애플)
2. 홈 (오늘 회고 횟수, 최근 회고 목록)
3. 회고 진행 플로우 (질문 → 답변 → AI 심화질문 → 완료)
4. 회고 목록 / 캘린더 / 검색
5. 회고 상세
6. 프로젝트 · 태그 관리
7. 뱃지 (FIRST_RETRO, STREAK_3_DAYS, TOTAL_30)
8. 알림 히스토리 / 설정
9. 마이페이지 (프로필, 탈퇴, 문의)

## 비목표 (NOT to build)

- 어드민 페이지 — 이 프론트엔드 레포에서 미구현 (별도 서비스로 존재. `my/inquiry`의 `adminAnswer`는 운영툴 답변 데이터만 수신)
- 인앱 소셜 피드 (팔로우, 피드 공유) — 단, **아웃바운드 공유**(회고/성취를 이미지 카드로 외부 SNS 내보내기)는 마케팅 채널로 허용 (로드맵 진입)
- 다국어 (한국어만)
- SSR (CSR만, SEO 불필요)

> **로드맵 진입 (기존 비목표에서 재검토됨):** 결제(구독) — `.specs/roadmap.md` 참고. 비목표가 아니라 향후 업데이트로 예정.

## 기술 스택

- **Nuxt 4** (Vue 3, App Router)
- **TypeScript** (strict 모드)
- **Tailwind CSS** (모바일 우선)
- **Pinia** — 전역 상태 (인증)
- **@tanstack/vue-query** — API 호출 · 캐싱
- **axios** — HTTP 클라이언트 (JWT 인터셉터 포함)
- **@vueuse/core** — 유틸 컴포저블
- **@nuxt/icon** — 아이콘
- **Capacitor** — iOS/AOS 패키징 (나중에)

## 코딩 규칙

### 언어 / 스타일

- 주석은 한국어
- 변수·함수명은 영어 camelCase
- 컴포넌트명은 PascalCase
- 파일명은 kebab-case
- `any` 타입 금지

### Vue / Nuxt

- `<script setup lang="ts">` 만 사용
- Composable은 `use` 접두사
- 페이지 컴포넌트는 `pages/` 안에 파일 기반 라우팅
- 레이아웃은 `layouts/` 사용

### API 통신

- axios 인스턴스는 `app/utils/axios.ts`에서 생성, `app/plugins/axios.ts`로 주입
- vue-query로 캐싱·로딩 상태 관리
- 토큰 자동 갱신 인터셉터 포함 (401 → refresh → retry)
- 인증 토큰은 localStorage (`accessToken`, `refreshToken`)
- **조회 응답 영구 캐시** (`app/utils/persisted-cache.ts`, 키 접두사 `cache:`): 홈(`/api/v2/home`, 5분)·프로필(`useProfile`, 10분)·알림 설정(`useNotificationSettings`, 1시간)은 새로고침·재진입 때 TTL 안이면 요청하지 않는다
  - 데이터를 바꾸는 작업 뒤엔 반드시 캐시 무효화 — 회고 완료·저장·삭제·제목/프로젝트/태그 변경은 `useRetrospect` 안에서 자동 처리, 그 외 새 변경 API를 추가하면 `removePersistedCache(CACHE_KEYS.*)`/`invalidateProfileCache()` 호출
  - 로그인·로그아웃 시 `clearPersistedCaches()`로 전부 삭제(계정 간 데이터 혼입 방지)

### 인증

- `app/middleware/auth.ts` — 보호 라우트 (CSR only)
- 페이지에서 `definePageMeta({ middleware: 'auth' })` 로 적용

## 회고 진행 플로우 (V2 대화 API)

- 회고 진행 화면은 `app/pages/retrospect/start.vue` + `app/components/layout/RetroTextarea.vue`의 **채팅형 UI**로 구현 (질문이 타이핑 애니메이션으로 노출되고, 텍스트/음성(STT)으로 답변)
- 회고 **시작·답변 제출·대화 조회·대화 종료는 V2 API**(`/api/v2/retrospectives/...`)로 전환됨. 음성 답변/STT/심화질문 조회/완료(결과 생성)는 아직 **V1 API** 그대로 사용 (`app/composables/useRetrospect.ts`에서 경로로 구분)
  - `POST /api/v2/retrospectives` — 시작
  - `POST /api/v2/retrospectives/{id}/messages` — 답변 제출. `clientMessageId`는 **요청마다 고유해야 하는 멱등키**(`crypto.randomUUID()`) — 회고 id처럼 고정값을 재사용하면 두 번째 제출부터 409 Conflict
  - `GET /api/v2/retrospectives/{id}/conversation` — 대화 조회. **AI 메시지만** 내려주고 사용자가 입력한 답변 텍스트는 포함하지 않음 → 전체 대화 재구성은 불가능하고 "가장 마지막 질문" 복구만 가능
  - `POST /api/v2/retrospectives/{id}/finish` — 대화 종료. **종료와 동시에 결과도 생성**한다(V1 `complete()`와 달리 분리되어 있지 않음). 이미 완료된 회고에 다시 요청해도 멱등하고, 생성 실패 상태였다면 재요청으로 재시도됨
  - `GET /api/v2/retrospectives/{id}/result` — 결과 조회(`getResult()`). 응답은 `id`/`flowVersion`/`title`/`completedAt`/`project`/`tags`와 결과 본문 `content`(요약·강점·개선점·진행 과정·배운 점·인사이트·다음 행동 제안, 타입 `RetrospectiveResultV2`)
- **진행 중 회고 재개**: `useRetrospect.ts`의 `ACTIVE_RETROSPECTIVE_KEY`(localStorage)에 회고 id를 보관 — 답변 도중 화면을 나갔다 들어와도 `start()`로 새 회고를 만들지 않고 `getConversation()`으로 이어서 진행. 대화 종료(`finish()`)·완료(`complete()`) 시 이 키를 제거(`clearActiveRetrospective()`)
  - 마지막 AI 메시지는 `saveConversationCache()`로 localStorage에 캐시 → 재진입 시 캐시가 있으면 **대화 조회 요청 없이** 바로 복구. 답변 전송 순간 캐시를 지우므로, 응답을 못 받고 나간 경우에만 `getConversation()`으로 조회
  - 앱 백그라운드→포그라운드 복귀 시에도(`@capacitor/app`의 `appStateChange`) 대화 상태를 동기화해, 놓친 AI 응답을 복구
  - 단, WebView 자체가 완전히 종료된 뒤 재실행되면 `no-direct-entry` 미들웨어가 먼저 `/home`으로 돌려보내 재개 불가 (정상 네비게이션·백그라운드 유지 상태에서만 재개됨)
- **타이핑 애니메이션 공용 로직**: `app/composables/useDiditTyping.ts`의 `buildDiditMessage()`(AI 메시지 → 채팅 말풍선 변환) / `typeDiditMessage()`(한 글자씩 타이핑)를 첫 질문·다음 질문·재개 복구 등 여러 곳에서 재사용. 새 위치에서 AI 메시지를 화면에 추가할 땐 이 두 함수를 그대로 쓸 것 — push한 메시지 객체를 직접 `reactive()`로 감싸지 않으면(평범한 객체만 push) 이후 `typedMain` 등을 mutate해도 화면이 갱신되지 않는 반응성 함정이 있음
- **회고 마치기 버튼**: 헤더 오른쪽 "회고 마치기"(`RetroHeader`의 `onFinish`)는 **항상 노출**되며, AI 응답 대기 중(=`generating` 자리표시자가 떠 있음)·초기 로딩·`finish()` 처리 중일 때만 잠긴다(`isFinishBlocked`)
  - 마치기가 성공해 결과 화면으로 넘어가는 경우엔 `isFinishing`을 풀지 않는다 — 라우팅 전환 중에 버튼이 다시 눌려 `finish`/`complete`가 중복 호출되는 것을 막기 위함. 조회 결과가 not-ready거나 실패했을 때만 잠금 해제
- **skippable / readyToComplete**: 답변 응답의 `readyToComplete`가 true면 해당 질문은 `skippable: true`로 표시됨. 단 이 로컬 신호는 마무리 시점에도 false로 남는 경우가 있어 **완료 판정 기준으로 쓰지 않는다**
  - `readyToComplete=false`여도 **종료를 차단하지 않는다** — 헤더 "회고 마치기"는 항상 확인 모달 → `finish()`
- **AI 답장 아래 선택 버튼** (`showCompletionOffer`): 답변 응답의 `action`이 `OFFER_COMPLETION`/`CONFIRM_COMPLETION`이면 답장 **타이핑이 끝난 뒤** 말풍선 아래 "계속 작성하기 / 이대로 마치기"(`completionOffer`)를 노출
  - 이대로 마치기: `OFFER_COMPLETION`이면 바로 종료하지 않고 마무리 의사(`FINISH_INTENT_MESSAGE`)를 일반 답변으로 전송, `CONFIRM_COMPLETION`이면 `onFinishConfirm()`으로 결과 화면 이동
  - `ASK`/`REFLECT`/null → 버튼 없음. 계속 작성하기나 새 답변 전송 시 버튼 제거
  - 대화 조회(`getConversation`) 응답엔 `action`이 없어 첨부 분석 폴링·서버 조회 복구 시에는 버튼을 붙이지 않음 (대화 캐시에 저장된 `action`으로 복구할 때만 복원)
- **입력창 포커스**: `RetroTextarea`의 textarea는 응답 대기 중(`isBusy`)에도 **`disabled`로 잠그지 않는다** — 잠그면 포커스·모바일 키보드가 내려가 전송할 때마다 다시 눌러야 함. 대신 전송·첨부·마이크 버튼만 잠근다. AI 응답 출력 완료(`onDiditTyped`)·종료 선택 UI/모달 닫힘 시 `focusInput()`으로 자동 포커스(모달·레코더가 떠 있으면 생략)
- **뒤로가기**: 헤더 뒤로가기 → 확인 모달(답변 여부에 따라 문구만 다름). "나가기"는 **항상 저장하지 않고** `exit()`를 호출해 정리(PENDING이면 삭제)하고 `ACTIVE_RETROSPECTIVE_KEY`를 지운 뒤 `/home`으로 이동 — exit이 실패해도 이동은 막지 않음(`onBackConfirm`). 저장(결과 생성)은 "회고 마치기" 버튼(`finish()`)을 통해서만 이뤄지며, 뒤로가기 쪽에서는 답변이 있어도 `finish()`를 호출하지 않는다
- **결과 화면(`retrospect/result.vue`)은 v2 `finish()` 기반**: `start.vue`는 회고 마치기 확인 시 `finish()`를 부르지 않고 `completingId`(`useState('retrospect:completing-id')`)만 넘겨 **바로** 결과 화면으로 이동. `result.vue`가 자동 저장 로딩 화면(**최소 1초**, `MIN_LOADING_MS`)을 띄운 채 `finish()` → `getResult()`를 호출해 결과를 보여준다. 실패 시 에러 화면의 '다시 시도'로 재호출 — `finish()`는 멱등이라 재호출해도 400이 나지 않는다. 재개용 id(`clearActiveRetrospective()`)는 생성 성공 시에만 지운다

- **답변 예시 (`answerGuide`)**: AI 메시지의 `answerGuide`가 있으면 아직 답하지 않은 마지막 질문 아래 예시를 노출 — `INLINE`은 바로 펼침, `ON_DEMAND`는 "답변 예시 보기" 버튼을 눌러 펼침, null·빈 배열은 미표시. 예시를 누르면 `onSend(example)`로 일반 TEXT 답변 전송(요청마다 새 `clientMessageId`)

## 화면별 UI 규칙

- **배경**: 회고 진행 화면(intro/start)은 `bg-retro-fade`(위→아래 그라데이션), 채팅 입력창(`RetroTextarea`)은 `bg-retro-fade-x`(왼→오른쪽). **결과 화면(`retrospect/result.vue`)은 그라데이션 금지** — 단색 `bg-background`
- **배지 획득 배너** (`UiBadgeAcquiredPopup` + `useBadgeAcquired`): 회고 저장 후 새 배지가 있으면 화면 **상단** 토스트 배너로 노출하고 **1.5초 뒤 자동으로 닫힘**(탭하면 즉시). 하단의 저장 완료 토스트와 겹치지 않게 상단에 둔다. 여러 개면 큐로 순차 노출, 홈의 미션 팝업이 떠 있는 동안은 보류(`setHold`) 후 해제 시점부터 다시 1.5초
- **회고 목록 요약** (`retrospects/index.vue`): 제목 아래 `summary`를 2줄까지(`line-clamp-2`) 표시. 비어 있으면 "회고 요약이 없습니다"를 연한 색(`text-grey-7`)으로 표시 — 전체 목록·캘린더 날짜별 목록 공통

## 분석 (Amplitude)

- 이벤트 추적은 `app/composables/useAmplitude.ts`의 `track()` / `identify()` / `reset()` 사용
- **이벤트 정의서**: `docs/amplitude-events.md` (비개발자 공유용 `docs/amplitude-events.html` 동봉)
- **이벤트를 추가·삭제하거나 프로퍼티를 바꾸면 `docs/amplitude-events.md`와 `.html`을 반드시 함께 갱신**
  - `track()` 변경 시 정의서 갱신을 강제하는 pre-commit 훅이 있음 (`.githooks/pre-commit`)
  - 레포 클론 후 1회 설정 필요: `git config core.hooksPath .githooks`
- 이벤트명은 `object_action` snake_case, 프로퍼티명도 snake_case
- 개발 환경(dev)에서는 전송 안 됨 (`app/plugins/amplitude.client.ts`) — 검증은 프로덕션에서

## 작업 흐름 (SDD)

1. 새 기능 전 `.specs/requirements-{slug}.md` 작성 (`/discover` 커맨드)
2. 요구사항 → `.specs/{번호}-{slug}.md` 구현 스펙 변환 (`/plan` 커맨드)
3. 스펙 승인 후 구현
4. 구현 후 코드 리뷰 (`/review` 커맨드)

## 디자인 시스템

- 디자인 관련 작업(UI 컴포넌트 수정·신규 추가, 피그마 MCP 연동) 시 **반드시 `DESIGN.md` 먼저 참고**
- 컬러는 `app/utils/colors.ts` 토큰만 사용 — 임의 HEX 금지
- 타이포그래피는 `main.css`에 정의된 스케일(`text-title*`, `text-body*` 등)만 사용
- UI 컴포넌트는 `app/components/ui/`의 기존 컴포넌트를 우선 재사용

## 절대 금지 사항

- `.env` 파일 git 커밋
- `main` 브랜치 직접 푸시
- 비목표 기능 임의 추가
- 영어 주석 / 영어 커밋 메시지
- 디자인 토큰 무시하고 임의 HEX 색상 직접 사용

## 디렉터리 구조

```
didit-frontend/
├── CLAUDE.md
├── .specs/
├── .claude/commands/
├── nuxt.config.ts
├── tailwind.config.ts
├── app/
│   ├── app.vue
│   ├── assets/css/main.css
│   ├── components/
│   │   ├── ui/         # 공통 UI (버튼, 인풋, 카드 등)
│   │   └── layout/     # 헤더, 탭바, 바텀시트 등
│   ├── composables/    # use*.ts
│   ├── layouts/        # default.vue, auth.vue
│   ├── middleware/     # auth.ts
│   ├── pages/          # 파일 기반 라우팅
│   ├── plugins/        # axios.ts, vue-query.ts
│   ├── stores/         # pinia (auth.ts)
│   ├── types/          # api.ts
│   └── utils/          # axios.ts
└── public/
```

## 환경 변수

```
NUXT_PUBLIC_API_BASE=https://api.didit.ai.kr
```

## 자주 쓰는 명령어

```bash
npm run dev       # 개발 서버 (http://localhost:3000)
npm run build     # 프로덕션 빌드
npm run generate  # 정적 빌드 (Capacitor용)
```

## 커밋 컨벤션

- Conventional Commits + 한국어
- 예: `feat(auth): 카카오 로그인 페이지 추가`
- 예: `fix(retrospect): 답변 제출 후 질문 갱신 안 되는 버그 수정`
