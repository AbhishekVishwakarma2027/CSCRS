import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userDirectoriesService } from '../services/user-directories.service'
import type { DepartmentAdminCreate } from '../types'

export const USER_DIRECTORIES_QUERY_KEYS = {
  all: ['user-directories'] as const,
  departmentAdmins: () => [...USER_DIRECTORIES_QUERY_KEYS.all, 'department-admins'] as const,
}

export function useCreateDepartmentAdminMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DepartmentAdminCreate) => userDirectoriesService.createDepartmentAdmin(data),
    onSuccess: () => {
      // Invalidate listing queries when they exist
      queryClient.invalidateQueries({ queryKey: USER_DIRECTORIES_QUERY_KEYS.departmentAdmins() })
    },
  })
}
