import axios from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    // false면 GET 응답 캐시를 건너뛰고 항상 네트워크로 요청(강제 새로고침용). 받은 응답은 캐시에 다시 채운다
    cache?: boolean
  }
}

// GET 응답 메모리 캐시 — 화면을 다시 들어올 때마다 같은 조회 API를 반복 호출하지 않도록 TTL 동안 재사용한다.
// 데이터를 바꾸는 요청(POST/PUT/PATCH/DELETE)이 성공하면 무엇이 바뀌었는지와 무관하게 전부 비워
// 다음 조회에서 최신 데이터를 받는다. 앱을 새로 띄우면(메모리 초기화) 자연히 비워진다.
const GET_CACHE_TTL = 1000 * 60 * 5 // 5분
const responseCache = new Map<string, { response: AxiosResponse; expiresAt: number }>()

// 로그인·로그아웃, 서버에서 데이터가 바뀌었을 수 있는 시점(푸시 수신 등)에 호출
export function clearApiCache() {
  responseCache.clear()
}

// 데이터를 바꾸는 요청이 성공하면 GET 캐시 전체를 비운다
function clearCacheOnWrite(config: InternalAxiosRequestConfig) {
  return (res: AxiosResponse) => {
    if (config.method !== 'get') clearApiCache()
    return res
  }
}

// GET 캐시에서 제외할 조회 — 서버 쪽에서 계속 바뀌어 매번 새로 받아야 하는 것들
// - /conversation: 첨부 분석·AI 응답 폴링
// - /attachments: 다운로드 URL은 만료 시간이 있음
// - /badges/popup: 조회 시점의 '아직 알리지 않은 배지' — 회고 저장 직후 1회성 조회
// - /notification-histories: 서버가 보내는 알림 목록
function isCacheableGet(config: InternalAxiosRequestConfig): boolean {
  const url = config.url ?? ''
  return config.method === 'get'
    && config.cache !== false
    && !/\/conversation(\?|$)|\/attachments|\/badges\/popup|\/notification-histories/.test(url)
}

// 중복 요청 방지에서 제외할 요청 — 같은 내용이어도 매번 실제로 보내야 하는 것들.
// - /messages: 답변 제출. 요청마다 clientMessageId가 달라 매번 새 메시지로 처리돼야 함
// - /attachments: 첨부 업로드 URL 발급·완료 확인. 같은 파일을 두 번 골라도 각각 별개 업로드
// - FormData: 음성 업로드 등 파일 본문 — 직렬화해 비교할 수도 없음
function dedupeKey(config: InternalAxiosRequestConfig): string | null {
  const url = config.url ?? ''
  if (/\/messages(\?|$)/.test(url) || url.includes('/attachments') || config.data instanceof FormData) return null
  // adapter 단계라 data는 이미 transformRequest로 문자열화돼 있다. 토큰이 바뀌면(갱신 후 재시도) 다른 요청으로 본다
  const data = typeof config.data === 'string' ? config.data : JSON.stringify(config.data ?? null)
  return [config.method, config.baseURL, url, JSON.stringify(config.params ?? null), data, config.headers?.Authorization ?? ''].join(' ')
}

