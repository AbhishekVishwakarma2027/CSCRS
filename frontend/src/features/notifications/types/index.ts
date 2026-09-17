export interface NotificationItem {
  id: number
  report_id: number | null
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export interface UnreadNotificationCount {
  unread_count: number
}
