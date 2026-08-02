import { useAuthContext } from '@/providers/auth-provider'

/**
 * Convenience hook for accessing authentication state.
 * Shortcut for useAuthContext() — use this in all feature components.
 *
 * @example
 * const { user, logout } = useAuth()
 */
export function useAuth() {
  return useAuthContext()
}
