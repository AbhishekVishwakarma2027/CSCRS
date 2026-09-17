import { apiClient } from '@/services/api'
import type {
  PaginatedAuditLogResponse,
  PaginatedLoginAuditResponse,
  SystemHealthResponse,
  AITelemetryResponse,
  AnnouncementRequest,
  AnnouncementResponse,
  AnnouncementItemResponse,
  AuditLogFilters,
  LoginAuditFilters,
} from '../types'

export const superAdminService = {
  /**
   * Fetch paginated system audit logs.
   */
  async getAuditLogs(
    filters?: AuditLogFilters,
    signal?: AbortSignal
  ): Promise<PaginatedAuditLogResponse> {
    const { data } = await apiClient.get<PaginatedAuditLogResponse>(
      '/api/v1/super-admin/audit-logs',
      {
        params: filters,
        signal,
      }
    )
    return data
  },

  /**
   * Export system audit logs in CSV or XLSX format as a Blob.
   */
  async exportAuditLogs(format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await apiClient.get('/api/v1/super-admin/audit-logs/export', {
      params: { format },
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Fetch paginated user login security audits.
   */
  async getLoginAudits(
    filters?: LoginAuditFilters,
    signal?: AbortSignal
  ): Promise<PaginatedLoginAuditResponse> {
    const { data } = await apiClient.get<PaginatedLoginAuditResponse>(
      '/api/v1/super-admin/login-audits',
      {
        params: filters,
        signal,
      }
    )
    return data
  },

  /**
   * Fetch platform system health and entity summary statistics.
   */
  async getSystemHealth(signal?: AbortSignal): Promise<SystemHealthResponse> {
    const { data } = await apiClient.get<SystemHealthResponse>('/api/v1/super-admin/health', {
      signal,
    })
    return data
  },

  /**
   * Fetch AI model detection & verification telemetry.
   */
  async getAITelemetry(signal?: AbortSignal): Promise<AITelemetryResponse> {
    const { data } = await apiClient.get<AITelemetryResponse>('/api/v1/super-admin/ai-telemetry', {
      signal,
    })
    return data
  },

  /**
   * Broadcast a platform-wide system announcement.
   */
  async broadcastAnnouncement(payload: AnnouncementRequest): Promise<AnnouncementResponse> {
    const { data } = await apiClient.post<AnnouncementResponse>(
      '/api/v1/super-admin/announcements',
      payload
    )
    return data
  },

  /**
   * Fetch list of system announcements lifecycle summary.
   */
  async getAnnouncements(
    lifecycleState: string = 'ALL',
    announcementType: string = 'ALL',
    signal?: AbortSignal
  ): Promise<AnnouncementItemResponse[]> {
    const { data } = await apiClient.get<AnnouncementItemResponse[]>(
      '/api/v1/super-admin/announcements',
      {
        params: {
          lifecycle_state: lifecycleState,
          announcement_type: announcementType,
        },
        signal,
      }
    )
    return data
  },

  /**
   * End an active announcement for all recipients by broadcast ID.
   */
  async endAnnouncement(broadcastId: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.patch(`/api/v1/super-admin/announcements/${broadcastId}/end`)
    return data
  },

  /**
   * Delete a scheduled announcement by broadcast ID.
   */
  async deleteAnnouncement(broadcastId: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.delete(`/api/v1/super-admin/announcements/${broadcastId}`)
    return data
  },

  /**
   * Export full AI training & detection dataset in CSV or XLSX format (Super Admin only).
   */
  async exportAIDataset(format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await apiClient.get('/api/v1/ai-dataset/export', {
      params: { format },
      responseType: 'blob',
    })
    return response.data
  },
}
