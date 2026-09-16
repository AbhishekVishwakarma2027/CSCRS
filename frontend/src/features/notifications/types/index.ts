export interface NotificationItem {
  id: number
  report_id: number | null
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  starts_at?: string | null
  ends_at?: string | null
  announcement_type?: string | null
  broadcast_id?: string | null
}

export interface UnreadNotificationCount {
  unread_count: number
}
