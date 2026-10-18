# Firebase iOS 패키징 체크리스트

웹 코드에는 Firebase Messaging과 Crashlytics 연결이 포함되어 있다. 다음 단계는 iOS 앱을 패키징하는 Mac에서 진행한다.

## 준비 파일

- 새 Firebase 프로젝트에서 받은 `GoogleService-Info.plist`
- 이 파일은 저장소에 커밋하지 않고 패키징 환경에서만 사용한다.
- APNs `.p8` 키와 Firebase 서비스 계정 JSON도 저장소에 넣지 않는다.

## 최초 생성 또는 기존 iOS 프로젝트 갱신

1. 의존성을 설치한다: `npm ci`
2. iOS 프로젝트가 없다면 생성한다: `npx cap add ios`
3. `GoogleService-Info.plist`를 `ios/App/App/`에 복사하고 Xcode의 App 타깃에 포함한다.
4. 정적 웹 빌드와 네이티브 플러그인을 동기화한다: `npm run cap:sync:prod`
5. Xcode에서 Bundle Identifier가 `com.swyp.didit`인지 확인한다.
6. Signing & Capabilities에서 Push Notifications와 Background Modes의 Remote notifications를 확인한다.

## AppDelegate 연결

`ios/App/App/AppDelegate.swift`에 아래 메서드를 추가한다. 이미 같은 메서드가 있다면 중복으로 만들지 말고 기존 구현에 알림 전달 코드를 합친다.

```swift
func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
  NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
}

func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
  NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
}

func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable: Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
  NotificationCenter.default.post(name: Notification.Name("didReceiveRemoteNotification"), object: completionHandler, userInfo: userInfo)
}
```

## Crashlytics 심볼 업로드

1. Xcode Build Settings의 `Debug Information Format`을 배포 구성에서 `DWARF with dSYM File`로 설정한다.
2. Build Phases에 Run Script를 추가한다: `"${PODS_ROOT}/FirebaseCrashlytics/run"`
3. Input Files에 다음 두 경로를 추가한다.
   - `${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}/Contents/Resources/DWARF/${TARGET_NAME}`
   - `$(SRCROOT)/$(BUILT_PRODUCTS_DIR)/$(INFOPLIST_PATH)`

## 제출 전 확인

- 실제 iPhone에서 알림 권한을 허용하고 Firebase 콘솔 테스트 메시지를 수신한다.
- 앱이 종료된 상태에서 알림을 눌러 지정 화면으로 이동하는지 확인한다.
- 테스트 빌드에서 한 번만 의도적으로 Crashlytics 테스트 오류를 발생시키고 Firebase 콘솔 수집 여부를 확인한다.
- 확인 후 테스트 오류 코드는 제거한다.
