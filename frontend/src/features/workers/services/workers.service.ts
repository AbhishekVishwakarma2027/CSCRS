import { apiClient } from '@/services/api'
import type { UserProfile } from '@/types/auth.types'

export interface WorkerCreatePayload {
  name: string
  email: string
  phone?: string
  employee_code: string
  designation: string
}

export interface MessageResponse {
  message: string
}

export const workersService = {
  async inviteWorker(payload: WorkerCreatePayload): Promise<UserProfile> {
    const { data } = await apiClient.post<UserProfile>('/api/v1/workers', payload)
    return data
  },

  async activateWorker(workerId: number): Promise<MessageResponse> {
    const { data } = await apiClient.patch<MessageResponse>(`/api/v1/workers/${workerId}/activate`)
    return data
  },

  async deactivateWorker(workerId: number): Promise<MessageResponse> {
    const { data } = await apiClient.patch<MessageResponse>(
      `/api/v1/workers/${workerId}/deactivate`
    )
    return data
  },

  async blockWorker(workerId: number, blockType: string, reason: string): Promise<MessageResponse> {
    const { data } = await apiClient.patch<MessageResponse>(`/api/v1/workers/${workerId}/block`, {
      block_type: blockType,
      reason,
    })
    return data
  },

  async unblockWorker(workerId: number): Promise<MessageResponse> {
    const { data } = await apiClient.patch<MessageResponse>(`/api/v1/workers/${workerId}/unblock`)
    return data
  },
}
