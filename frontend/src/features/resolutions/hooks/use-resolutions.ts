import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { resolutionsService } from '../services/resolutions.service'

export function usePendingReviewsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['pending-reviews'],
    queryFn: ({ signal }) => resolutionsService.getPendingReviews(signal),
    enabled: options?.enabled ?? true,
  })
}

export function useReviewDetailsQuery(reportId: number | null) {
  return useQuery({
    queryKey: ['review-details', reportId],
    queryFn: ({ signal }) => resolutionsService.getReviewDetails(reportId!, signal),
    enabled: reportId !== null,
  })
}

export function useApproveReviewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reportId: number) => resolutionsService.approveReview(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-reviews'] })
      queryClient.invalidateQueries({ queryKey: ['review-details'] })
    },
  })
}

export function useRejectReviewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reportId, reason }: { reportId: number; reason: string }) =>
      resolutionsService.rejectReview(reportId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-reviews'] })
      queryClient.invalidateQueries({ queryKey: ['review-details'] })
    },
  })
}
