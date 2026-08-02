import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { PATHS } from './paths'
import { PageLoader } from '@/components/common/LoadingSpinner/PageLoader'

interface PublicRouteProps {
  children: ReactNode
}

/**
 * Route guard for public-only routes (login, forgot-password, activate).
 * Redirects already-authenticated users to the dashboard.
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <PageLoader />
  }

  if (user) {
    return <Navigate to={PATHS.DASHBOARD} replace />
  }

  return <>{children}</>
}
