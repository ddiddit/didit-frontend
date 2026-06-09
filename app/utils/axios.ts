import axios from 'axios'

export const createApiClient = (baseURL: string) => {
  const client = axios.create({
    baseURL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  })

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config
      if (error.response?.status === 401 && !original._retry) {
        original._retry = true
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          localStorage.clear()
          window.location.href = '/auth/login'
          return Promise.reject(error)
        }
        try {
          const { data } = await client.post('/api/v1/auth/refresh', { refreshToken })
          localStorage.setItem('accessToken', data.data.accessToken)
          localStorage.setItem('refreshToken', data.data.refreshToken)
          original.headers.Authorization = `Bearer ${data.data.accessToken}`
          return client(original)
        } catch {
          localStorage.clear()
          window.location.href = '/auth/login'
        }
      }
      return Promise.reject(error)
    },
  )

  return client
}
