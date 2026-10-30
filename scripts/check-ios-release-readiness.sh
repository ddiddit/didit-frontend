#!/usr/bin/env bash

set -euo pipefail

failures=0
allow_missing_lock=false

if [[ "${1:-}" == "--allow-missing-lock" ]]; then
  allow_missing_lock=true
fi

pass() {
  printf '[OK] %s\n' "$1"
}

fail() {
  printf '[FAIL] %s\n' "$1" >&2
  failures=$((failures + 1))
}

require_file() {
  if [[ -f "$1" ]]; then
    pass "$1"
  else
    fail "Missing file: $1"
  fi
}

require_text() {
  local file="$1"
  local pattern="$2"
  local description="$3"

  if [[ -f "$file" ]] && grep -Fq -- "$pattern" "$file"; then
    pass "$description"
  else
    fail "$description"
  fi
}

printf 'DIDIT iOS release preflight\n\n'

required_files=(
  "capacitor.config.ts"
  "codemagic.yaml"
  ".github/workflows/ios-verify.yaml"
  "ios/App/Podfile"
  "ios/App/App.xcodeproj/project.pbxproj"
  "ios/App/App/App.entitlements"
  "ios/App/App/AppDelegate.swift"
  "ios/App/App/Info.plist"
  "ios/App/App/PrivacyInfo.xcprivacy"
  "scripts/configure-ios.sh"
)

for file in "${required_files[@]}"; do
  require_file "$file"
done

require_text "capacitor.config.ts" "appId: 'com.swyp.didit'" "Capacitor bundle ID is com.swyp.didit"
require_text "ios/App/App.xcodeproj/project.pbxproj" "DEVELOPMENT_TEAM = 3PVV8DQPL6;" "Apple team ID is configured"
require_text "ios/App/App.xcodeproj/project.pbxproj" 'FirebaseCrashlytics/run' "Crashlytics upload script is configured"
require_text "ios/App/App/App.entitlements" '<key>aps-environment</key>' "Push notification entitlement exists"
require_text "ios/App/App/Info.plist" '<string>remote-notification</string>' "Background remote notifications are enabled"
require_text "ios/App/App/PrivacyInfo.xcprivacy" '<key>NSPrivacyTracking</key>' "Privacy manifest exists"
require_text "codemagic.yaml" "app_store_connect: didit-app-store-connect" "Codemagic Apple integration name is configured"
require_text "codemagic.yaml" "bundle_identifier: com.swyp.didit" "Codemagic bundle ID is configured"
require_text ".github/workflows/ios-verify.yaml" "runs-on: macos-26" "GitHub Actions uses a current macOS/Xcode runner"

if [[ -f "ios/App/Podfile.lock" ]]; then
  pass "ios/App/Podfile.lock is committed"
elif [[ "$allow_missing_lock" == true ]]; then
  printf '[WAIT] ios/App/Podfile.lock will be produced by this first GitHub Actions run and must be committed before TestFlight\n'
else
  fail "ios/App/Podfile.lock is missing; download ios-podfile-lock from the first GitHub Actions run and commit it before TestFlight"
fi

printf '\nExternal prerequisites (values are never printed):\n'

if [[ -n "${IOS_ENV_PRODUCTION:-}" ]]; then
  pass "IOS_ENV_PRODUCTION is available"
else
  printf '[WAIT] IOS_ENV_PRODUCTION must be registered in GitHub Actions and Codemagic\n'
fi

if [[ -n "${FIREBASE_IOS_GOOGLE_SERVICE_INFO_PLIST_BASE64:-}" ]]; then
  pass "Firebase iOS plist secret is available"
else
  printf '[WAIT] FIREBASE_IOS_GOOGLE_SERVICE_INFO_PLIST_BASE64 must be registered in GitHub Actions and Codemagic\n'
fi

printf '[WAIT] Apple signing and TestFlight upload require an authorized App Store Connect integration or signing assets\n'

if (( failures > 0 )); then
  printf '\nPreflight failed with %d issue(s).\n' "$failures" >&2
  exit 1
fi

printf '\nRepository preflight passed.\n'
