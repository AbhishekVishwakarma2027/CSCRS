import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userDirectoriesService } from '../services/user-directories.service'
import type {
  DepartmentAdminCreate,
  CityAdminCitizenItem,
  CityAdminDepartmentAdminItem,
  CityAdminCreate,
  CityAdminItem,
  BlockUserPayload,
} from '../types'

export const USER_DIRECTORIES_QUERY_KEYS = {
  all: ['user-directories'] as const,
  citizens: () => [...USER_DIRECTORIES_QUERY_KEYS.all, 'citizens'] as const,
  departmentAdmins: () => [...USER_DIRECTORIES_QUERY_KEYS.all, 'department-admins'] as const,
  cityAdmins: () => [...USER_DIRECTORIES_QUERY_KEYS.all, 'city-admins'] as const,
}

export function useCityAdminsQuery() {
  return useQuery<CityAdminItem[], Error>({
    queryKey: USER_DIRECTORIES_QUERY_KEYS.cityAdmins(),
    queryFn: ({ signal }) => userDirectoriesService.getCityAdmins(signal),
    staleTime: 30 * 1000,
  })
}

export function useCreateCityAdminMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CityAdminCreate) => userDirectoriesService.createCityAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_DIRECTORIES_QUERY_KEYS.cityAdmins() })
    },
  })
}

export function useBlockCityAdminMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ adminId, payload }: { adminId: number; payload: BlockUserPayload }) =>
      userDirectoriesService.blockCityAdmin(adminId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_DIRECTORIES_QUERY_KEYS.cityAdmins() })
    },
  })
}

export function useUnblockCityAdminMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (adminId: number) => userDirectoriesService.unblockCityAdmin(adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_DIRECTORIES_QUERY_KEYS.cityAdmins() })
    },
  })
}

export function useCitizensQuery() {
  return useQuery<CityAdminCitizenItem[], Error>({
    queryKey: USER_DIRECTORIES_QUERY_KEYS.citizens(),
    queryFn: ({ signal }) => userDirectoriesService.getCitizens(signal),
    staleTime: 30 * 1000,
  })
}

export function useDepartmentAdminsQuery(enabled: boolean = true) {
  return useQuery<CityAdminDepartmentAdminItem[], Error>({
    queryKey: USER_DIRECTORIES_QUERY_KEYS.departmentAdmins(),
    queryFn: ({ signal }) => userDirectoriesService.getDepartmentAdmins(signal),
    enabled,
    staleTime: 30 * 1000,
  })
}

export function useCreateDepartmentAdminMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DepartmentAdminCreate) => userDirectoriesService.createDepartmentAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_DIRECTORIES_QUERY_KEYS.departmentAdmins() })
    },
  })
}

export function useBlockCitizenMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ citizenId, payload }: { citizenId: number; payload: BlockUserPayload }) =>
      userDirectoriesService.blockCitizen(citizenId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_DIRECTORIES_QUERY_KEYS.citizens() })
    },
  })
}

export function useUnblockCitizenMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (citizenId: number) => userDirectoriesService.unblockCitizen(citizenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_DIRECTORIES_QUERY_KEYS.citizens() })
    },
  })
}

export function useBlockDepartmentAdminMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ adminId, payload }: { adminId: number; payload: BlockUserPayload }) =>
      userDirectoriesService.blockDepartmentAdmin(adminId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_DIRECTORIES_QUERY_KEYS.departmentAdmins() })
    },
  })
}

export function useUnblockDepartmentAdminMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (adminId: number) => userDirectoriesService.unblockDepartmentAdmin(adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_DIRECTORIES_QUERY_KEYS.departmentAdmins() })
    },
  })
}
