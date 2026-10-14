import axios from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'

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
  client.defaults.adapter = (config) => {
    const key = dedupeKey(config)
    if (!key) return baseAdapter(config)

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

    const request = baseAdapter(config).finally(() => inflight.delete(key))
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
