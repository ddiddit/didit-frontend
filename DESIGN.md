# didit 디자인 시스템

> 피그마 디자인 토큰을 기반으로 구성된 디자인 시스템 문서.
> 디자인 수정 또는 피그마 MCP 연동 작업 시 **반드시** 이 문서를 먼저 참고할 것.

---

## 1. 컬러 토큰

단일 소스: `app/utils/colors.ts` → `tailwind.config.ts`에서 Tailwind 클래스로 등록

### Primary (Green 팔레트)

| Tailwind 클래스         | 피그마 토큰        | HEX값      |
|------------------------|-------------------|------------|
| `bg-green-light`       | Primary/10        | `#ECFBF5`  |
| `bg-green-light-hover` | Primary/20        | `#E2FAF0`  |
| `bg-green-light-active`| Primary/30        | `#C3F4DF`  |
| `bg-primary` / `bg-green` | Primary/50    | `#3DDB99`  |
| `bg-green-hover`       | Primary/55        | `#37C58A`  |
| `bg-green-active`      | Primary/60        | `#31AF7A`  |
| `bg-green-dark`        | Primary/70        | `#2EA473`  |
| `bg-green-dark-hover`  | Primary/80        | `#25835C`  |
| `bg-green-dark-active` | Primary/90        | `#1B6345`  |
| `bg-green-darker`      | Primary/95        | `#154D36`  |

### Neutral (Grey 팔레트)

숫자가 클수록 어두움. `grey-1` = 흰색, `grey-13` = 거의 검정.

| Tailwind 클래스 | 피그마 토큰    | HEX값      | 용도             |
|----------------|--------------|------------|-----------------|
| `grey-1`       | Neutral/0    | `#FFFFFF`  | surface (흰배경) |
| `grey-2`       | Neutral/5    | `#FDFDFD`  |                 |
| `grey-3`       | Neutral/10   | `#F6F6F6`  | 인풋 배경        |
| `grey-4`       | Neutral/20   | `#F1F1F1`  | disabled 배경    |
| `grey-5`       | Neutral/30   | `#E6E6E6`  | 보더, 구분선     |
| `grey-6`       | Neutral/40   | `#C6C6C6`  | placeholder, 비활성 아이콘 |
| `grey-7`       | Neutral/50   | `#989898`  | 힌트 텍스트, 탭바 비활성 |
| `grey-8`       | Neutral/60   | `#6A6A6A`  | 보조 텍스트      |
| `grey-9`       | Neutral/70   | `#575757`  |                 |
| `grey-10`      | Neutral/80   | `#3C3C3C`  | 토스트 배경      |
| `grey-11`      | Neutral/90   | `#353535`  |                 |
| `grey-12`      | Neutral/95   | `#2B2B2B`  |                 |
| `grey-13`      | Neutral/100  | `#191919`  | 본문 텍스트 (기본) |

편의 별칭:
- `surface` = `grey-1` (`#FFFFFF`)
- `background` = `grey-3` (`#F6F6F6`)

### System 팔레트

| Tailwind 클래스    | HEX값      | 용도            |
|-------------------|------------|----------------|
| `bg-danger` / `text-danger` (`danger-60`) | `#F73838` | 에러, 위험 동작  |
| `bg-danger-50` / `text-danger-50`         | `#FF5C5C` | 에러 (밝은 톤)  |
| `bg-accent` / `text-accent`               | `#FF6E58` | 강조 포인트     |
| `text-error` / `border-error`             | `#F73838` | 폼 에러 상태    |

### Tag 팔레트

태그 컴포넌트(`UiTag`)에서만 사용. 색상 + 라이트 배경 쌍으로 구성.

