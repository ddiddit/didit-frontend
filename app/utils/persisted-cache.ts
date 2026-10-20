import { clearApiCache } from '~/utils/axios'

// 새로고침·재진입 때마다 같은 조회 API를 다시 부르지 않도록 응답을 localStorage에 보관하는 공용 캐시.
// 키는 모두 PREFIX로 시작해 로그아웃·계정 전환 시 clearPersistedCaches()로 한 번에 비울 수 있다.
// 저장소 접근이 막힌 환경(사생활 보호 모드 등)에서는 조용히 캐시 없이 동작한다.
const PREFIX = 'cache:'

export interface PersistedEntry<T> {
  data: T
  savedAt: number
}

export function readPersistedCache<T>(key: string): PersistedEntry<T> | null {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as PersistedEntry<T>) : null
  } catch {
    return null
  }
}

export function writePersistedCache<T>(key: string, data: T): PersistedEntry<T> {
  const entry: PersistedEntry<T> = { data, savedAt: Date.now() }
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(entry))
  } catch {
    // 저장 실패 — 메모리 상태만으로 동작
  }
  return entry
}

// 데이터가 바뀌는 작업(회고 완료·삭제 등) 뒤에 호출 — 다음 진입 때 서버에서 새로 받게 한다
export function removePersistedCache(key: string) {
  if (!import.meta.client) return
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // 무시
  }
}

export function isCacheFresh(entry: PersistedEntry<unknown> | null, ttl: number): boolean {
  return !!entry && Date.now() - entry.savedAt < ttl
}

// 로그아웃·다른 계정 로그인 시 — 이전 계정 데이터가 남지 않도록 캐시 전체 삭제
export function clearPersistedCaches() {
  if (!import.meta.client) return
  clearApiCache() // axios GET 메모리 캐시도 계정 단위라 함께 비운다
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // 무시
  }
}

// 캐시 키 — 무효화하는 쪽(회고 완료·삭제, 알림 읽음 등)과 읽는 쪽이 같은 키를 쓰도록 한곳에 모은다
export const CACHE_KEYS = {
  home: 'home',
  profile: 'profile',
  notificationSettings: 'notificationSettings',
} as const
