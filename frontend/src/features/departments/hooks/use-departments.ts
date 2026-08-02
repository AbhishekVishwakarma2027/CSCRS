import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentsService } from '../services/departments.service'
import type { DepartmentResponseApi } from '../types'

export const DEPARTMENTS_QUERY_KEYS = {
  all: ['departments'] as const,
  lists: () => [...DEPARTMENTS_QUERY_KEYS.all, 'list'] as const,
  details: () => [...DEPARTMENTS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...DEPARTMENTS_QUERY_KEYS.details(), id] as const,
}

/**
 * Fetch all municipal departments.
 */
export function useDepartmentsQuery() {
  return useQuery<DepartmentResponseApi[], Error>({
    queryKey: DEPARTMENTS_QUERY_KEYS.lists(),
    queryFn: ({ signal }) => departmentsService.getDepartments(signal),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch a single department by ID.
 */
export function useDepartmentDetailQuery(id: number, enabled: boolean) {
  return useQuery<DepartmentResponseApi, Error>({
    queryKey: DEPARTMENTS_QUERY_KEYS.detail(id),
    queryFn: ({ signal }) => departmentsService.getDepartment(id, signal),
    enabled,
    staleTime: 30 * 1000,
  })
}

/**
 * Create a new department.
 */
export function useCreateDepartmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      departmentsService.createDepartment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEYS.all })
    },
  })
}

/**
 * Activate a department.
 */
export function useActivateDepartmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => departmentsService.activateDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEYS.all })
    },
  })
}

/**
 * Deactivate a department.
 */
export function useDeactivateDepartmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => departmentsService.deactivateDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEYS.all })
    },
  })
}
