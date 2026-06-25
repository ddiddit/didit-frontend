# 버저닝 정책 (Versioning)

didit 앱/웹의 버전 관리 규칙. 릴리스할 때 이 문서를 기준으로 버전을 올린다.

## 1. SemVer (`MAJOR.MINOR.PATCH`)

| 자리 | 올리는 경우 | 예 |
|---|---|---|
| **MAJOR** | 대규모 개편 · 호환 깨짐 | 1.4.2 → 2.0.0 |
| **MINOR** | 새 기능 추가(하위호환) | 1.0.0 → 1.1.0 |
| **PATCH** | 버그 수정 · 소소한 개선 | 1.1.0 → 1.1.1 |

- 윗자리 올리면 아랫자리는 0으로 리셋 (1.4.2 → 1.5.0)
- 한 번 나간 번호는 재사용 안 함(증가만)

## 2. 두 종류의 버전 — 헷갈리지 말 것

| 종류 | 무엇 | 어디서 정함 |
|---|---|---|
| **versionName** (마케팅 버전, `1.1.0`) | 사람이 보는 버전 | 본인이 SemVer로 결정 |
| **versionCode / build number** (정수) | 스토어 내부 식별 | **CI 자동 증가** (`git rev-list --count HEAD`) |

- **versionName** = SemVer 규칙으로 사람이 정함.
- **versionCode** = 의미 없는 증가 숫자. 매 빌드 +1만 되면 됨 → CI가 자동 처리.

## 3. 플랫폼 버전 전략 (독립 트랙)

각 스토어는 버전을 **독립적으로** 관리한다. 같을 필요 없음.

- **Android (구글, 첫 출시)**: `versionName 1.0.0` 부터 시작 (`android/app/build.gradle`)
- **iOS (애플, 업데이트)**: 기존 `1.0.2` → `1.1.0` (RN→Capacitor 교체 반영, App Store Connect)
- **원칙**:
  - **기능 출시(MINOR/MAJOR)** → 두 플랫폼 같이 올림(정렬)
  - **한쪽 핫픽스(PATCH)** → 그쪽만 올림 → 잠시 어긋나도 정상. 다음 기능 출시에서 재정렬.
- **iOS 업데이트는 반드시 직전 App Store 버전보다 높아야** 함.

## 4. 화면에 표시되는 버전 (단일 소스, 자동)

마이페이지 "앱 버전"은 **하드코딩하지 않는다**. (`useAppVersion()` 컴포저블)

- **앱(네이티브)**: `@capacitor/app`의 `App.getInfo().version` → 빌드된 versionName을 동적 표시 (안드 1.0.0 / iOS 1.1.0 자동)
- **웹**: `package.json`의 `version`(`runtimeConfig.public.appVersion`)을 fallback 표시

→ 릴리스마다 화면 버전을 손으로 고칠 필요 없음. 플랫폼별 실제 버전이 자동으로 뜸.

## 5. 릴리스할 때 하는 일

1. **package.json `version`** 갱신 (웹 표시 + 기준값)
2. **Android**: `android/app/build.gradle`의 `versionName` 갱신
   - `versionCode`는 CI가 자동(커밋 수). 로컬 빌드는 1.
3. **iOS**: Xcode/App Store Connect의 Version 갱신 (build number는 직전보다 높게)
4. develop/main 머지 → CI가 빌드·업로드 (`.github/workflows`)

## 6. (예정) 자동화 — Conventional Commits 기반

현재 커밋이 이미 Conventional Commits(`feat:`/`fix:`/`chore:`) 형식이므로, 아래 자동화 도입 가능:

- **release-please** (GitHub Action): main 푸시 시 커밋 기록을 분석해
  - **버전 자동 bump** (feat→MINOR, fix→PATCH, BREAKING→MAJOR)
  - **CHANGELOG.md 자동 생성** + 릴리스 PR 생성 → 머지하면 태그
- 그 CHANGELOG가 곧 **스토어 "새로운 소식(릴리스 노트)"** 소스가 됨.

## 7. (예정) 스토어 메타데이터 자동화 — Fastlane

스토어 등록정보(릴리스 노트·스크린샷·이름·설명·메타데이터)를 **repo 파일로 관리 → CI 자동 업로드** 가능:

- **iOS**: `fastlane deliver` — `fastlane/metadata/`(텍스트), `fastlane/screenshots/`(이미지)
- **Android**: `fastlane supply` — `fastlane/metadata/android/`(제목·설명·changelog·스크린샷)
- **자동 가능**: 릴리스 노트, 설명, 키워드, 카테고리, 스크린샷, 아이콘(Play 512)
- **수동/일회성**: 연령등급 설문, 가격, 첫 심사, 제공자(개발자) 이름(계정 단위)
- 스크린샷 이미지는 디자인 산출물이지만, Fastlane `snapshot`(iOS)/`screengrab`(AOS)로 UI에서 자동 캡처도 가능.
