import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workersService } from '../services/workers.service'
import type { WorkerCreatePayload } from '../services/workers.service'

export const WORKERS_QUERY_KEYS = {
  all: ['workers'] as const,
  list: () => [...WORKERS_QUERY_KEYS.all, 'list'] as const,
}

export function useWorkersQuery() {
  return useQuery({
    queryKey: WORKERS_QUERY_KEYS.list(),
    queryFn: ({ signal }) => workersService.getWorkers(signal),
  })
}

export function useInviteWorkerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WorkerCreatePayload) => workersService.inviteWorker(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKERS_QUERY_KEYS.all })
    },
  })
}

export function useActivateWorkerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (workerId: number) => workersService.activateWorker(workerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKERS_QUERY_KEYS.all })
    },
  })
}

export function useDeactivateWorkerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (workerId: number) => workersService.deactivateWorker(workerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKERS_QUERY_KEYS.all })
    },
  })
}

export function useBlockWorkerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      workerId,
      blockType,
      reason,
    }: {
      workerId: number
      blockType: string
      reason: string
    }) => workersService.blockWorker(workerId, blockType, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKERS_QUERY_KEYS.all })
    },
  })
}

export function useUnblockWorkerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (workerId: number) => workersService.unblockWorker(workerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKERS_QUERY_KEYS.all })
    },
  })
}
