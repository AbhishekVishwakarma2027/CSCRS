import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  publicUpdatesAdminService,
  type CreateUpdatePayload,
  type UpdateUpdatePayload,
} from '../services/public-updates-admin.service'

export const PUBLIC_UPDATES_ADMIN_KEYS = {
  all: ['admin-public-updates'] as const,
  list: (page: number, pageSize: number) =>
    [...PUBLIC_UPDATES_ADMIN_KEYS.all, 'list', page, pageSize] as const,
}

export function useAdminPublicUpdatesQuery(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: PUBLIC_UPDATES_ADMIN_KEYS.list(page, pageSize),
    queryFn: ({ signal }) => publicUpdatesAdminService.getAdminUpdates(page, pageSize, signal),
  })
}

export function useCreatePublicUpdateMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUpdatePayload) => publicUpdatesAdminService.createUpdate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PUBLIC_UPDATES_ADMIN_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['public-updates'] })
    },
  })
}

export function useUpdatePublicUpdateMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ updateId, payload }: { updateId: number; payload: UpdateUpdatePayload }) =>
      publicUpdatesAdminService.updateUpdate(updateId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PUBLIC_UPDATES_ADMIN_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['public-updates'] })
      queryClient.invalidateQueries({ queryKey: ['public-update-detail'] })
    },
  })
}

export function useTogglePublishPublicUpdateMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ updateId, isPublished }: { updateId: number; isPublished: boolean }) =>
      publicUpdatesAdminService.togglePublish(updateId, isPublished),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PUBLIC_UPDATES_ADMIN_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['public-updates'] })
      queryClient.invalidateQueries({ queryKey: ['public-update-detail'] })
    },
  })
}

export function useDeletePublicUpdateMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (updateId: number) => publicUpdatesAdminService.deleteUpdate(updateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PUBLIC_UPDATES_ADMIN_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['public-updates'] })
      queryClient.invalidateQueries({ queryKey: ['public-update-detail'] })
    },
  })
}

export function useUploadThumbnailMutation() {
  return useMutation({
    mutationFn: (file: File) => publicUpdatesAdminService.uploadThumbnail(file),
  })
}
