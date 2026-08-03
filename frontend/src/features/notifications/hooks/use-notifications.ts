import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsService } from '../services/notifications.service'
import type { NotificationItem, UnreadNotificationCount } from '../types'

export const NOTIFICATIONS_QUERY_KEYS = {
  all: ['notifications'] as const,
  list: () => [...NOTIFICATIONS_QUERY_KEYS.all, 'list'] as const,
  unreadCount: () => [...NOTIFICATIONS_QUERY_KEYS.all, 'unread-count'] as const,
}

export function useNotificationsQuery() {
  return useQuery<NotificationItem[], Error>({
    queryKey: NOTIFICATIONS_QUERY_KEYS.list(),
    queryFn: ({ signal }) => notificationsService.getNotifications(signal),
    refetchInterval: 30000, // Poll every 30s
  })
}

export function useUnreadNotificationCountQuery() {
  return useQuery<UnreadNotificationCount, Error>({
    queryKey: NOTIFICATIONS_QUERY_KEYS.unreadCount(),
    queryFn: ({ signal }) => notificationsService.getUnreadCount(signal),
    refetchInterval: 30000, // Poll every 30s
  })
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.all })
    },
  })
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.all })
    },
  })
}
