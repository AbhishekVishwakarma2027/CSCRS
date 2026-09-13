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
}

export interface SystemIssueResponse {
  message: string
  issue_number: string
}
