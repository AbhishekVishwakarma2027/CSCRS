import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportsService } from '../services/reports.service'
import type {
  ReportFilters,
  ReportListItem,
  PaginatedResponse,
  ReportResponseApi,
  TimelineResponse,
  AdminReportDetailsResponseApi,
  AdminTimelineResponse,
} from '../types'
import { UserRole } from '@/types/auth.types'

export const REPORTS_QUERY_KEYS = {
  all: ['reports'] as const,
  lists: () => [...REPORTS_QUERY_KEYS.all, 'list'] as const,
  list: (role: string, filters: ReportFilters) =>
    [...REPORTS_QUERY_KEYS.lists(), role, filters] as const,
  details: () => [...REPORTS_QUERY_KEYS.all, 'detail'] as const,
  detail: (reportNumber: string) => [...REPORTS_QUERY_KEYS.details(), reportNumber] as const,
  timelines: () => [...REPORTS_QUERY_KEYS.all, 'timeline'] as const,
  timeline: (reportId: number) => [...REPORTS_QUERY_KEYS.timelines(), reportId] as const,
  manualReviews: () => [...REPORTS_QUERY_KEYS.all, 'manual-review'] as const,
  manualReview: (reportId: number) => [...REPORTS_QUERY_KEYS.manualReviews(), reportId] as const,
  forwardRequests: () => [...REPORTS_QUERY_KEYS.all, 'forward-request'] as const,
  forwardRequest: (requestId: number) =>
    [...REPORTS_QUERY_KEYS.forwardRequests(), requestId] as const,
} as const

/**
 * Custom query hook that resolves role and filters to fetch reports cleanly.
 * Automatically wraps flat array data to paginated layouts for uniform component bindings.
 */
export function useReportsListQuery(role: string, filters: ReportFilters) {
  return useQuery<PaginatedResponse<ReportListItem>, Error>({
    queryKey: REPORTS_QUERY_KEYS.list(role, filters),
    queryFn: async ({ signal }) => {
      const isCityAdmin = role === UserRole.CITY_ADMIN || role === UserRole.SUPER_ADMIN

      if (isCityAdmin) {
        if (filters.q) {
          const flatItems = await reportsService.searchCityReports(filters.q, signal)
          return {
            items: flatItems,
            total_items: flatItems.length,
            page: 1,
            page_size: flatItems.length,
            total_pages: 1,
          }
        }

        return reportsService.getCityReports(filters, signal)
      } else {
        // Department Admin role
        if (filters.q) {
          const flatItems = await reportsService.searchDepartmentReports(filters.q, signal)
          return {
            items: flatItems,
            total_items: flatItems.length,
            page: 1,
            page_size: flatItems.length,
            total_pages: 1,
          }
        }

        const flatItems = await reportsService.getDepartmentReports(filters, signal)
        return {
          items: flatItems,
          total_items: flatItems.length,
          page: 1,
          page_size: flatItems.length,
          total_pages: 1,
        }
      }
    },
    staleTime: 30000, // 30 seconds stale time
    gcTime: 5 * 60 * 1000, // 5 minutes cache retention
  })
}

/**
 * Mutation to auto-assign a report to a worker.
 */
export function useAssignReportMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reportId, remarks }: { reportId: number; remarks?: string }) =>
      reportsService.assignReport(reportId, remarks),
    onSuccess: () => {
      // Invalidate queries to sync states citywide
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/**
 * Mutation to cancel an active report.
 */
export function useCancelReportMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      reportId,
      reasonType,
      remarks,
    }: {
      reportId: number
      reasonType: string
      remarks?: string
    }) => reportsService.cancelReport(reportId, reasonType, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/**
 * Mutation to reopen a cancelled or resolved report.
 */
export function useReopenReportMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reportId, reason }: { reportId: number; reason?: string }) =>
      reportsService.reopenReport(reportId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/**
 * Fetch all municipal departments (City Admin / Super Admin only).
 */
export function useDepartmentsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['departments', 'list'],
    queryFn: ({ signal }) => reportsService.getDepartments(signal),
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Query to fetch details of a specific report.
 */
export function useReportDetailsQuery(reportNumber: string, enabled: boolean) {
  return useQuery<ReportResponseApi, Error>({
    queryKey: REPORTS_QUERY_KEYS.detail(reportNumber),
    queryFn: ({ signal }) => reportsService.getReportDetails(reportNumber, signal),
    enabled,
    staleTime: 30 * 1000,
    retry: 1,
  })
}

/**
 * Query to fetch chronological timeline of a specific report.
 */
export function useReportTimelineQuery(reportId: number, enabled: boolean) {
  return useQuery<TimelineResponse, Error>({
    queryKey: REPORTS_QUERY_KEYS.timeline(reportId),
    queryFn: ({ signal }) => reportsService.getReportTimeline(reportId, signal),
    enabled,
    staleTime: 30 * 1000,
    retry: 1,
  })
}

/**
 * Query to fetch the Admin version of report details.
 */
export function useAdminReportDetailsQuery(reportId: number, enabled: boolean) {
  return useQuery<AdminReportDetailsResponseApi, Error>({
    queryKey: [...REPORTS_QUERY_KEYS.details(), 'admin', reportId],
    queryFn: ({ signal }) => reportsService.getAdminReportDetails(reportId, signal),
    enabled,
    staleTime: 30 * 1000,
    retry: 1,
  })
}

/**
 * Query to fetch the Admin chronological timeline of a specific report.
 */
export function useAdminReportTimelineQuery(reportId: number, enabled: boolean) {
  return useQuery<AdminTimelineResponse, Error>({
    queryKey: [...REPORTS_QUERY_KEYS.timelines(), 'admin', reportId],
    queryFn: ({ signal }) => reportsService.getAdminReportTimeline(reportId, signal),
    enabled,
    staleTime: 30 * 1000,
    retry: 1,
  })
}
