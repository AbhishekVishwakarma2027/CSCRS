import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { forwardRequestsService } from '../services/forward-requests.service'
import type { ForwardReasonType } from '../types'

export function usePendingRequestsQuery() {
  return useQuery({
    queryKey: ['pending-forwards'],
    queryFn: ({ signal }) => forwardRequestsService.getPendingRequests(signal),
  })
}

export function useIncomingRequestsQuery() {
  return useQuery({
    queryKey: ['incoming-forwards'],
    queryFn: ({ signal }) => forwardRequestsService.getIncomingRequests(signal),
  })
}

export function useForwardDetailsQuery(requestId: number | null) {
  return useQuery({
    queryKey: ['forward-details', requestId],
    queryFn: ({ signal }) => forwardRequestsService.getRequestDetails(requestId!, signal),
    enabled: requestId !== null,
  })
}

export function useApproveForwardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      requestId,
      payload,
    }: {
      requestId: number
      payload: { department_id: number; reason_type: ForwardReasonType; remarks: string }
    }) => forwardRequestsService.approveRequest(requestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-forwards'] })
      queryClient.invalidateQueries({ queryKey: ['incoming-forwards'] })
    },
  })
}

export function useRejectForwardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, reason }: { requestId: number; reason: string }) =>
      forwardRequestsService.rejectRequest(requestId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-forwards'] })
      queryClient.invalidateQueries({ queryKey: ['incoming-forwards'] })
    },
  })
}

export function useAcceptForwardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: number) => forwardRequestsService.acceptRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-forwards'] })
      queryClient.invalidateQueries({ queryKey: ['incoming-forwards'] })
    },
  })
}

export function useDeclineForwardMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, reason }: { requestId: number; reason: string }) =>
      forwardRequestsService.declineRequest(requestId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-forwards'] })
      queryClient.invalidateQueries({ queryKey: ['incoming-forwards'] })
    },
  })
}
