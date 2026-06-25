import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

// 앱 버전 표시용 — 앱(네이티브)은 빌드 버전(versionName)을 동적으로,
// 웹은 package.json 버전(runtimeConfig.appVersion)을 fallback으로 사용한다.
// 플랫폼별 실제 버전이 떠서 릴리스마다 화면 버전을 수동으로 고칠 필요가 없다.
export function useAppVersion() {
  const config = useRuntimeConfig()
  const version = useState<string>('app:version', () => config.public.appVersion as string)

  onMounted(async () => {
    if (!Capacitor.isNativePlatform()) return
    try {
      const info = await App.getInfo()
      version.value = info.version // 안드 versionName / iOS Version
    } catch {
      // 실패 시 웹 fallback 유지
    }
  })

  return { version }
}
