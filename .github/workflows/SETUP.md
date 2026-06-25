# 앱 CI/CD 셋업 가이드

`develop`/`main` 머지 시 Android 앱(AAB)을 자동 빌드 → Google Play 업로드하는 파이프라인.

- **develop push** → 테스트 AAB 빌드 → Play **내부테스트(internal)** 트랙에 즉시 배포(`completed`) → 테스터 자동 업데이트
- **main push** → 운영 AAB 빌드 → Play **프로덕션(production)** 트랙에 **초안(draft)** 업로드 → Play Console에서 **수동 출시**

versionCode는 `git rev-list --count HEAD`(커밋 수)로 자동 증가 → 매 빌드 새 버전.

---

## 1. 선행 조건 (한 번만)

1. **Play Console에 앱이 먼저 존재해야 함** — 첫 AAB는 **수동 업로드**로 앱을 생성(`kr.ai.didit`). 이후부터 CI가 새 버전 업로드.
2. **내부테스트 트랙에 테스터 등록** — 테스터 이메일 목록을 internal 트랙에 추가.
3. **Play Developer API 서비스계정**:
   - Google Cloud Console → 서비스계정 생성 → JSON 키 발급
   - Play Console → 설정 → API 액세스 → 그 서비스계정에 권한 부여(앱 릴리스 관리)

## 2. GitHub Secrets (Settings → Secrets and variables → Actions)

| 시크릿 | 내용 |
|---|---|
| `ENV_STAGING` | develop용 `.env` 전체 내용 (staging API 등 `NUXT_PUBLIC_*`) |
| `ENV_PRODUCTION` | main용 `.env` 전체 내용 (운영 API) |
| `ANDROID_KEYSTORE_BASE64` | 업로드 키스토어를 base64로 인코딩한 값 |
| `ANDROID_KEYSTORE_PASSWORD` | 키스토어/키 비밀번호 |
| `PLAY_SERVICE_ACCOUNT_JSON` | Play Developer API 서비스계정 JSON 전체 |

### 키스토어 base64 만드는 법
```bash
base64 -i android/didit-upload.keystore | pbcopy   # 클립보드에 복사됨
```
→ 이 값을 `ANDROID_KEYSTORE_BASE64` 시크릿에 붙여넣기.
(⚠️ 키스토어 파일·비번 자체는 절대 커밋 금지 — gitignore 처리됨)

## 3. 트리거 동작

| 이벤트 | build-web(검증) | build-app(빌드·업로드) |
|---|---|---|
| PR → develop/main | ✅ | ❌ |
| push(머지) → develop | ✅ | ✅ internal `completed` |
| push(머지) → main | ✅ | ✅ production `draft` |

## 4. 운영 출시를 완전 자동으로 하려면
`main.yaml`의 `status: draft` → `status: completed` 로 변경.
(단, 구글 심사 후 전체 사용자에게 바로 라이브되므로 비권장. draft로 두고 콘솔에서 검토 후 출시 권장.)

## 5. iOS (추후)
iOS는 macOS 러너 + 인증서/프로비저닝 프로파일 필요 → 별도 워크플로로 추가 예정.
