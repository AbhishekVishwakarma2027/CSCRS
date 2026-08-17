import { apiClient } from '@/services/api'
import type { ManualReviewItem, ManualReviewDetail, ResolutionResponse } from '../types'

export const resolutionsService = {
  async getPendingReviews(signal?: AbortSignal): Promise<ManualReviewItem[]> {
    const { data } = await apiClient.get<ManualReviewItem[]>('/api/v1/resolutions/manual-review', {
      signal,
    })
    return data
  },

  async getReviewDetails(reportId: number, signal?: AbortSignal): Promise<ManualReviewDetail> {
    const { data } = await apiClient.get<ManualReviewDetail>(
      `/api/v1/resolutions/manual-review/${reportId}`,
      { signal }
    )
    return data
  },

  async approveReview(reportId: number): Promise<ResolutionResponse> {
    const { data } = await apiClient.post<ResolutionResponse>(
      `/api/v1/resolutions/manual-review/${reportId}/approve`
    )
    return data
  },

  async rejectReview(reportId: number, reason: string): Promise<ResolutionResponse> {
    const { data } = await apiClient.post<ResolutionResponse>(
      `/api/v1/resolutions/manual-review/${reportId}/reject`,
      { reason }
    )
    return data
  },
}
