import { apiClient } from '@/services/api'
import type {
  PublicUpdate,
  PaginatedPublicUpdates,
} from '@/features/public/services/public.service'

export interface CreateUpdatePayload {
  title: string
  description?: string
  content: string
  category?: string
  thumbnail_url?: string
  read_time_minutes?: number
  is_published?: boolean
}

export interface UpdateUpdatePayload {
  title?: string
  description?: string
  content?: string
  category?: string
  thumbnail_url?: string
  read_time_minutes?: number
}

export const publicUpdatesAdminService = {
  async getAdminUpdates(
    page: number = 1,
    pageSize: number = 20,
    signal?: AbortSignal
  ): Promise<PaginatedPublicUpdates> {
    const { data } = await apiClient.get<PaginatedPublicUpdates>('/api/v1/super-admin/updates', {
      params: { page, page_size: pageSize },
      signal,
    })
    return data
  },

  async createUpdate(payload: CreateUpdatePayload): Promise<PublicUpdate> {
    const { data } = await apiClient.post<PublicUpdate>('/api/v1/super-admin/updates', payload)
    return data
  },

  async updateUpdate(updateId: number, payload: UpdateUpdatePayload): Promise<PublicUpdate> {
    const { data } = await apiClient.put<PublicUpdate>(
      `/api/v1/super-admin/updates/${updateId}`,
      payload
    )
    return data
  },

  async togglePublish(updateId: number, isPublished: boolean): Promise<PublicUpdate> {
    const { data } = await apiClient.post<PublicUpdate>(
      `/api/v1/super-admin/updates/${updateId}/publish`,
      null,
      { params: { is_published: isPublished } }
    )
    return data
  },

  async deleteUpdate(updateId: number): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.delete<{ success: boolean; message: string }>(
      `/api/v1/super-admin/updates/${updateId}`
    )
    return data
  },

  async uploadThumbnail(
    file: File
  ): Promise<{ success: boolean; filename: string; thumbnail_url: string }> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await apiClient.post<{
      success: boolean
      filename: string
      thumbnail_url: string
    }>('/api/v1/super-admin/updates/upload-thumbnail', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
