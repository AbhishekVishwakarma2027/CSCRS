import { apiClient } from '@/services/api'
import type {
  CityDashboardSummaryResponse,
  DepartmentDashboardResponse,
  IssueStatisticsItem,
  StatusStatisticsItem,
  PriorityStatisticsItem,
  MonthlyTrendItem,
  RecentReportItem,
  HighPriorityReportItem,
  DashboardInsightItem,
} from '../types'

export const dashboardService = {
  /**
   * Fetch high-level summary statistics.
   * Adaptive return type depending on authenticated user role.
   */
  async getSummary(
    signal?: AbortSignal
  ): Promise<CityDashboardSummaryResponse | DepartmentDashboardResponse> {
    const { data } = await apiClient.get<
      CityDashboardSummaryResponse | DepartmentDashboardResponse
    >('/api/v1/dashboard/summary', { signal })
    return data
  },

  /**
   * Fetch count statistics grouped by report status.
   */
  async getStatusStats(signal?: AbortSignal): Promise<StatusStatisticsItem[]> {
    const { data } = await apiClient.get<StatusStatisticsItem[]>('/api/v1/dashboard/status', {
      signal,
    })
    return data
  },

  /**
   * Fetch count statistics grouped by report priority.
   */
  async getPriorityStats(signal?: AbortSignal): Promise<PriorityStatisticsItem[]> {
    const { data } = await apiClient.get<PriorityStatisticsItem[]>('/api/v1/dashboard/priorities', {
      signal,
    })
    return data
  },

  /**
   * Fetch count statistics grouped by civic issue category.
   */
  async getIssueStats(signal?: AbortSignal): Promise<IssueStatisticsItem[]> {
    const { data } = await apiClient.get<IssueStatisticsItem[]>('/api/v1/dashboard/issues', {
      signal,
    })
    return data
  },

  /**
   * Fetch monthly volume trend logs.
   */
  async getMonthlyTrends(year: number, signal?: AbortSignal): Promise<MonthlyTrendItem[]> {
    const { data } = await apiClient.get<MonthlyTrendItem[]>(`/api/v1/dashboard/monthly-trends`, {
      params: { year },
      signal,
    })
    return data
  },

  /**
   * Fetch recent reports audit logs.
   */
  async getRecentReports(signal?: AbortSignal): Promise<RecentReportItem[]> {
    const { data } = await apiClient.get<RecentReportItem[]>('/api/v1/dashboard/recent-reports', {
      signal,
    })
    return data
  },

  /**
   * Fetch unresolved high priority critical reports queue.
   */
  async getHighPriorityReports(signal?: AbortSignal): Promise<HighPriorityReportItem[]> {
    const { data } = await apiClient.get<HighPriorityReportItem[]>(
      '/api/v1/dashboard/high-priority',
      {
        signal,
      }
    )
    return data
  },

  /**
   * Fetch platform alerts and bottleneck insights.
   */
  async getInsights(signal?: AbortSignal): Promise<DashboardInsightItem[]> {
    const { data } = await apiClient.get<DashboardInsightItem[]>('/api/v1/dashboard/insights', {
      signal,
    })
    return data
  },
}
