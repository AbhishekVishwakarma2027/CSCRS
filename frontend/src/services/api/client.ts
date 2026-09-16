import axios from 'axios'
import { queryClient } from '@/lib/query-client'

const BASE_URL = import.meta.env.DEV ? '' : import.meta.env.VITE_API_BASE_URL || ''

/**
 * Central Axios instance for all CSCRS API calls.
 *
 * Responsibilities:
 * - Base URL configuration
 * - Attaches Authorization: Bearer <token> on every request
 * - Handles 401 responses by attempting silent token refresh
 * - Uses a promise queue to prevent parallel refresh races
 */
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Phase 1: Bearer token auth (no cookies)
})

// ─── Token management ────────────────────────────────────────────────────────

// TODO: Refresh tokens are currently stored in localStorage because the existing backend authentication architecture uses Bearer Tokens instead of HttpOnly cookies.
const REFRESH_TOKEN_KEY = 'cscrs_refresh_token'

export const tokenStore = {
  accessToken: null as string | null,

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setTokens(access: string, refresh: string) {
    this.accessToken = access
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  },

  clearTokens() {
    this.accessToken = null
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

// ─── Request interceptor — attach Bearer token ────────────────────────────────

apiClient.interceptors.request.use((config) => {
  if (tokenStore.accessToken) {
    config.headers.Authorization = `Bearer ${tokenStore.accessToken}`
  }
  return config
})

// ─── Response interceptor — handle 401 with token refresh ────────────────────

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

function processQueue(newToken: string) {
  refreshQueue.forEach((resolve) => resolve(newToken))
  refreshQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }
    const url = originalRequest?.url || ''
    const isAuthEndpoint =
      url.includes('/api/v1/auth/login') || url.includes('/api/v1/auth/refresh')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = tokenStore.getRefreshToken()

      if (!refreshToken) {
        // No refresh token available — force logout
        tokenStore.clearTokens()
        queryClient.clear()
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Queue this request until the ongoing refresh completes
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // POST /api/v1/auth/refresh — body is JSON per backend contract
        const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        })

        tokenStore.setTokens(data.access_token, data.refresh_token)
        processQueue(data.access_token)

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        return apiClient(originalRequest)
      } catch {
        // Refresh failed — session is invalid
        tokenStore.clearTokens()
        queryClient.clear()
        refreshQueue = []
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
