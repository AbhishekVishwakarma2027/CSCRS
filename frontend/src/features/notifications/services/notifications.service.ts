import { apiClient } from '@/services/api'
import type { NotificationItem, UnreadNotificationCount } from '../types'

export const notificationsService = {
  async getNotifications(signal?: AbortSignal): Promise<NotificationItem[]> {
    const { data } = await apiClient.get<NotificationItem[]>('/api/v1/notifications', {
      signal,
    })
    return data
  },

  async getUnreadCount(signal?: AbortSignal): Promise<UnreadNotificationCount> {
    const { data } = await apiClient.get<UnreadNotificationCount>(
      '/api/v1/notifications/unread-count',
      {
        signal,
      }
    )
    return data
  },

  async markAsRead(id: number): Promise<void> {
    await apiClient.patch(`/api/v1/notifications/${id}/read`)
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/api/v1/notifications/read-all')
  },
}