export const createApiClient = (baseURL: string) => {
  const client = axios.create({
    baseURL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  })

  // 동일 요청 중복 방지 — 같은 메서드·URL·파라미터·본문의 요청이 아직 응답 전이면 네트워크로 다시 보내지 않고
  // 진행 중인 요청의 결과를 함께 받는다(더블 탭·중복 마운트 등). 응답이 오면 바로 풀려서 이후 요청은 정상 전송된다.
  const inflight = new Map<string, Promise<AxiosResponse>>()
  const baseAdapter = axios.getAdapter(client.defaults.adapter)
  client.defaults.adapter = async (config) => {
    const key = dedupeKey(config)
    // 중복 방지 제외 요청(답변 제출·첨부·음성 업로드)도 데이터를 바꾸는 요청이라 성공 시 GET 캐시를 비운다
    if (!key) return baseAdapter(config).then(clearCacheOnWrite(config))

    // 캐시된 GET 응답이 있으면 네트워크 없이 반환. 저장된 data는 파싱 전 원본(문자열)이라
    // 이후 transformResponse가 매번 새 객체로 파싱한다 — 화면에서 응답 객체를 고쳐도 캐시는 오염되지 않는다
    if (isCacheableGet(config)) {
      const cached = responseCache.get(key)
      if (cached && cached.expiresAt > Date.now()) return { ...cached.response, config }
      responseCache.delete(key)
    }

    const existing = inflight.get(key)
    if (existing) {
      // 결과는 공유하되 config는 이 요청 것으로 바꿔 돌려준다 — 같은 config 객체를 공유하면
      // 아래 토큰 갱신 인터셉터의 _retry 표시가 두 요청에 같이 찍혀 뒤 요청이 재시도 없이 실패한다
      return existing.then(
        (res) => ({ ...res, config }),
        (err: unknown) => Promise.reject(
          axios.isAxiosError(err) ? Object.assign(Object.create(Object.getPrototypeOf(err)), err, { config }) : err,
        ),
      )
    }

    const request = baseAdapter(config)
      .then((res) => {
        // cache:false(강제 새로고침)로 받은 응답도 채워 둬, 이후 일반 조회는 최신 값을 재사용한다.
        // axios가 이 객체의 data를 파싱 결과로 덮어쓰므로, 파싱 전 원본을 담은 사본을 저장한다
        if (isCacheableGet({ ...config, cache: true })) {
          responseCache.set(key, { response: { ...res }, expiresAt: Date.now() + GET_CACHE_TTL })
        }
        return res
      })
      .then(clearCacheOnWrite(config))
      .finally(() => inflight.delete(key))
    inflight.set(key, request)
    return request
  }

  let isRefreshing = false
  let pendingQueue: Array<{
    resolve: (token: string) => void
    reject: (err: unknown) => void
  }> = []

  function flushQueue(error: unknown, token: string | null) {
    pendingQueue.forEach(({ resolve, reject }) => {
      if (error) reject(error)
      else resolve(token!)
    })
    pendingQueue = []
  }

  // 여러 요청이 동시에 401이 나도 한 번만 로그인으로 보냄
  let isRedirecting = false
  function redirectToLogin() {
    if (isRedirecting) return
    isRedirecting = true
    localStorage.clear()
    window.location.href = '/login'
  }

  function isPublicAuthRequest(url?: string) {
    return url === '/api/v1/auth/login'
      || url === '/api/v1/auth/refresh'
      || url?.startsWith('/api/v2/auth/social/')
  }

  // 로그인 이후의 보호 API에만 서비스 액세스 토큰을 첨부한다.
  // 소셜 로그인 자격 증명은 Authorization 헤더가 아니라 요청 본문으로 전달한다.
  client.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem('accessToken')
    if (accessToken && !isPublicAuthRequest(config.url)) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  })

  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      console.log(error)
      const original = error.config
      const status = error.response?.status
      const code = error.response?.data?.properties?.codeWW

      // 탈퇴 회원(403)은 갱신해도 소용없음 → 바로 로그인으로
      if (code === 'WITHDRAWN_USER') {
        // 로그인 요청에서는 호출부가 오류를 표시하도록 리디렉션하지 않는다.
        if (isPublicAuthRequest(original?.url)) {
          return Promise.reject(error)
        }
        redirectToLogin()
        return Promise.reject(error)
      }

      // 토큰 갱신: 401(리프레시 만료) + 403(액세스 토큰 무효 시 백엔드가 주는 상태)에서 시도.
      // (백엔드는 잘못/만료된 access token에 401이 아니라 403을 반환함)
      // 인증 헤더가 없는 공개 요청(로그인 등)의 401/403은 토큰 갱신 대상이 아니다.
      // 호출부가 원래 API 오류를 처리할 수 있도록 그대로 전달한다.
      const hasAuthorization = Boolean(original?.headers?.Authorization)
      if ((status !== 401 && status !== 403) || original?._retry || !hasAuthorization) {
        return Promise.reject(error)
      }

      // 이미 갱신 중이면 큐에 넣고 완료 대기
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`
              resolve(client(original))
            },
            reject,
          })
        })
      }

      original._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        isRefreshing = false
        redirectToLogin()
        return Promise.reject(error)
      }

      try {
        // 인터셉터를 거치지 않는 순수 axios 인스턴스로 갱신 요청
        const refreshURL = baseURL ? `${baseURL}/api/v1/auth/refresh` : '/api/v1/auth/refresh'
        const { data } = await axios.post(refreshURL, { refreshToken })
        const newAccessToken = data.data.accessToken
        const newRefreshToken = data.data.refreshToken
        localStorage.setItem('accessToken', newAccessToken)
        localStorage.setItem('refreshToken', newRefreshToken)
        original.headers.Authorization = `Bearer ${newAccessToken}`
        flushQueue(null, newAccessToken)
        return client(original)
      } catch (err) {
        flushQueue(err, null)
        // 갱신이 서버에서 명시적으로 거부된 경우(4xx)에만 로그아웃.
        // 네트워크 순단·타임아웃·서버 오류(5xx)는 일시적 실패라 세션을 지우지 않는다 (다음 갱신에서 복구)
        const refreshStatus = axios.isAxiosError(err) ? err.response?.status : undefined
        if (refreshStatus !== undefined && refreshStatus >= 400 && refreshStatus < 500) {
          redirectToLogin()
        }
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    },
  )

  return client
}
