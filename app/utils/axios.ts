import axios from 'axios'

export const createApiClient = (baseURL: string) => {
  const client = axios.create({
    baseURL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  })

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

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config
      const status = error.response?.status
      const code = error.response?.data?.properties?.code

      // 탈퇴 회원(403)은 갱신해도 소용없음 → 바로 로그인으로
      if (code === 'WITHDRAWN_USER') {
        redirectToLogin()
        return Promise.reject(error)
      }

      // 토큰 갱신: 401(리프레시 만료) + 403(액세스 토큰 무효 시 백엔드가 주는 상태)에서 시도.
      // (백엔드는 잘못/만료된 access token에 401이 아니라 403을 반환함)
      if ((status !== 401 && status !== 403) || original._retry) {
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
        redirectToLogin()
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    },
  )

  return client
}