| 색상 이름      | 텍스트 (`text-tag-*`)  | 배경 (`bg-tag-*-light`) |
|--------------|----------------------|------------------------|
| red          | `#F06C6C`            | `#FDECEC`              |
| orange       | `#F08A5D`            | `#FDEDE7`              |
| yellow       | `#DEAD3A`            | `#FAF3E1`              |
| leaf-green   | `#77C767`            | `#EBF7E8`              |
| green        | `#37C58A`            | `#E2FAF0`              |
| sky-blue     | `#65ABE0`            | `#E8F2FA`              |
| blue         | `#5A8DEE`            | `#E6EEFC`              |
| purple       | `#8C7CF0`            | `#EEEBFD`              |
| pink         | `#E079E0`            | `#FAEBFA`              |
| brown        | `#C78B5C`            | `#F7EEE7`              |

---

## 2. 타이포그래피

폰트: **Pretendard** (기본). 모든 스타일 `letter-spacing: -0.02em` 공통.

| 클래스                 | 크기   | line-height | 주 사용처             |
|-----------------------|--------|-------------|----------------------|
| `text-title1`         | 28px   | 1.38        | 주요 타이틀           |
| `text-title2`         | 24px   | 1.40        |                      |
| `text-title3`         | 22px   | 1.40        |                      |
| `text-heading1`       | 20px   | 1.40        | 섹션 헤딩             |
| `text-heading2`       | 18px   | 1.40        |                      |
| `text-body1`          | 17px   | 1.50        | 본문                  |
| `text-body1-reading`  | 17px   | 1.60        | 긴 본문 (읽기용)      |
| `text-body2`          | 16px   | 1.50        | 버튼(lg), 일반 텍스트 |
| `text-body2-reading`  | 16px   | 1.60        |                      |
| `text-body3`          | 15px   | 1.50        | 버튼(md), 인풋 값     |
| `text-body3-reading`  | 15px   | 1.60        |                      |
| `text-label1`         | 14px   | 1.40        | 인풋 라벨, 토스트     |
| `text-label1-reading` | 14px   | 1.60        |                      |
| `text-label2`         | 13px   | 1.40        |                      |
| `text-label2-reading` | 13px   | 1.50        |                      |
| `text-caption1`       | 12px   | 1.36        | 힌트, 카운터, 탭바 라벨 |
| `text-caption2`       | 11px   | 1.30        | 태그 텍스트           |

굵기는 클래스 조합으로: `font-bold` / `font-semibold` / `font-medium` / `font-normal`

---

## 3. 간격 · 레이아웃

| 항목                  | 값                               |
|----------------------|----------------------------------|
| 최대 너비 (모바일)    | `max-w-mobile` = 390px           |
| 컨테이너              | `mobile-container` (mx-auto + max-w-mobile) |
| 하단 안전 영역        | `.safe-bottom` = `max(50px, safe-area-inset-bottom)` |
| 상단 안전 영역        | `.safe-top` = `env(safe-area-inset-top)` |
| 화면 브레이크포인트   | `xs: 375px`, `sm: 390px`, `desktop: 980px` |
| 좌우 기본 패딩        | `px-4` (16px)                    |
| 섹션 간격             | `gap-4` ~ `gap-6` 상황에 따라    |

---

## 4. 테두리 · 그림자 · 반경

| 항목             | 값                                |
|-----------------|----------------------------------|
| `rounded-xl`    | 12px — 버튼, 인풋, 토스트         |
| `rounded-2xl`   | 16px — 팝업, 카드                 |
| `rounded-3xl`   | 24px — 바텀시트                   |
| `rounded-full`  | 원형 — 토글, 체크박스(라디오)      |
| `shadow-card`   | `0 2px 12px rgba(0,0,0,0.06)`    |
| `shadow-bottom` | `0 -2px 12px rgba(0,0,0,0.06)`   |

---

## 5. UI 컴포넌트

### UiButton

경로: `app/components/ui/UiButton.vue`

| prop      | 타입                                        | 기본값      |
|-----------|---------------------------------------------|------------|
| `variant` | `'primary'` \| `'secondary'` \| `'chip'` \| `'ghost'` | `'primary'` |
| `size`    | `'lg'` \| `'md'` \| `'sm'`                 | `'lg'`     |
| `justify` | `'center'` \| `'start'`                    | `'center'` |
| `disabled`| boolean                                     | false      |
| `loading` | boolean                                     | false      |
| `active`  | boolean (secondary·chip에서 활성 토글)      | false      |
| `muted`   | boolean (chip 비활성화 스타일)              | false      |

