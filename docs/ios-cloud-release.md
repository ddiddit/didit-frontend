# DIDIT iOS 클라우드 빌드·배포

Windows에서는 Xcode를 직접 실행하지 않는다. GitHub Actions의 macOS 26 러너가 iOS 프로젝트가 빌드되는지 검증하고, Codemagic이 Xcode 26 이상의 안정 버전으로 App Store용 서명과 TestFlight 업로드를 담당한다.

## 현재 저장소에 포함된 설정

- Capacitor iOS 프로젝트 (`com.swyp.didit`)
- Firebase Cloud Messaging 네이티브 토큰 등록과 알림 열기 처리
- Firebase Crashlytics 오류 기록과 dSYM 업로드 단계
- Google·Apple·Kakao 네이티브 로그인 URL 처리
- Push Notifications, Background remote notification, Sign in with Apple 설정
- GitHub Actions 원격 Xcode 검증
- Codemagic 서명 IPA 빌드와 TestFlight 업로드

`GoogleService-Info.plist`, App Store Connect API 키, 인증서 같은 비밀 파일은 저장소에 커밋하지 않는다.

최종 전달 절차와 Apple 권한이 없는 경우의 인계 항목은 `docs/ios-release-handoff.md`를 따른다. 저장소 설정은 `npm run ios:preflight`로 점검할 수 있다.

## 1. 운영 환경값 보완

기존 운영 `.env`에 아래 iOS용 값을 추가한다.

```dotenv
NUXT_PUBLIC_GOOGLE_IOS_CLIENT_ID=Firebase에서_발급한_iOS_클라이언트_ID
```

`NUXT_PUBLIC_GOOGLE_CLIENT_ID`는 기존 웹/서버 클라이언트 ID를 그대로 사용한다. 이 두 값은 Google 로그인이 백엔드에서 검증될 때 서로 역할이 다르므로 바꾸어 넣지 않는다.

## 2. Firebase plist를 Base64로 준비

Firebase 콘솔에서 번들 ID가 `com.swyp.didit`인 Apple 앱의 `GoogleService-Info.plist`를 내려받는다. PowerShell에서 다음 명령으로 Base64 문자열을 만든다.

```powershell
[Convert]::ToBase64String(
  [System.IO.File]::ReadAllBytes("C:\path\to\GoogleService-Info.plist")
)
```

파일 안의 `BUNDLE_ID`가 다르면 빌드가 즉시 중단되도록 설정되어 있다.

## 3. GitHub Actions 설정

GitHub 저장소의 **Settings → Secrets and variables → Actions**에 다음 두 시크릿을 등록한다.

| 이름 | 값 |
|---|---|
| `IOS_ENV_PRODUCTION` | 운영 `.env` 전체 내용. `NUXT_PUBLIC_GOOGLE_IOS_CLIENT_ID` 포함 |
| `FIREBASE_IOS_GOOGLE_SERVICE_INFO_PLIST_BASE64` | 위에서 만든 plist Base64 문자열 |

`.github/workflows/ios-verify.yaml`은 iOS 관련 PR 또는 수동 실행 시 macOS에서 CocoaPods를 설치하고 서명 없이 시뮬레이터 빌드를 수행한다. 이 단계는 코드와 Xcode 설정 오류를 찾는 용도이며 App Store에 업로드하지 않는다.

### 최초 한 번: Pod 버전 고정

Windows에서는 CocoaPods 잠금 파일을 만들 수 없으므로 최초 GitHub Actions 실행이 `ios-podfile-lock` 아티팩트를 생성한다.

1. `iOS verify` 실행이 끝나면 **Artifacts → ios-podfile-lock**을 내려받는다.
2. 압축 안의 `Podfile.lock`을 `ios/App/Podfile.lock`에 추가해 커밋한다.
3. `iOS verify`를 다시 실행해 잠긴 Pod 버전으로 빌드되는지 확인한다.

이후 GitHub Actions와 Codemagic은 `pod install --deployment`를 사용한다. 따라서 의존성 버전이 임의로 바뀌지 않는다. `Podfile.lock`을 커밋하기 전에는 Codemagic 배포 빌드를 실행하지 않는다.

## 4. Codemagic 연결

1. Codemagic에서 GitHub 저장소를 연결한다.
2. **Team settings → Integrations → Developer Portal**에서 App Store Connect API 키를 `didit-app-store-connect`라는 이름으로 등록한다.
3. API 키에는 앱 빌드 업로드와 TestFlight 관리가 가능한 **App Manager** 권한을 부여한다.
4. **Team settings → codemagic.yaml settings → Code signing identities**에서 해당 API 키로 Apple Distribution 인증서와 `com.swyp.didit` App Store 프로비저닝 프로파일을 생성하거나 가져온다.
5. Codemagic 변수 그룹을 `didit_production`이라는 이름으로 만들고 다음 값을 **Secure**로 등록한다.

| 이름 | 값 |
|---|---|
| `IOS_ENV_PRODUCTION` | GitHub에 등록한 것과 같은 운영 `.env` 전체 내용 |
| `FIREBASE_IOS_GOOGLE_SERVICE_INFO_PLIST_BASE64` | 같은 Firebase plist Base64 문자열 |

APNs `.p8` 키는 이미 Firebase 콘솔에 등록했으므로 프론트엔드 CI에 다시 넣지 않는다. 백엔드용 Firebase 서비스 계정 JSON도 iOS 앱 빌드에는 필요 없다.

## 5. 첫 빌드와 TestFlight 확인

1. `ios/App/Podfile.lock`이 저장소에 커밋되어 있고 GitHub Actions 검증이 성공했는지 확인한다.
2. Codemagic에서 `DIDIT iOS - TestFlight` 워크플로를 수동 실행한다.
3. 빌드가 성공하면 Codemagic이 버전은 `package.json`, 빌드 번호는 App Store Connect의 최신 번호 + 1로 설정한다.
4. 생성된 IPA는 App Store Connect와 TestFlight에 자동 업로드된다.
5. 처리 완료 후 실제 iPhone에 TestFlight 빌드를 설치한다.
6. 아래 항목을 확인한다.
   - 알림 권한 요청과 기기 토큰 등록
   - 앱이 열린 상태, 백그라운드 상태, 종료된 상태에서 푸시 수신
   - 푸시를 눌렀을 때 지정 화면과 캠페인 정보가 정상 전달되는지
   - Google·Apple·Kakao 로그인
   - 회고 시작·답변·완료와 Amplitude 이벤트
   - 테스트용 Crashlytics 오류가 Firebase 콘솔에 표시되고 dSYM이 누락되지 않는지

Crashlytics 테스트 오류는 TestFlight 확인용 브랜치에서만 일으키고 확인 후 제거한다.

## 6. App Store 심사

첫 파이프라인은 안전하게 TestFlight까지만 자동화한다. 실제 iPhone QA가 끝나면 App Store Connect에서 해당 빌드를 새 버전에 연결하고 개인정보 공개 내용, 스크린샷, 심사 메모를 확인한 뒤 수동으로 심사를 제출한다. `codemagic.yaml`의 `submit_to_app_store`는 의도하지 않은 자동 심사 제출을 막기 위해 `false`로 유지한다.

분석 도구와 Crashlytics를 추가했으므로 심사 전에 App Store Connect의 **앱이 수집하는 개인정보** 답변과 서비스 개인정보처리방침도 현재 수집 항목에 맞는지 다시 확인한다.
