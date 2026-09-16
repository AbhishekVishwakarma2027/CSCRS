import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/routes/paths'
import { useUnreadNotificationCountQuery } from '@/features/notifications/hooks/use-notifications'

export function NotificationBell() {
  const navigate = useNavigate()
  const { data: unreadData } = useUnreadNotificationCountQuery()

  const unreadCount = unreadData?.unread_count ?? 0

  return (
    <button
      onClick={() => navigate(PATHS.NOTIFICATIONS)}
      className="relative cursor-pointer rounded-lg p-2 text-neutral-500 transition-all duration-200 outline-none hover:bg-neutral-100/80 hover:text-neutral-900 focus:ring-2 focus:ring-blue-500 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#0D9488] px-1 text-[10px] font-black text-white shadow-xs">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
export default NotificationBell