**variant별 스타일:**

- `primary`: `bg-primary text-grey-13 font-semibold` / 비활성: `bg-grey-5 text-grey-6`
- `secondary`: 기본 `bg-grey-3 border-transparent` / active `bg-green-light border border-primary`
- `chip`: 기본 `bg-white border-grey-5` / active `bg-green-light border border-primary font-bold` / muted `text-grey-6`
- `ghost`: `bg-transparent text-primary underline font-medium`

**size별 스타일:**

- `lg`: `w-full h-14(56px) px-4 text-body2`
- `md`: `w-full h-[50px] px-4 text-body3`
- `sm`: `px-4 h-8(32px) text-[14px]`

---

### UiTextInput

경로: `app/components/ui/UiTextInput.vue`

| prop          | 타입    | 기본값  |
|---------------|---------|--------|
| `modelValue`  | string  | —      |
| `label`       | string  | —      |
| `placeholder` | string  | —      |
| `maxlength`   | number  | —      |
| `hint`        | string  | —      |
| `error`       | string  | —      |
| `success`     | boolean | false  |
| `clearable`   | boolean | false  |
| `showCount`   | boolean | true   |
| `disabled`    | boolean | false  |

**상태별 컨테이너 스타일:**

| 상태      | 배경       | 보더           |
|----------|-----------|---------------|
| 기본      | `bg-grey-3` | `border-transparent` |
| 포커스    | `bg-grey-3` | `border-primary`     |
| 에러      | `bg-grey-3` | `border-error`       |
| disabled  | `bg-grey-4` | `border-transparent` |

높이: 56px, 반경: `rounded-xl`

---

### UiTag

경로: `app/components/ui/UiTag.vue`

색상 10종: `green` `pink` `blue` `orange` `purple` `yellow` `red` `leaf-green` `sky-blue` `brown`

스타일: `rounded-[6px]` / `text-[11px] font-semibold` / padding `4px 6px`

---

### UiToggle

경로: `app/components/ui/UiToggle.vue`

- 크기: `w-10 h-6` (40×24px), 썸: `w-4 h-4`
- ON: `bg-primary`, OFF: `bg-grey-5`
- `v-model` 사용

---

### UiCheckbox

경로: `app/components/ui/UiCheckbox.vue`

| variant  | 크기       | ON 스타일                  | OFF 스타일                 |
|----------|-----------|---------------------------|--------------------------|
| `check`  | 24×24px   | `text-primary` (체크 아이콘) | `text-grey-6`           |
| `radio`  | 20×20px   | `bg-primary` + 흰 점      | `border-2 border-grey-5` |

---

### UiPopup

경로: `app/components/ui/UiPopup.vue`

| prop             | 기본값      | 설명                    |
|-----------------|------------|------------------------|
| `modelValue`    | —          | 표시 여부               |
| `title`         | —          | 제목 (17px semibold)    |
| `description`   | —          | 본문 (14px, grey-8)    |
| `confirmText`   | `'확인'`   |                        |
| `cancelText`    | `'취소'`   |                        |
| `variant`       | `'confirm'`| `'confirm'` \| `'destructive'` |
| `showCancel`    | true       |                        |
| `loading`       | false      |                        |
| `closeOnBackdrop` | true     |                        |

- 너비: `max-w-[300px]`, 반경: `rounded-2xl`
- `destructive`: 확인 버튼 `bg-danger-50 text-grey-1`
- 배경 딤: `bg-black/40`
- 애니메이션: `opacity` 0.2s/0.15s

---

### UiToast

경로: `app/components/ui/UiToast.vue`

