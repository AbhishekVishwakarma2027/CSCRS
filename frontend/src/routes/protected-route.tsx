import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { PATHS } from './paths'
import type { UserRole } from '@/types/auth.types'
import { PageLoader } from '@/components/common/LoadingSpinner/PageLoader'

interface ProtectedRouteProps {
  children: ReactNode
  /** If provided, only users with one of these roles can access the route. */
  roles?: UserRole[]
}

/**
 * Route guard for authenticated routes.
 *
 * Behaviour:
 * 1. Not authenticated  → redirect to /login (preserving intended destination)
 * 2. Authenticated, wrong role → redirect to /unauthorized
 * 3. Authenticated, permitted role → render children
 */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    // Auth state is being restored from localStorage refresh token — avoid flicker
    return <PageLoader />
  }

  if (!user) {
    return <Navigate to={PATHS.LOGIN} state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={PATHS.UNAUTHORIZED} replace />
  }

  return <>{children}</>
}
