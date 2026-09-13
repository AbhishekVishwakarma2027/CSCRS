import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { PATHS } from './paths'
import { ProtectedRoute } from './protected-route'
import { PublicRoute } from './public-route'
import { UserRole } from '@/types/auth.types'
import { PageLoader } from '@/components/common/LoadingSpinner/PageLoader'
import { AppLayout } from '@/components/layout/AppShell/AppLayout'

// Foundation pages — lazy loaded for optimal code splitting
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'))
const VerifyResetOtpPage = lazy(() => import('@/features/auth/pages/VerifyResetOtpPage'))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'))
const ActivateAccountPage = lazy(() => import('@/features/auth/pages/ActivateAccountPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage'))
const DepartmentsPage = lazy(() => import('@/features/departments/pages/DepartmentsPage'))
const FeedbackPage = lazy(() => import('@/features/feedback/pages/FeedbackPage'))
const UserDirectoriesPage = lazy(
  () => import('@/features/user-directories/pages/UserDirectoriesPage')
)
const SystemHealthPage = lazy(() => import('@/features/system-issues/pages/SystemHealthPage'))
const ProfileSettingsPage = lazy(() => import('@/features/profile/pages/ProfileSettingsPage'))
const SettingsPage = lazy(() => import('@/features/profile/pages/SettingsPage'))
const ExportsPage = lazy(() => import('@/features/reports/pages/ExportsPage'))
const SubmitIssuePage = lazy(() => import('@/features/system-issues/pages/SubmitIssuePage'))
const MyIssuesPage = lazy(() => import('@/features/system-issues/pages/MyIssuesPage'))
const WorkersPage = lazy(() => import('@/features/workers/pages/WorkersPage'))
const ManualReviewPage = lazy(() => import('@/features/resolutions/pages/ManualReviewPage'))
const ForwardRequestsPage = lazy(
  () => import('@/features/forward-requests/pages/ForwardRequestsPage')
)
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage'))
const UnauthorizedPage = lazy(() => import('@/features/auth/pages/UnauthorizedPage'))
const NotFoundPage = lazy(() => import('@/features/auth/pages/NotFoundPage'))
const LandingPage = lazy(() => import('@/pages/LandingPage'))

export const router = createBrowserRouter([
  // Public landing page
  {
    path: PATHS.ROOT,
    element: (
      <Suspense fallback={<PageLoader />}>
        <LandingPage />
      </Suspense>
    ),
  },

  // Public routes
  {
    path: PATHS.LOGIN,
    element: (
      <PublicRoute>
        <Suspense fallback={<PageLoader />}>
          <LoginPage />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: PATHS.FORGOT_PASSWORD,
    element: (
      <PublicRoute>
        <Suspense fallback={<PageLoader />}>
          <ForgotPasswordPage />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: PATHS.VERIFY_RESET_OTP,
    element: (
      <PublicRoute>
        <Suspense fallback={<PageLoader />}>
          <VerifyResetOtpPage />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: PATHS.RESET_PASSWORD,
    element: (
      <PublicRoute>
        <Suspense fallback={<PageLoader />}>
          <ResetPasswordPage />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: PATHS.ACTIVATE_ADMIN,
    element: (
      <PublicRoute>
        <Suspense fallback={<PageLoader />}>
          <ActivateAccountPage />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: PATHS.ACTIVATE_CITY_ADMIN,
    element: (
      <PublicRoute>
        <Suspense fallback={<PageLoader />}>
          <ActivateAccountPage />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: PATHS.ACTIVATE_WORKER,
    element: (
      <PublicRoute>
        <Suspense fallback={<PageLoader />}>
          <ActivateAccountPage />
        </Suspense>
      </PublicRoute>
    ),
  },

  // Error states (accessible without auth)
  {
    path: PATHS.UNAUTHORIZED,
    element: (
      <Suspense fallback={<PageLoader />}>
        <UnauthorizedPage />
      </Suspense>
    ),
  },

  // Protected routes wrapped in persistent AppLayout
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: PATHS.DASHBOARD,
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: PATHS.REPORTS,
        element: (
          <Suspense fallback={<PageLoader />}>
            <ReportsPage />
          </Suspense>
        ),
      },
      {
        path: PATHS.DEPARTMENTS,
        element: (
          <ProtectedRoute roles={[UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <DepartmentsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: PATHS.USERS,
        element: (
          <ProtectedRoute
            roles={[UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN, UserRole.DEPARTMENT_ADMIN]}
          >
            <Suspense fallback={<PageLoader />}>
              <UserDirectoriesPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: PATHS.FEEDBACK,
        element: (
          <ProtectedRoute
            roles={[UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN, UserRole.DEPARTMENT_ADMIN]}
          >
            <Suspense fallback={<PageLoader />}>
              <FeedbackPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: PATHS.SYSTEM_ISSUES,
        element: (
          <ProtectedRoute roles={[UserRole.SUPER_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <SystemHealthPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: PATHS.PROFILE,
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProfileSettingsPage />
          </Suspense>
        ),
      },
      {
        path: PATHS.SETTINGS,
        element: (
          <Suspense fallback={<PageLoader />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      {
        path: PATHS.EXPORTS,
        element: (
          <ProtectedRoute roles={[UserRole.CITY_ADMIN, UserRole.DEPARTMENT_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <ExportsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: PATHS.SUBMIT_ISSUE,
        element: (
          <ProtectedRoute
            roles={[UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN, UserRole.DEPARTMENT_ADMIN]}
          >
            <Suspense fallback={<PageLoader />}>
              <SubmitIssuePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: PATHS.MY_ISSUES,
        element: (
          <ProtectedRoute
            roles={[UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN, UserRole.DEPARTMENT_ADMIN]}
          >
            <Suspense fallback={<PageLoader />}>
              <MyIssuesPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: PATHS.WORKERS,
        element: (
          <ProtectedRoute roles={[UserRole.DEPARTMENT_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <WorkersPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: PATHS.MANUAL_REVIEW,
        element: (
          <ProtectedRoute roles={[UserRole.DEPARTMENT_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <ManualReviewPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: PATHS.FORWARD_REQUESTS,
        element: (
          <ProtectedRoute roles={[UserRole.DEPARTMENT_ADMIN]}>
            <Suspense fallback={<PageLoader />}>
              <ForwardRequestsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: PATHS.NOTIFICATIONS,
        element: (
          <ProtectedRoute
            roles={[UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN, UserRole.DEPARTMENT_ADMIN]}
          >
            <Suspense fallback={<PageLoader />}>
              <NotificationsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },

  // 404 catch-all
  {
    path: PATHS.NOT_FOUND,
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
])
