#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFO_PLIST="$ROOT_DIR/ios/App/App/Info.plist"
GOOGLE_SERVICE_PLIST="$ROOT_DIR/ios/App/App/GoogleService-Info.plist"

read_env_value() {
  local key="$1"
  local file="$2"
  awk -v prefix="${key}=" '
    index($0, prefix) == 1 {
      value = substr($0, length(prefix) + 1)
      sub(/\r$/, "", value)
      if ((value ~ /^".*"$/) || (value ~ /^\047.*\047$/)) {
        value = substr(value, 2, length(value) - 2)
      }
      print value
      exit
    }
  ' "$file"
}

load_env_value_if_missing() {
  local key="$1"
  local file="$2"
  if [[ -z "${!key:-}" && -f "$file" ]]; then
    printf -v "$key" '%s' "$(read_env_value "$key" "$file")"
    export "$key"
  fi
}

ENV_FILE="$ROOT_DIR/.env.production"
load_env_value_if_missing "NUXT_PUBLIC_GOOGLE_IOS_CLIENT_ID" "$ENV_FILE"
load_env_value_if_missing "NUXT_PUBLIC_GOOGLE_CLIENT_ID" "$ENV_FILE"
load_env_value_if_missing "NUXT_PUBLIC_KAKAO_NATIVE_KEY" "$ENV_FILE"

: "${NUXT_PUBLIC_GOOGLE_IOS_CLIENT_ID:?NUXT_PUBLIC_GOOGLE_IOS_CLIENT_ID is required}"
: "${NUXT_PUBLIC_GOOGLE_CLIENT_ID:?NUXT_PUBLIC_GOOGLE_CLIENT_ID is required}"

if [[ ! -f "$GOOGLE_SERVICE_PLIST" ]]; then
  echo "GoogleService-Info.plist is missing at $GOOGLE_SERVICE_PLIST" >&2
  exit 1
fi

GOOGLE_PLIST_BUNDLE_ID="$(/usr/libexec/PlistBuddy -c 'Print :BUNDLE_ID' "$GOOGLE_SERVICE_PLIST")"
GOOGLE_PLIST_CLIENT_ID="$(/usr/libexec/PlistBuddy -c 'Print :CLIENT_ID' "$GOOGLE_SERVICE_PLIST")"
GOOGLE_REVERSED_CLIENT_ID="$(/usr/libexec/PlistBuddy -c 'Print :REVERSED_CLIENT_ID' "$GOOGLE_SERVICE_PLIST")"

if [[ "$GOOGLE_PLIST_BUNDLE_ID" != "com.swyp.didit" ]]; then
  echo "GoogleService-Info.plist BUNDLE_ID must be com.swyp.didit, got: $GOOGLE_PLIST_BUNDLE_ID" >&2
  exit 1
fi

if [[ "$GOOGLE_PLIST_CLIENT_ID" != "$NUXT_PUBLIC_GOOGLE_IOS_CLIENT_ID" ]]; then
  echo "NUXT_PUBLIC_GOOGLE_IOS_CLIENT_ID does not match GoogleService-Info.plist CLIENT_ID" >&2
  exit 1
fi

KAKAO_NATIVE_APP_KEY="${NUXT_PUBLIC_KAKAO_NATIVE_KEY:-a2d60240a516c8296d6506cad6ae841b}"
KAKAO_URL_SCHEME="kakao${KAKAO_NATIVE_APP_KEY}"

plist_set_string() {
  local key="$1"
  local value="$2"
  /usr/libexec/PlistBuddy -c "Delete :${key}" "$INFO_PLIST" >/dev/null 2>&1 || true
  /usr/libexec/PlistBuddy -c "Add :${key} string ${value}" "$INFO_PLIST"
}

plist_set_string "GIDClientID" "$NUXT_PUBLIC_GOOGLE_IOS_CLIENT_ID"
plist_set_string "GIDServerClientID" "$NUXT_PUBLIC_GOOGLE_CLIENT_ID"

/usr/libexec/PlistBuddy -c "Delete :CFBundleURLTypes" "$INFO_PLIST" >/dev/null 2>&1 || true
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes array" "$INFO_PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0 dict" "$INFO_PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLName string Google Sign-In" "$INFO_PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes array" "$INFO_PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes:0 string ${GOOGLE_REVERSED_CLIENT_ID}" "$INFO_PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:1 dict" "$INFO_PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:1:CFBundleURLName string Kakao Login" "$INFO_PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:1:CFBundleURLSchemes array" "$INFO_PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:1:CFBundleURLSchemes:0 string ${KAKAO_URL_SCHEME}" "$INFO_PLIST"

echo "Configured iOS Firebase and login settings for com.swyp.didit"
