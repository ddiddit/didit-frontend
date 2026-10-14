import type { ApiResponse, NotificationSetting } from '~/types/api'
import { CACHE_KEYS, isCacheFresh, readPersistedCache, writePersistedCache } from '~/utils/persisted-cache'
import type { PersistedEntry } from '~/utils/persisted-cache'

// 알림 설정 캐시 — 앱 시작(푸시 동기화)·알림 설정 화면 진입·새로고침 때마다 /api/v1/notification-settings를
// 다시 요청하지 않도록, 마지막으로 받은(또는 이 앱에서 변경한) 값을 localStorage에 보관하고 바로 꺼내 쓴다.
// 설정 변경은 전부 이 앱을 거치므로 변경 시 update()로 캐시를 같이 갱신하면 서버와 어긋나지 않는다.
// 다른 기기에서 바꾼 값은 반영이 늦을 수 있어, 일정 시간(CACHE_TTL)이 지나면 한 번 새로 받아온다.
const CACHE_TTL = 1000 * 60 * 60 // 1시간

export function useNotificationSettings() {
  const { $api } = useNuxtApp()
  const cache = useState<PersistedEntry<NotificationSetting> | null>('notification:settings', () =>
    readPersistedCache<NotificationSetting>(CACHE_KEYS.notificationSettings),
  )
  const settings = computed(() => cache.value?.data ?? null)

  // 캐시가 있고 TTL 안이면 요청 없이 바로 반환. 없거나 오래됐을 때(또는 force)만 서버에서 받는다
  async function load(force = false): Promise<NotificationSetting> {
    if (cache.value && !force && isCacheFresh(cache.value, CACHE_TTL)) return cache.value.data
    const res = await $api.get<ApiResponse<NotificationSetting>>('/api/v1/notification-settings')
    set(res.data.data)
    return res.data.data
  }

  // 설정 변경(PUT) 후 캐시에 반영 — 다음 진입 때 재요청 없이 최신값을 쓰게 한다
  function update(patch: Partial<NotificationSetting>) {
    if (!cache.value) return
    set({ ...cache.value.data, ...patch })
  }

  function set(data: NotificationSetting) {
    cache.value = writePersistedCache(CACHE_KEYS.notificationSettings, data)
  }

  return { settings, load, update }
}
