import { apiClient } from '@/services/api'
import type { DepartmentAdminCreate, DepartmentAdminResponse } from '../types'

export const userDirectoriesService = {
  async createDepartmentAdmin(data: DepartmentAdminCreate): Promise<DepartmentAdminResponse> {
    const response = await apiClient.post<DepartmentAdminResponse>('/api/v1/admins', data)
    return response.data
  },
}
