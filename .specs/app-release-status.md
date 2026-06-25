# 앱 출시 진행 상태 / 남은 일 (핸드오프)

> didit 앱(Android 우선) 패키징·네이티브 로그인·CI/CD 작업 현황. 새 세션에서 이어갈 때 이 문서부터 읽기.
> 최종 업데이트: 2026-06-25

---

## ✅ 완료된 것

### 패키징 / 네이티브 로그인
- **Capacitor 7** 패키징 (Android). Nuxt 정적빌드(`.output/public`)를 WebView로 감쌈.
- **네이티브 소셜 로그인** — 플랫폼 분기(`Capacitor.isNativePlatform()`):
  - 구글: `@capgo/capacitor-social-login` (webClientId 사용 → id_token)
  - 카카오: `@team-lepisode/capacitor-kakao-login` (네이티브 앱키 → access token)
  - 웹: 기존 GIS/redirect 그대로
- **버튼 노출**: 안드로이드=구글·카카오 / 웹·iOS=구글·카카오·애플 (`showApple = platform !== 'android'`)
- **CapacitorHttp 활성화** (`capacitor.config.ts`) → WebView origin(`https://localhost`) CORS 우회. **이게 없으면 모든 API 호출 막힘.**
- 백엔드/웹 **코드 변경 없음** — 네이티브가 같은 토큰(구글 id_token / 카카오 access token)을 같은 `/api/v1/auth/login`에 넘김.
- **fix**: 로그아웃 시 `useState('user:profile')` 캐시 미삭제로 다른 계정 닉네임 남던 버그 수정 (`stores/auth.ts`).
- ✅ **에뮬레이터에서 카카오 로그인 성공 확인** (토큰→백엔드→홈 이동).

### CI/CD (GitHub Actions, 백엔드와 동일 패턴)
- `.github/workflows/develop.yaml` → develop push 시 **AAB 빌드 → Play 내부테스트(internal) 트랙** 업로드(completed)
- `.github/workflows/main.yaml` → main push 시 **AAB 빌드 → Play 프로덕션 트랙 draft** 업로드(수동 출시)
- `versionCode` = `git rev-list --count HEAD` 자동 증가
- Play 업로드 step은 `PLAY_SERVICE_ACCOUNT_JSON` 시크릿 없으면 **스킵**(빌드만 검증) → CI 초록 유지
- env·키스토어는 **GitHub Secrets 주입** 방식 (`.github/workflows/SETUP.md` 참고)
- ✅ `build-web`·`build-app`(AAB 빌드) 모두 CI 통과 확인. Play 업로드만 시크릿 대기로 스킵.

### 버전 자동화 (release-please) — 작동 확인됨
- `.github/workflows/release-please.yaml` + `release-please-config.json` + `.release-please-manifest.json`
- main 푸시 시 Conventional Commits 분석 → 릴리스 PR 자동 생성(버전 bump + CHANGELOG)
- ⚠️ **조직 설정 필요했음**: ddiddit Org → Actions → "Allow GitHub Actions to create and approve pull requests" (이미 켬)
- 현재 릴리스 PR **#40 (release 1.2.0)** 열림 — 출시 직전 머지

### 앱 버전 동적 표시
- `@capacitor/app` + `useAppVersion()` 컴포저블 → 마이페이지 "앱 버전"이 네이티브 빌드 버전(앱)/package.json(웹) 자동 표시. (하드코딩 제거)

### GitHub Secrets (등록 완료)
- `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`
- `ENV_STAGING` (= `.env`, **dev-api 호출**), `ENV_PRODUCTION` (= `.env.production`, 운영)

