import { apiClient } from '@/services/api'
import type {
  SystemIssueListItem,
  MySystemIssueItem,
  SystemIssueDetail,
  SystemIssueCategory,
  SystemIssueStatus,
} from '../types'

export interface SystemIssueFilters {
  status?: SystemIssueStatus | string
  category?: SystemIssueCategory | string
  reporter?: string
  search?: string
}

export const systemIssuesService = {
  /**
   * Fetch all system issues based on optional filters.
   * Access: Super Admin, City Admin
   */
  async getIssues(
    filters?: SystemIssueFilters,
    signal?: AbortSignal
  ): Promise<SystemIssueListItem[]> {
    const { data } = await apiClient.get<SystemIssueListItem[]>('/api/v1/issues', {
      params: filters,
      signal,
    })
    return data
  },

  /**
   * Fetch system issues submitted by the currently authenticated user.
   */
  async getMyIssues(
    filters?: Omit<SystemIssueFilters, 'reporter'>,
    signal?: AbortSignal
  ): Promise<MySystemIssueItem[]> {
    const { data } = await apiClient.get<MySystemIssueItem[]>('/api/v1/issues/my', {
      params: filters,
      signal,
    })
    return data
  },

  /**
   * Fetch details of a specific system issue by issue number.
   * Access: Super Admin, City Admin, or Issue Reporter
   */
  async getIssueDetail(issueNumber: string, signal?: AbortSignal): Promise<SystemIssueDetail> {
    const { data } = await apiClient.get<SystemIssueDetail>(`/api/v1/issues/${issueNumber}`, {
      signal,
    })
    return data
  },

  /**
   * Submit a new system issue with optional attachment.
   */
  async submitIssue(formData: FormData): Promise<SystemIssueResponse> {
    const { data } = await apiClient.post<SystemIssueResponse>('/api/v1/issues', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },

  /**
   * Fetch a system issue attachment securely as a Blob using the authenticated apiClient.
   */
  async getAttachmentBlob(filePath: string, signal?: AbortSignal): Promise<Blob> {
    const normalizedPath = filePath.replace(/\\/g, '/')
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`
    const { data } = await apiClient.get<Blob>(cleanPath, {
      responseType: 'blob',
      signal,
    })
    return data
  },

  /**
   * Update a system issue status and remarks (Super Admin only).
   */
  async updateIssueStatus(
    issueNumber: string,
    payload: { status: SystemIssueStatus | string; remarks?: string }
  ): Promise<{ message: string }> {
    const { data } = await apiClient.patch<{ message: string }>(
      `/api/v1/issues/${issueNumber}/status`,
      payload
    )
    return data
  },

  /**
   * Export all system issues as a CSV or Excel Blob (Super Admin only).
   */
  async exportIssues(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const { data } = await apiClient.get<Blob>('/api/v1/issues/export', {
      params: { format },
      responseType: 'blob',
    })
    return data
  },
}

export interface SystemIssueResponse {
  message: string
  issue_number: string
}