- `useToast()` composable로 제어
- 위치: 하단 탭바 위 12px (`bottom-[calc(safe-bottom+12px)]`)
- 배경: `bg-grey-10 rounded-xl px-4 py-3`
- 텍스트: 14px normal `text-grey-1`
- 아이콘: `gridicons:notice-outline`
- 애니메이션: `opacity + translateY(8px)` 0.2s

---

### UiProgressBar

경로: `app/components/ui/UiProgressBar.vue`

- 높이: `h-1` (4px), 반경: `rounded-full`
- 완료: `bg-primary`, 미완료: `bg-grey-4`
- props: `current` (현재 단계), `total` (전체 단계, 기본 3)
- 간격: `gap-1.5`

---

### UiScrollPicker

경로: `app/components/ui/UiScrollPicker.vue`

드럼롤 형태의 스크롤 피커. 시간/날짜 선택 등에 사용.

- props: `modelValue`, `items`, `rowH` (기본 27px), `visibleRows` (기본 7), `width` (기본 72px), `loop`
- 선택된 항목: `text-grey-13 font-semibold`, 비선택: `text-grey-6`
- 3D 원통형 효과 (rotateX + perspective)
- 상하 마스크: 그라데이션 페이드

---

### UiBadgeAcquiredPopup

경로: `app/components/ui/UiBadgeAcquiredPopup.vue`

- `useBadgeAcquired()` composable로 제어
- 배지 이미지 크기: `164×120px`
- 팝업 크기: `300px 너비`, padding `30px 20px 36px`
- 애니메이션: `opacity + scale(0.92)` 0.25s/0.2s

---

## 6. 레이아웃 컴포넌트

### BottomTabBar

경로: `app/components/layout/BottomTabBar.vue`

- 탭: 홈(`/home`), 회고기록(`/retrospects`), 마이(`/my`)
- 배경: `bg-white`, 상단 보더: `1px solid #E8E8E8`
- 아이콘: 24×24px SVG
- 라벨: `text-caption1 font-bold`
- 활성: `text-grey-13`, 비활성: `text-grey-7`
- 하단 패딩: `max(28px, safe-area-inset-bottom)`

---

## 7. 애니메이션 / 전환

| 컴포넌트       | 애니메이션                          | 시간                |
|--------------|-----------------------------------|---------------------|
| UiPopup      | opacity fade                      | 진입 0.2s / 이탈 0.15s |
| UiToast      | opacity + translateY(8px)         | 진입 0.2s / 이탈 0.2s  |
| UiBadgeAcquiredPopup | opacity + scale(0.92)   | 진입 0.25s / 이탈 0.2s |
| UiButton     | `transition-colors duration-150`  | 150ms               |
| UiToggle     | `transition-colors duration-200`  | 200ms               |
| UiProgressBar| `transition-colors duration-300`  | 300ms               |

---

## 8. 아이콘

- 라이브러리: `@nuxt/icon`
- 주 사용 아이콘셋: `gridicons`, `heroicons`, `mdi`
- 탭바 아이콘: `public/icons/` 경로의 SVG 파일

---

## 9. 유틸리티 클래스

| 클래스             | 용도                              |
|-------------------|----------------------------------|
| `mobile-container` | 중앙 정렬 + max-width 390px       |
| `safe-bottom`      | 탭바 위 안전 영역 패딩             |
| `safe-top`         | 상태바 안전 영역 패딩              |
| `scrollbar-hide`   | 스크롤바 숨김 (스크롤 기능 유지)   |

---

## 10. 작업 규칙

1. 새 컬러 추가 시 → `app/utils/colors.ts`에 먼저 정의 후 `tailwind.config.ts`에 등록
2. 타이포그래피 스케일 신규 추가 금지 — 기존 클래스 재사용
3. 피그마 MCP 연동 작업 시 이 문서의 토큰 이름과 매핑 확인 후 적용
4. `any` 타입 사용 금지, 컴포넌트 props는 항상 interface로 정의
5. 인라인 스타일은 Tailwind로 표현 불가한 경우에만 최소한으로 사용
