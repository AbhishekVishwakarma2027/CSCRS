import { apiClient } from '@/services/api'
import type {
  CityReportListItemApi,
  DepartmentReportListItemApi,
  PaginatedCityReportsApi,
  ReportListItem,
  PaginatedResponse,
  ReportFilters,
  ReportResponseApi,
  TimelineResponse,
  AdminReportDetailsResponseApi,
  AdminTimelineResponse,
} from '../types'

/**
 * Data Mapper: Translates Backend DTO models into Unified UI Presentation models.
 */
export function mapReportApiToUi(
  item: CityReportListItemApi | DepartmentReportListItemApi
): ReportListItem {
  return {
    id: item.id,
    report_number: item.report_number,
    issue_type: item.issue_type,
    status: item.status,
    priority: item.priority,
    department_id: 'department_id' in item ? item.department_id : undefined,
    citizen_id: item.citizen_id,
    created_at: item.created_at,
  }
}

export const reportsService = {
  /**
   * Fetch citywide paginated reports (City Admin).
   */
  async getCityReports(
    filters: ReportFilters,
    signal?: AbortSignal
  ): Promise<PaginatedResponse<ReportListItem>> {
    const { data } = await apiClient.get<PaginatedCityReportsApi>('/api/v1/reports', {
      params: {
        page: filters.page || 1,
        page_size: filters.page_size || 10,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        issue_type: filters.issue_type || undefined,
        department_id: filters.department_id || undefined,
      },
      signal,
    })

    return {
      items: data.items.map(mapReportApiToUi),
      total_items: data.pagination.total_items,
      page: data.pagination.page,
      page_size: data.pagination.page_size,
      total_pages: data.pagination.total_pages,
    }
  },

  /**
   * Fetch department-scoped reports (Department Admin).
   */
  async getDepartmentReports(
    filters: Omit<ReportFilters, 'page' | 'page_size'>,
    signal?: AbortSignal
  ): Promise<ReportListItem[]> {
    const { data } = await apiClient.get<DepartmentReportListItemApi[]>(
      '/api/v1/reports/department',
      {
        params: {
          status: filters.status || undefined,
          priority: filters.priority || undefined,
          issue_type: filters.issue_type || undefined,
        },
        signal,
      }
    )

    return data.map(mapReportApiToUi)
  },

  /**
   * Search all citywide reports by text (City Admin).
   */
  async searchCityReports(query: string, signal?: AbortSignal): Promise<ReportListItem[]> {
    const { data } = await apiClient.get<CityReportListItemApi[]>('/api/v1/reports/search', {
      params: { query },
      signal,
    })

    return data.map(mapReportApiToUi)
  },

  /**
   * Search department-scoped reports by text (Department Admin).
   */
  async searchDepartmentReports(query: string, signal?: AbortSignal): Promise<ReportListItem[]> {
    const { data } = await apiClient.get<DepartmentReportListItemApi[]>(
      '/api/v1/reports/department/search',
      {
        params: { query },
        signal,
      }
    )

    return data.map(mapReportApiToUi)
  },

  /**
   * Assign worker (manual or auto) for a report.
   */
  async assignReport(
    reportId: number,
    workerId?: number,
    remarks?: string,
    signal?: AbortSignal
  ): Promise<unknown> {
    const { data } = await apiClient.post(
      '/api/v1/assignments',
      {
        report_id: reportId,
        worker_id: workerId || undefined,
        remarks: remarks || undefined,
      },
      { signal }
    )
    return data
  },

  /**
   * Cancel an active report with reason and remarks.
   */
  async cancelReport(
    reportId: number,
    reasonType: string,
    remarks?: string,
    signal?: AbortSignal
  ): Promise<unknown> {
    const { data } = await apiClient.post(
      `/api/v1/reports/${reportId}/cancel`,
      {
        reason_type: reasonType,
        remarks: remarks || undefined,
      },
      { signal }
    )
    return data
  },

  /**
   * Reopen a cancelled or resolved report.
   */
  async reopenReport(reportId: number, reason?: string, signal?: AbortSignal): Promise<unknown> {
    const { data } = await apiClient.post(
      `/api/v1/reports/${reportId}/reopen`,
      {
        reason: reason || undefined,
      },
      { signal }
    )
    return data
  },

  async getDepartments(
    signal?: AbortSignal
  ): Promise<{ id: number; name: string; code: string }[]> {
    const { data } = await apiClient.get<{ id: number; name: string; code: string }[]>(
      '/api/v1/departments',
      { signal }
    )
    return data
  },

  /**
   * Fetch details of a specific report.
   */
  async getReportDetails(reportNumber: string, signal?: AbortSignal): Promise<ReportResponseApi> {
    const { data } = await apiClient.get<ReportResponseApi>(`/api/v1/reports/${reportNumber}`, {
      signal,
    })
    return data
  },

  /**
   * Fetch chronological timeline of a specific report.
   */
  async getReportTimeline(reportId: number, signal?: AbortSignal): Promise<TimelineResponse> {
    const { data } = await apiClient.get<TimelineResponse>(`/api/v1/reports/${reportId}/timeline`, {
      signal,
    })
    return data
  },

  /**
   * Download the City Performance Report (PDF).
   */
  async downloadCityReport(signal?: AbortSignal): Promise<Blob> {
    const { data } = await apiClient.get<Blob>('/api/v1/reports/city/download', {
      responseType: 'blob',
      signal,
    })
    return data
  },

  /**
   * Download the Department Performance Report (PDF).
   */
  async downloadDepartmentReport(signal?: AbortSignal): Promise<Blob> {
    const { data } = await apiClient.get<Blob>('/api/v1/reports/department/download', {
      responseType: 'blob',
      signal,
    })
    return data
  },
  /**
   * Fetch the Admin version of report details.
   */
  async getAdminReportDetails(
    reportId: number,
    signal?: AbortSignal
  ): Promise<AdminReportDetailsResponseApi> {
    const { data } = await apiClient.get<AdminReportDetailsResponseApi>(
      `/api/v1/reports/${reportId}/admin`,
      {
        signal,
      }
    )
    return data
  },

  /**
   * Fetch the Admin chronological timeline of a specific report.
   */
  async getAdminReportTimeline(
    reportId: number,
    signal?: AbortSignal
  ): Promise<AdminTimelineResponse> {
    const { data } = await apiClient.get<AdminTimelineResponse>(
      `/api/v1/reports/${reportId}/admin/timeline`,
      {
        signal,
      }
    )
    return data
  },

  /**
   * Download the Admin image as a Blob (Authenticated).
   */
  async getAdminReportImage(
    reportId: number,
    type: 'original' | 'annotated' | 'resolution',
    signal?: AbortSignal
  ): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(`/api/v1/reports/${reportId}/admin/image`, {
      params: { type },
      responseType: 'blob',
      signal,
    })
    return data
  },
}