### Git
- develop·main 모두 머지 완료 (PR #38).

---

## ⏳ 남은 일 (본인인증 완료 후 진행)

### 🔴 본인인증(개발자 계정) 승인 대기 — 이게 다음 관문
- play.google.com/console → 주소 증빙 검토 며칠 소요. 완료돼야 아래 진행 가능.

### Play Console (인증 후)
1. **앱 생성** (패키지명 `kr.ai.didit`)
2. **Play Developer API 서비스계정 JSON** 발급 → GitHub Secret `PLAY_SERVICE_ACCOUNT_JSON` 등록
   - Google Cloud IAM에서 서비스계정+키 생성 → Play Console 설정 → API 액세스에서 권한 부여
3. **첫 AAB 수동 업로드 1회** (앱 생성 위해)
4. **비공개 테스트(closed) 트랙 + 테스터 12명 등록** → 14일 게이트 시작
   - 테스터는 **실제 지인 12명**(자작계정/에뮬로 채우면 승인 거부 위험)
5. **릴리스 SHA-1·키해시 추가 등록** (지금은 디버그만):
   - 구글(Firebase/Cloud): 릴리스 SHA-1 `8F:5E:39:75:52:A7:C5:FB:92:EF:04:65:3E:20:43:ED:8D:C0:CB:3A` + **Play 앱서명 SHA-1**(출시 후 Play Console에서 확인)
   - 카카오: 릴리스 키해시 `j145dVKnxfuS7wRlPiBD7Y3Ayzo=` + Play 앱서명 키해시

### Vercel (웹) — ✅ 확인 완료
- Vercel Node 버전 **24** 확인됨 → `engines >=22` 충족, **손댈 것 없음**. (웹 동작은 그대로 — 네이티브 분기는 앱에서만)

### iOS (추후)
- **CocoaPods 설치** 후 `npx cap add ios`로 Cap7 iOS 재생성 (지금 레포에 iOS 없음 — Cap6 제거됨)
- iOS 네이티브 로그인 설정 (애플 클라이언트ID, 카카오 iOS 스킴 등)
- **기존 iOS 앱(법인 소유, 번들 `com.swyp.didit`)을 개인 계정으로 App Transfer** → 같은 번들로 Capacitor 빌드 업데이트
  - 개인 애플 개발자 프로그램($99/년) 필요, 업체에 Transfer 가능여부+시작 요청

---

## 🏷 버전 & 번들 전략 (확정)

### 버전: **1.2.0**
- **이번 개편 릴리스 = 1.2.0** (이전 1.1.0 → 1.2.0). 웹·Android·iOS 모두 1.2.0으로 통일.
- **release-please**가 main 푸시 시 버전 bump + CHANGELOG 자동 생성.
  - 1.2.0은 `Release-As: 1.2.0` 커밋으로 강제 지정함.
  - 현재 릴리스 PR(**#40, "release 1.2.0"**)이 열려 있음 → **실제 출시 직전에 머지**하면 버전 확정 (지금 머지 ❌).
  - release-please는 **main 기준** (develop→main 머지된 feat/fix 커밋으로 판단).
- `versionCode`는 CI 자동(커밋 수). UI "앱 버전" 표시는 `@capacitor/app`로 동적(앱=네이티브/웹=package.json).

### 번들 ID (플랫폼별 다름 — 정상)
| 플랫폼 | 번들 ID | 비고 |
|---|---|---|
| **Android** | `kr.ai.didit` | 신규 앱. 카카오·구글·Firebase·키스토어·CI 전부 이걸로 등록 완료 → **그대로 유지** |
| **iOS** | `com.swyp.didit` | 기존 앱(법인) 이전·업데이트용. iOS 빌드 시 Xcode 번들을 이걸로 설정 |
- 두 플랫폼 번들이 **달라도 무방**. `capacitor.config.ts` appId는 Android(`kr.ai.didit`) 기준, iOS는 네이티브에서 `com.swyp.didit`로 오버라이드.
- ⚠️ iOS 이전·출시는 **개인 Apple Developer Program($99/년) 가입 필수** (무료 계정으론 출시·이전 불가).

## 📌 참고 정보 (시크릿 아님)

| 항목 | 값 |
|---|---|
| Android 패키지명 / appId | `kr.ai.didit` |
| 기존 iOS 앱 번들 (법인, 이전 대상) | `com.swyp.didit` |
| 키스토어 파일 | `android/didit-upload.keystore` (gitignore) · alias `didit` · **비번은 별도 백업/시크릿** |
| 카카오 네이티브 앱키 | `a2d60240a516c8296d6506cad6ae841b` (스킴 `kakaoa2d60240...://oauth`) |
| 구글 Web 클라이언트(serverClientId) | `370858550739-3cruekemk0a3e81btv6vn9mn7vurtcqq.apps.googleusercontent.com` |
| 구글 Android OAuth 클라이언트 | 생성됨 (Firebase 프로젝트 `didit-bd2f1`) |
| 디버그 SHA-1 / 카카오 키해시 | `8C:93:C0:A9:56:C4:CA:33:22:55:CA:78:87:4D:D1:1F:09:30:CE:34` / `jJPAqVbEyjMiVcp4h03RHwkwzjQ=` |
| 릴리스 SHA-1 / 카카오 키해시 | `8F:5E:39:75:52:A7:C5:FB:92:EF:04:65:3E:20:43:ED:8D:C0:CB:3A` / `j145dVKnxfuS7wRlPiBD7Y3Ayzo=` |

## 🛠 로컬 빌드/테스트 환경 (이 맥에 설치됨)
- Android Studio, cmdline-tools, SDK 34·35, build-tools 34·35, JBR JDK 21
- Node 22 (`.nvmrc`), 빌드 시 `nvm use 22` 필요
- 에뮬레이터 AVD: **`didit_test`** (android-34 google_apis_playstore, arm64)
- iOS용 CocoaPods·풀 Xcode 미설치

### 자주 쓰는 명령
```bash
nvm use 22
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="/opt/homebrew/share/android-commandlinetools"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

npm run cap:sync        # dev-api(.env)로 웹빌드+동기화
npm run cap:sync:prod   # 운영(.env.production)으로
cd android && ./gradlew assembleDebug   # 디버그 APK
cd android && ./gradlew bundleRelease   # 서명 AAB (keystore.properties 필요)

emulator -avd didit_test                # 에뮬 실행
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n kr.ai.didit/.MainActivity
```
