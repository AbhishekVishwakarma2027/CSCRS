import { apiClient } from '@/services/api'
import type { DepartmentResponseApi } from '../types'

export const departmentsService = {
  /**
   * Fetch all municipal departments.
   */
  async getDepartments(signal?: AbortSignal): Promise<DepartmentResponseApi[]> {
    const { data } = await apiClient.get<DepartmentResponseApi[]>('/api/v1/departments', { signal })
    return data
  },

  /**
   * Fetch a single department.
   */
  async getDepartment(id: number, signal?: AbortSignal): Promise<DepartmentResponseApi> {
    const { data } = await apiClient.get<DepartmentResponseApi>(`/api/v1/departments/${id}`, {
      signal,
    })
    return data
  },

  /**
   * Create a new department (Super Admin only).
   */
  async createDepartment(
    payload: { name: string; description?: string },
    signal?: AbortSignal
  ): Promise<DepartmentResponseApi> {
    const { data } = await apiClient.post<DepartmentResponseApi>('/api/v1/departments', payload, {
      signal,
    })
    return data
  },

  /**
   * Activate a department.
   */
  async activateDepartment(id: number, signal?: AbortSignal): Promise<{ message: string }> {
    const { data } = await apiClient.patch<{ message: string }>(
      `/api/v1/departments/${id}/activate`,
      {},
      { signal }
    )
    return data
  },

  /**
   * Deactivate a department.
   */
  async deactivateDepartment(id: number, signal?: AbortSignal): Promise<{ message: string }> {
    const { data } = await apiClient.patch<{ message: string }>(
      `/api/v1/departments/${id}/deactivate`,
      {},
      { signal }
    )
    return data
  },
}
