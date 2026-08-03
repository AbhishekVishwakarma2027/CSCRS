import { apiClient } from '@/services/api'
import type {
  SystemIssueListItem,
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
   * Fetch details of a specific system issue by issue number.
   * Access: Super Admin, City Admin
   */
  async getIssueDetail(issueNumber: string, signal?: AbortSignal): Promise<SystemIssueDetail> {
    const { data } = await apiClient.get<SystemIssueDetail>(`/api/v1/issues/${issueNumber}`, {
      signal,
    })
    return data
  },
}
