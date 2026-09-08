# didit 프론트엔드

AI 기반 회고(retrospective) 앱 **didit**의 프론트엔드 레포입니다.
백엔드 API(`https://api.didit.ai.kr`)와 연동하며, Nuxt 웹을 Capacitor로 감싸 iOS/Android 앱으로 패키징합니다.

- **단계**: 웹 MVP 개발 중
- **개발자**: 1인 사이드 프로젝트
- **디자인 컨셉**: 모바일 우선, 미니멀

## 플랫폼 전략

제품의 실체는 **네이티브 앱**(Capacitor)입니다. 공개 도메인 루트(`/`)는 소개 + 다운로드/베타 신청용 **랜딩 페이지**이고, 일반 사용자에게 웹 버전을 제품으로 노출하지 않습니다.

- **결제**: 앱 IAP 전용 — 웹에는 구독 결제를 노출하지 않습니다.
- **QA**: 운영 앱 도메인(프로덕션 빌드 + 운영 API)에서 UI·로직 QA, TestFlight(iOS)/구글플레이 내부테스트에서 결제·푸시 등 네이티브 실동작 QA를 진행합니다.

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

## 기술 스택

- **Nuxt 4** (Vue 3)
- **TypeScript** (strict 모드)
- **Tailwind CSS** (모바일 우선)
- **Pinia** — 전역 상태 (인증)
- **@tanstack/vue-query** — API 호출 · 캐싱
- **axios** — HTTP 클라이언트 (JWT 인터셉터 포함)
- **@vueuse/core** — 유틸 컴포저블
- **@nuxt/icon** — 아이콘
- **Capacitor** — iOS/AOS 패키징

## 시작하기

### 요구 사항

- Node.js 22 이상

### 환경 변수

레포 루트에 `.env`를 만들고 아래 값을 채워주세요.

```
NUXT_PUBLIC_API_BASE=https://api.didit.ai.kr
```

### 설치 및 실행

```bash
npm install
npm run dev       # 개발 서버 (http://localhost:3000)
```

### 빌드

```bash
npm run build     # 프로덕션 빌드
npm run generate  # 정적 빌드 (Capacitor용)
```

### Git hooks

Amplitude 이벤트 정의서 동기화를 강제하는 pre-commit 훅이 있습니다. 클론 후 1회 설정해주세요.

```bash
git config core.hooksPath .githooks
```

## 회고 진행 플로우 (V2 대화 API)

회고 진행 화면은 채팅형 UI로 구현되어 있고(`app/pages/retrospect/start.vue`, `app/components/layout/RetroTextarea.vue`), 질문이 타이핑 애니메이션으로 노출되며 텍스트/음성(STT)으로 답변합니다.

- 회고 **시작·답변 제출·대화 조회·대화 종료는 V2 API**(`/api/v2/retrospectives/...`)를 사용합니다. 음성 답변/STT/심화질문 조회/완료(결과 생성)는 아직 V1 API를 그대로 사용합니다 (`app/composables/useRetrospect.ts` 참고).
- 답변 제출(`POST /api/v2/retrospectives/{id}/messages`)의 `clientMessageId`는 요청마다 고유해야 하는 멱등키입니다.
- 대화 조회(`GET /api/v2/retrospectives/{id}/conversation`)는 AI 메시지만 내려주므로, 재진입 시 "가장 마지막 질문"만 복구합니다.
- 대화 종료(`POST /api/v2/retrospectives/{id}/finish`)는 결과 생성과 분리된 API입니다.
- 진행 중인 회고 id는 `localStorage`(`ACTIVE_RETROSPECTIVE_KEY`)에 보관해, 답변 도중 화면을 나갔다 들어와도 이어서 진행할 수 있습니다.

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

## 코딩 컨벤션

- 주석은 한국어, 변수·함수명은 영어 camelCase, 컴포넌트명은 PascalCase, 파일명은 kebab-case
- `any` 타입 금지
- `<script setup lang="ts">`만 사용, Composable은 `use` 접두사
- 컬러는 `app/utils/colors.ts` 토큰만 사용 (임의 HEX 금지)
- 자세한 규칙과 작업 흐름은 [`CLAUDE.md`](./CLAUDE.md), 디자인 규칙은 `DESIGN.md`를 참고하세요.

## 커밋 컨벤션

Conventional Commits + 한국어를 사용합니다.

```
feat(auth): 카카오 로그인 페이지 추가
fix(retrospect): 답변 제출 후 질문 갱신 안 되는 버그 수정
```

## 절대 금지 사항

- `.env` 파일 git 커밋
- `main` 브랜치 직접 푸시
- 비목표 기능(어드민 페이지, 인앱 소셜 피드, 다국어, SSR) 임의 추가
- 디자인 토큰 무시하고 임의 HEX 색상 직접 사용
