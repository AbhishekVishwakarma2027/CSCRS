import { useMutation } from '@tanstack/react-query'
import { workersService } from '../services/workers.service'
import type { WorkerCreatePayload } from '../services/workers.service'

export function useInviteWorkerMutation() {
  return useMutation({
    mutationFn: (payload: WorkerCreatePayload) => workersService.inviteWorker(payload),
  })
}

export function useActivateWorkerMutation() {
  return useMutation({
    mutationFn: (workerId: number) => workersService.activateWorker(workerId),
  })
}

export function useDeactivateWorkerMutation() {
  return useMutation({
    mutationFn: (workerId: number) => workersService.deactivateWorker(workerId),
  })
}

export function useBlockWorkerMutation() {
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
  })
}

export function useUnblockWorkerMutation() {
  return useMutation({
    mutationFn: (workerId: number) => workersService.unblockWorker(workerId),
  })
}
