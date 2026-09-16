import { apiClient } from '@/services/api'
import type { UserProfile } from '@/types/auth.types'

export interface WorkerCreatePayload {
  name: string
  email: string
  phone?: string
  employee_code: string
  designation: string
}

export interface WorkerDirectoryItem {
  id: number
  user_id: number
  name: string
  email: string
  phone: string | null
  department_id: number
  employee_code: string
  designation: string
  phone_extension: string | null
  is_available: boolean
  is_active: boolean
  is_email_verified: boolean
  is_blocked: boolean
  joined_at: string
}

export interface MessageResponse {
  message: string
}

export const workersService = {
  async getWorkers(signal?: AbortSignal): Promise<WorkerDirectoryItem[]> {
    const { data } = await apiClient.get<WorkerDirectoryItem[]>('/api/v1/admins/workers', {
      signal,
    })
    return data
  },

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
