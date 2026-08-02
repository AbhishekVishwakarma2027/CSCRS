import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { tokenStore } from '@/services/api'
import { authService } from '@/features/auth/services/auth.service'
import { queryClient } from '@/lib/query-client'
import type { UserProfile } from '@/types/auth.types'

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Current authenticated user. Null if not authenticated. */
  user: UserProfile | null
  /** True while session is being restored from localStorage on mount. */
  isLoading: boolean
  /** Call after successful login to set tokens and user profile. */
  setAuth: (accessToken: string, refreshToken: string, user: UserProfile) => void
  /** Clears all auth state and tokens. */
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * On mount — attempt to restore session from localStorage refresh token.
   * If successful, fetches user profile. If not, silently stays unauthenticated.
   */
  useEffect(() => {
    async function restoreSession() {
      const refreshToken = tokenStore.getRefreshToken()

      if (!refreshToken) {
        setIsLoading(false)
        return
      }

      try {
        // Rotate the refresh token to get a fresh access token
        const tokenData = await authService.refresh(refreshToken)

        tokenStore.setTokens(tokenData.access_token, tokenData.refresh_token)

        // Fetch user profile with the new access token
        const profileData = await authService.getCurrentUser()
        setUser(profileData)
      } catch {
        // TODO: Route authentication failures through the centralized logging system in production
        // Refresh token is invalid or expired — clear everything silently
        tokenStore.clearTokens()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    void restoreSession()
  }, [])

  const setAuth = useCallback((accessToken: string, refreshToken: string, profile: UserProfile) => {
    tokenStore.setTokens(accessToken, refreshToken)
    setUser(profile)
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.getRefreshToken()

    if (refreshToken) {
      try {
        // POST /api/v1/auth/logout — revoke the current session on the backend
        await authService.logout(refreshToken)
      } catch {
        // TODO: Route authentication failures through the centralized logging system in production
        // Proceed with local logout even if the server call fails
      }
    }

    tokenStore.clearTokens()
    setUser(null)
    setIsLoading(false) // Explicitly ensure loading state is reset during logout
    queryClient.clear()
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, setAuth, logout }),
    [user, isLoading, setAuth, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Consumer hook ────────────────────────────────────────────────────────────

/**
 * Access auth context. Must be used within <AuthProvider>.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within <AuthProvider>')
  }
  return context
}
