import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileService } from '../services/profile.service'
import type { UpdateProfileRequest } from '../types'

export const PROFILE_QUERY_KEYS = {
  all: ['profile'] as const,
  me: () => [...PROFILE_QUERY_KEYS.all, 'me'] as const,
}

export function useMyProfileQuery() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEYS.me(),
    queryFn: ({ signal }) => profileService.getMyProfile(signal),
  })
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => profileService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.me() })
    },
  })
}

export function useUploadProfilePhotoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => profileService.uploadPhoto(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.me() })
    },
  })
}

export function useDeleteProfilePhotoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => profileService.deletePhoto(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.me() })
    },
  })
}
