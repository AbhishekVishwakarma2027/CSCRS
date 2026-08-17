import { apiClient } from '@/services/api'
import type { FeedbackDashboardResponse } from '../types'

export const feedbackService = {
  /**
   * Fetch aggregate citizen feedback rating statistics.
   */
  async getFeedbackSummary(signal?: AbortSignal): Promise<FeedbackDashboardResponse> {
    const { data } = await apiClient.get<FeedbackDashboardResponse>('/api/v1/dashboard/feedback', {
      signal,
    })
    return data
  },

  /**
   * Export all citizen feedback records as a downloadable Excel (xlsx) or CSV file.
   */
  async exportFeedback(format: 'xlsx' | 'csv', signal?: AbortSignal): Promise<Blob> {
    const { data } = await apiClient.get<Blob>('/api/v1/feedback/export', {
      params: { format },
      responseType: 'blob',
      signal,
    })
    return data
  },

  /**
   * Submit user feedback.
   */
  async submitFeedback(
    payload: { rating: number; liked_text?: string; suggestion_text?: string },
    signal?: AbortSignal
  ): Promise<{ message: string; feedback_id: number }> {
    const { data } = await apiClient.post<{ message: string; feedback_id: number }>(
      '/api/v1/feedback',
      payload,
      {
        signal,
      }
    )
    return data
  },
}
