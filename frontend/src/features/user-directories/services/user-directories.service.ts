import { apiClient } from '@/services/api'
import type {
  DepartmentAdminCreate,
  DepartmentAdminResponse,
  CityAdminCitizenItem,
  CityAdminDepartmentAdminItem,
  CityAdminCreate,
  CityAdminItem,
  BlockUserPayload,
} from '../types'

export const userDirectoriesService = {
  async createCityAdmin(data: CityAdminCreate): Promise<CityAdminItem> {
    const response = await apiClient.post<CityAdminItem>('/api/v1/city-admins', data)
    return response.data
  },

  async getCityAdmins(signal?: AbortSignal): Promise<CityAdminItem[]> {
    const { data } = await apiClient.get<CityAdminItem[]>('/api/v1/city-admins', { signal })
    return data
  },

  async blockCityAdmin(adminId: number, payload: BlockUserPayload): Promise<{ message: string }> {
    const { data } = await apiClient.patch<{ message: string }>(
      `/api/v1/city-admins/admins/${adminId}/block`,
      payload
    )
    return data
  },

  async unblockCityAdmin(adminId: number): Promise<{ message: string }> {
    const { data } = await apiClient.patch<{ message: string }>(
      `/api/v1/city-admins/admins/${adminId}/unblock`
    )
    return data
  },

  async createDepartmentAdmin(data: DepartmentAdminCreate): Promise<DepartmentAdminResponse> {
    const response = await apiClient.post<DepartmentAdminResponse>('/api/v1/admins', data)
    return response.data
  },

  async getCitizens(signal?: AbortSignal): Promise<CityAdminCitizenItem[]> {
    const { data } = await apiClient.get<CityAdminCitizenItem[]>('/api/v1/city-admins/citizens', {
      signal,
    })
    return data
  },

  async getDepartmentAdmins(signal?: AbortSignal): Promise<CityAdminDepartmentAdminItem[]> {
    const { data } = await apiClient.get<CityAdminDepartmentAdminItem[]>(
      '/api/v1/city-admins/department-admins',
      { signal }
    )
    return data
  },

  async blockCitizen(citizenId: number, payload: BlockUserPayload): Promise<{ message: string }> {
    const { data } = await apiClient.patch<{ message: string }>(
      `/api/v1/city-admins/citizens/${citizenId}/block`,
      payload
    )
    return data
  },

  async unblockCitizen(citizenId: number): Promise<{ message: string }> {
    const { data } = await apiClient.patch<{ message: string }>(
      `/api/v1/city-admins/citizens/${citizenId}/unblock`
    )
    return data
  },

  async blockDepartmentAdmin(
    adminId: number,
    payload: BlockUserPayload
  ): Promise<{ message: string }> {
    const { data } = await apiClient.patch<{ message: string }>(
      `/api/v1/city-admins/department-admins/${adminId}/block`,
      payload
    )
    return data
  },

  async unblockDepartmentAdmin(adminId: number): Promise<{ message: string }> {
    const { data } = await apiClient.patch<{ message: string }>(
      `/api/v1/city-admins/department-admins/${adminId}/unblock`
    )
    return data
  },
}
