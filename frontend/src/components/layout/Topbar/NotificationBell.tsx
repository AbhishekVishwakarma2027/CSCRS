import { useState, useRef, useEffect } from 'react'
import { Bell, Check, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  useNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/features/notifications/hooks/use-notifications'
import { formatDate } from '@/utils/format'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { data: notifications = [], isLoading, error } = useNotificationsQuery()
  const markAllReadMutation = useMarkAllNotificationsReadMutation()
  const markReadMutation = useMarkNotificationReadMutation()

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.is_read).length

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative cursor-pointer rounded-lg p-2 text-neutral-500 transition-all duration-200 outline-none hover:bg-neutral-100/80 hover:text-neutral-900 focus:ring-2 focus:ring-blue-500"
        aria-label="Notifications Panel"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0D9488] opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0D9488]"></span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="border-neutral-250 absolute right-0 z-50 mt-2 w-80 origin-top-right transform overflow-hidden rounded-xl border bg-white shadow-xl transition-all dark:border-neutral-800 dark:bg-[#1C1C1E]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/30">
            <span className="text-[13px] font-black tracking-wider text-neutral-500 uppercase">
              Alerts & Notifications
            </span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#0D9488]/10 px-1.5 py-0.5 text-[11px] font-black text-[#0D9488]">
                {unreadCount} new
              </span>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-neutral-400">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0A3C7D] border-t-transparent" />
                <span className="text-[13px] font-bold">Synchronizing feeds...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-rose-500">
                <span className="text-[13px] font-bold">Failed to load notifications</span>
                <span className="text-neutral-450 text-[11px]">
                  {error?.message || 'Unknown error'}
                </span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-50 text-neutral-400 dark:bg-neutral-800/40">
                  <Bell className="h-5 w-5" />
                </div>
                <h4 className="text-[13px] font-bold text-neutral-700 dark:text-neutral-300">
                  All caught up
                </h4>
                <p className="text-neutral-450 max-w-[200px] text-[13px] leading-relaxed">
                  No active operational alerts dispatched to your profile.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) {
                        markReadMutation.mutate(n.id)
                      }
                      setIsOpen(false)
                      // Optional: Navigate to report if related
                      if (n.report_id) {
                        navigate(`/reports?q=${n.report_id}`)
                      }
                    }}
                    className={`flex w-full gap-3 p-4 text-left transition-colors hover:bg-neutral-50/50 focus:outline-none dark:hover:bg-neutral-800/30 ${
                      !n.is_read ? 'bg-[#0D9488]/5 dark:bg-teal-950/10' : ''
                    }`}
                  >
                    <div className="mt-1 shrink-0">
                      {n.is_read ? (
                        <Info className="h-3.5 w-3.5 text-neutral-400" />
                      ) : (
                        <span className="relative flex h-2 w-2">
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0D9488]"></span>
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-[13px] leading-tight font-bold text-neutral-800 dark:text-neutral-200">
                        {n.title}
                      </h5>
                      <p className="mt-1 text-[13px] leading-normal text-neutral-500 dark:text-neutral-400">
                        {n.message}
                      </p>
                      <span className="mt-1.5 block text-[11px] font-semibold text-neutral-400">
                        {formatDate(n.created_at)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer Controls */}
          {notifications.length > 0 && (
            <div className="border-t border-neutral-100 bg-neutral-50/30 px-4 py-2 text-center dark:border-neutral-800">
              <button
                onClick={() => {
                  markAllReadMutation.mutate()
                  setIsOpen(false)
                }}
                className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-bold text-[#0A3C7D] hover:text-[#0A3C7D]/85 dark:text-blue-400"
              >
                <Check className="h-3.5 w-3.5" />
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
export default NotificationBell
