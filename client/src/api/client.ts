import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Track refresh promise to prevent multiple simultaneous refresh attempts
let refreshPromise: Promise<string> | null = null

// Request interceptor - add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Для FormData axios автоматично встановить правильний Content-Type з boundary
    // Не перезаписуємо його, якщо це FormData
    if (config.data instanceof FormData) {
      // Видаляємо Content-Type, якщо він був встановлений вручну
      // axios автоматично додасть правильний Content-Type з boundary
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // If a refresh is already in progress, wait for it
        if (refreshPromise) {
          const newToken = await refreshPromise
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return apiClient(originalRequest)
        }

        const refreshToken = useAuthStore.getState().refreshToken
        if (!refreshToken) {
          useAuthStore.getState().logout()
          window.location.href = '/login'
          return Promise.reject(new Error('No refresh token available'))
        }

        // Create refresh promise
        refreshPromise = (async () => {
          try {
            const response = await axios.post('/api/auth/refresh', {}, {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            })

            const { access_token } = response.data
            if (!access_token) {
              throw new Error('No access token in refresh response')
            }

            useAuthStore.getState().setAuth(
              useAuthStore.getState().user,
              access_token,
              refreshToken
            )

            return access_token
          } finally {
            refreshPromise = null
          }
        })()

        const newToken = await refreshPromise
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      } catch (refreshError: any) {
        refreshPromise = null
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
