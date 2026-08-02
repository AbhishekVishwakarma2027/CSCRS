import { useQuery } from '@tanstack/react-query'
import { feedbackService } from '../services/feedback.service'
import type { FeedbackDashboardResponse } from '../types'

export const FEEDBACK_QUERY_KEYS = {
  all: ['feedback'] as const,
  summary: () => [...FEEDBACK_QUERY_KEYS.all, 'summary'] as const,
}

/**
 * Hook to retrieve citizen feedback aggregate metrics.
 */
export function useFeedbackSummaryQuery() {
  return useQuery<FeedbackDashboardResponse, Error>({
    queryKey: FEEDBACK_QUERY_KEYS.summary(),
    queryFn: ({ signal }) => feedbackService.getFeedbackSummary(signal),
    staleTime: 2 * 60 * 1000,
  })
}
