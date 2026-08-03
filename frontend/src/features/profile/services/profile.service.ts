import { apiClient } from '@/services/api'
import type { ProfileResponse, UpdateProfileRequest } from '../types'

export const profileService = {
  async getMyProfile(signal?: AbortSignal): Promise<ProfileResponse> {
    const { data } = await apiClient.get<ProfileResponse>('/api/v1/profile/me', {
      signal,
    })
    return data
  },

  async updateProfile(updateData: UpdateProfileRequest): Promise<{ message: string }> {
    const { data } = await apiClient.patch<{ message: string }>('/api/v1/profile/me', updateData)
    return data
  },

  async uploadPhoto(file: File): Promise<{ message: string; url: string }> {
    const formData = new FormData()
    formData.append('photo', file)

    const { data } = await apiClient.post<{ message: string; url: string }>(
      '/api/v1/profile/photo',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return data
  },

  async deletePhoto(): Promise<{ message: string }> {
    const { data } = await apiClient.delete<{ message: string }>('/api/v1/profile/photo')
    return data
  },
}
