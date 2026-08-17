import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { UserRole } from '@/types/auth.types'
import { APP_CONFIG } from '@/config/app.config'
import { dashboardService } from '../services/dashboard.service'
import { DASHBOARD_QUERY_KEYS } from '../utils/query-keys'

// ─── Default Shared Configurations ───────────────────────────────────────────

const DEFAULT_QUERY_OPTIONS = {
  staleTime: 30000, // 30 seconds
  gcTime: 300000, // 5 minutes
  refetchInterval: APP_CONFIG.dashboardPollInterval,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  retry: 2,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
}

// Helper to check for administrative permissions
function useIsAdminAuthorized() {
  const { user } = useAuth()
  if (!user) return false
  return user.role === UserRole.CITY_ADMIN || user.role === UserRole.SUPER_ADMIN
}

// ─── Query Hooks ─────────────────────────────────────────────────────────────

/**
 * Hook for adaptive Dashboard Summary statistics.
 * Authorized: SuperAdmin, CityAdmin, DepartmentAdmin
 */
export function useDashboardSummary() {
  const { user } = useAuth()
  const isDeptAdmin = user?.role === UserRole.DEPARTMENT_ADMIN

  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.summary(),
    queryFn: ({ signal }) => dashboardService.getSummary(isDeptAdmin, signal),
    enabled: !!user,
    ...DEFAULT_QUERY_OPTIONS,
  })
}

/**
 * Hook for Status statistics.
 * Authorized: SuperAdmin, CityAdmin
 */
export function useDashboardStatus() {
  const isAuthorized = useIsAdminAuthorized()

  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.status(),
    queryFn: ({ signal }) => dashboardService.getStatusStats(signal),
    enabled: isAuthorized,
    ...DEFAULT_QUERY_OPTIONS,
  })
}

/**
 * Hook for Priority statistics.
 * Authorized: SuperAdmin, CityAdmin
 */
export function useDashboardPriorities() {
  const isAuthorized = useIsAdminAuthorized()

  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.priorities(),
    queryFn: ({ signal }) => dashboardService.getPriorityStats(signal),
    enabled: isAuthorized,
    ...DEFAULT_QUERY_OPTIONS,
  })
}

/**
 * Hook for Issue statistics.
 * Authorized: SuperAdmin, CityAdmin
 */
export function useDashboardIssues() {
  const isAuthorized = useIsAdminAuthorized()

  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.issues(),
    queryFn: ({ signal }) => dashboardService.getIssueStats(signal),
    enabled: isAuthorized,
    ...DEFAULT_QUERY_OPTIONS,
  })
}

/**
 * Hook for Monthly trend metrics.
 * Authorized: SuperAdmin, CityAdmin
 */
export function useDashboardMonthlyTrends(year: number = new Date().getFullYear()) {
  const isAuthorized = useIsAdminAuthorized()

  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.monthlyTrends(year),
    queryFn: ({ signal }) => dashboardService.getMonthlyTrends(year, signal),
    enabled: isAuthorized,
    ...DEFAULT_QUERY_OPTIONS,
  })
}

/**
 * Hook for Recent Reports.
 * Authorized: SuperAdmin, CityAdmin
 */
export function useDashboardRecentReports() {
  const isAuthorized = useIsAdminAuthorized()

  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.recentReports(),
    queryFn: ({ signal }) => dashboardService.getRecentReports(signal),
    enabled: isAuthorized,
    ...DEFAULT_QUERY_OPTIONS,
  })
}

/**
 * Hook for critical High Priority reports.
 * Authorized: SuperAdmin, CityAdmin
 */
export function useDashboardHighPriority() {
  const isAuthorized = useIsAdminAuthorized()

  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.highPriority(),
    queryFn: ({ signal }) => dashboardService.getHighPriorityReports(signal),
    enabled: isAuthorized,
    ...DEFAULT_QUERY_OPTIONS,
  })
}

/**
 * Hook for system bottleneck insights.
 * Authorized: SuperAdmin, CityAdmin
 */
export function useDashboardInsights() {
  const isAuthorized = useIsAdminAuthorized()

  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.insights(),
    queryFn: ({ signal }) => dashboardService.getInsights(signal),
    enabled: isAuthorized,
    ...DEFAULT_QUERY_OPTIONS,
  })
}
