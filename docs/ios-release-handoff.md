# DIDIT iOS 릴리스 전달서

이 문서는 프론트 QA가 끝난 뒤 iOS 빌드 권한을 가진 담당자가 바로 TestFlight 업로드를 진행할 수 있도록 필요한 내용을 정리한 전달서다.

## 현재 기술 작업 상태

저장소에는 다음 항목이 구성되어 있다.

- Capacitor iOS 프로젝트와 번들 ID `com.swyp.didit`
- Firebase Cloud Messaging의 iOS 토큰 등록, 알림 수신·열기 처리
- Firebase Crashlytics 오류 수집과 dSYM 업로드 단계
- Google·Apple·Kakao 네이티브 로그인 설정
- Push Notifications, Background remote notification, Sign in with Apple 권한
- 개인정보 보호 매니페스트
- GitHub Actions의 원격 Xcode 시뮬레이터 빌드 검증
- Codemagic의 App Store 서명, IPA 생성, TestFlight 자동 업로드

비밀 파일과 Apple 인증 정보는 저장소에 포함하지 않는다.

## 현재 남은 외부 권한

코드 작업과 별개로 App Store용 IPA를 서명하고 TestFlight에 올리려면 Apple 조직의 권한이 필요하다. 현재 계정만으로 아래 인증 정보를 새로 만들 수 없다면, 계정 소유자 또는 관리자가 제공하거나 직접 업로드해야 한다.

권장 방식은 Codemagic에 **팀 App Store Connect API 키**를 `didit-app-store-connect`라는 이름으로 연결하는 것이다. 키에는 DIDIT 앱 빌드 업로드가 가능한 App Manager 이상의 권한이 필요하다.

대안은 다음 자료를 권한 있는 담당자가 제공하는 방식이다.

- Apple Distribution 인증서 `.p12`
- 인증서 비밀번호
- `com.swyp.didit`용 App Store 프로비저닝 프로파일 `.mobileprovision`
- App Store Connect 업로드 인증 수단

대안 자료를 사용할 경우 현재 `codemagic.yaml`의 자동 서명 방식을 수동 서명 방식으로 바꾸어야 한다. APNs 키나 Apple 로그인 키를 앱 서명 키로 대신 사용할 수 없다.

## 전달 전 실행 순서

1. 프론트 QA 수정 사항을 모두 `main`에 반영한다.
2. 이 iOS 작업 브랜치를 최신 `main`과 동기화하고 충돌을 해결한다.
3. `npm ci`, `npm test`, `npm run generate`, `npm run ios:preflight`를 실행한다.
4. GitHub Actions의 **iOS verify**를 실행한다.
5. 첫 실행에서 생성된 `ios-podfile-lock` 아티팩트의 `Podfile.lock`을 `ios/App/Podfile.lock`에 추가하고 커밋한다.
6. **iOS verify**를 다시 실행해 원격 Xcode 빌드가 성공하는지 확인한다.
7. Codemagic에 `didit_production` 변수 그룹과 Apple 인증 정보를 연결한다.
8. Codemagic의 **DIDIT iOS - TestFlight** 워크플로를 실행한다.
9. TestFlight 빌드를 실제 iPhone에 설치해 FCM, Crashlytics, 소셜 로그인과 주요 회고 흐름을 확인한다.
10. QA가 끝나면 App Store Connect에서 빌드를 선택해 심사를 수동 제출한다.

`npm run ios:preflight`는 저장소 설정과 `Podfile.lock` 유무를 점검한다. 외부 시크릿은 값 자체를 출력하지 않고 등록 필요 여부만 안내한다.

## 전달할 항목

권한 있는 담당자에게 아래 항목만 전달한다.

- 최종 PR 또는 커밋 주소
- GitHub Actions **iOS verify** 성공 링크
- 앱 버전과 배포 대상 브랜치
- 이 문서와 `docs/ios-cloud-release.md`
- 실제 iPhone QA 체크리스트

다음 자료는 Git, PR, 메신저 일반 대화방에 올리지 않는다.

- `.p8`, `.p12`, `.mobileprovision`
- 인증서 비밀번호
- App Store Connect API 키 원문
- `GoogleService-Info.plist` 원본 또는 Base64 값
- `IOS_ENV_PRODUCTION`에 등록한 운영 `.env` 원문

## 권한 담당자에게 보낼 메시지

```text
DIDIT iOS 코드와 클라우드 빌드 설정은 완료되어 있습니다. 최종 프론트 코드 반영 후 GitHub Actions에서 원격 Xcode 검증까지 진행할 예정입니다.

기존 앱(com.swyp.didit)의 TestFlight 업로드를 위해 Apple 조직 권한이 필요합니다. 가능하다면 App Manager 권한의 팀 App Store Connect API 키를 Codemagic에 연결해 주세요. 키 공유가 어렵다면 Apple 권한 담당자가 Codemagic 연결 또는 최종 업로드를 직접 진행해 주셔도 됩니다.

코드·설정 전달 문서: docs/ios-release-handoff.md
상세 실행 문서: docs/ios-cloud-release.md
```

## 완료 판단 기준

기술 작업은 GitHub Actions의 원격 Xcode 빌드가 성공하면 코드 수준에서 완료다. 배포 작업은 TestFlight 설치 후 아래 항목이 실제 기기에서 확인되어야 완료다.

- 포그라운드·백그라운드·종료 상태 푸시 수신과 알림 열기
- Firebase 콘솔의 Crashlytics 테스트 오류와 dSYM 정상 처리
- Google·Apple·Kakao 로그인
- 회고 시작·답변·완료와 Amplitude 이벤트

Apple 인증 정보가 없는 동안에는 서명된 IPA 생성, TestFlight 업로드, 실제 기기 FCM·Crashlytics 검증까지 완료했다고 판단할 수 없다.
