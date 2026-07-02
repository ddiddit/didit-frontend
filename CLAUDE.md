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

### 인증

- `app/middleware/auth.ts` — 보호 라우트 (CSR only)
- 페이지에서 `definePageMeta({ middleware: 'auth' })` 로 적용

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
