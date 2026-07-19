import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Tracks whether a token refresh is in flight so we only fire one at a time
let isRefreshing = false
let refreshQueue: Array<(token?: string) => void> = []

const processQueue = (error?: Error) => {
  refreshQueue.forEach((cb) => cb())
  refreshQueue = []
  if (error) {
    // propagated to all waiting calls
  }
}

// Appends bearer token from authStore to request headers (for non-cookie flows)
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token && token !== 'cookie_auth_session') {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// CSRF token cache
let csrfToken: string | null = null

/**
 * Fetch a CSRF token from the backend and cache it.
 * Only needed for state-mutating requests (POST/PUT/PATCH/DELETE).
 */
export const fetchCsrfToken = async (): Promise<string | null> => {
  if (csrfToken) return csrfToken
  try {
    const resp = await api.get<any>('/v1/csrf-token')
    csrfToken = resp.data?.csrfToken || null
    return csrfToken
  } catch {
    return null
  }
}

/**
 * Clear cached CSRF token (e.g., after 1-hour cookie expiry).
 */
export const clearCsrfToken = () => {
  csrfToken = null
}

// Intercepts request to attach CSRF header on mutating methods
api.interceptors.request.use(async (config) => {
  const method = config.method?.toUpperCase()
  if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
    const url = config.url || ''
    // Skip CSRF for the CSRF-exempt auth endpoints
    const csrfExempt = ['/v1/auth/login', '/v1/auth/register', '/v1/auth/refresh', '/v1/auth/verify-email', '/v1/auth/forgot-password', '/v1/auth/reset-password']
    const isExempt = csrfExempt.some((p) => url.endsWith(p))
    if (!isExempt) {
      const token = await fetchCsrfToken()
      if (token) {
        config.headers['x-csrf-token'] = token
      }
    }
  }
  return config
})

// Intercepts responses: auto-refresh JWT on 401, logout on permanent failure
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue subsequent 401s until the refresh completes
        return new Promise((resolve) => {
          refreshQueue.push(() => {
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Try to refresh the access token using the refresh_token cookie
        await api.post('/v1/auth/refresh')
        processQueue()
        isRefreshing = false
        // Retry the original request
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as Error)
        isRefreshing = false
        // Clear CSRF cache since session is dead
        clearCsrfToken()
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)
