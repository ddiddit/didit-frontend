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

  function redirectToLogin() {
    localStorage.clear()
    window.location.href = '/auth/login'
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
