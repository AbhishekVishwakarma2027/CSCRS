import { useQuery, useMutation } from '@tanstack/react-query'
import { feedbackService } from '../services/feedback.service'
import type { FeedbackDashboardResponse } from '../types'

export const FEEDBACK_QUERY_KEYS = {
  all: ['feedback'] as const,
  summary: () => [...FEEDBACK_QUERY_KEYS.all, 'summary'] as const,
}

/**
 * Hook to retrieve citizen feedback aggregate metrics.
 */
export function useFeedbackSummaryQuery(enabled = true) {
  return useQuery<FeedbackDashboardResponse, Error>({
    queryKey: FEEDBACK_QUERY_KEYS.summary(),
    queryFn: ({ signal }) => feedbackService.getFeedbackSummary(signal),
    staleTime: 2 * 60 * 1000,
    enabled,
  })
}

/**
 * Mutation hook to submit feedback.
 */
export function useSubmitFeedbackMutation() {
  return useMutation({
    mutationFn: (payload: { rating: number; liked_text?: string; suggestion_text?: string }) =>
      feedbackService.submitFeedback(payload),
  })
}
