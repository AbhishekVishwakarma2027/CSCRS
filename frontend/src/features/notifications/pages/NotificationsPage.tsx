import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Check,
  CheckCircle,
  MessageSquare,
  AlertTriangle,
  Info,
  ChevronRight,
  FileText,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '../hooks/use-notifications'
import type { NotificationItem } from '../types'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { data: notifications = [], isLoading, error, refetch } = useNotificationsQuery()

  const markReadMutation = useMarkNotificationReadMutation()
  const markAllReadMutation = useMarkAllNotificationsReadMutation()

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync()
      toast.success('All notifications marked as read.')
    } catch (e) {
      console.error(e)
      toast.error('Failed to mark notifications as read.')
    }
  }

  const handleMarkIndividualRead = async (id: number) => {
    try {
      await markReadMutation.mutateAsync(id)
    } catch (e) {
      console.error(e)
    }
  }

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.is_read) {
      await handleMarkIndividualRead(item.id)
    }

    if (item.report_id) {
      const typeLower = item.type.toLowerCase()
      if (typeLower.includes('forward')) {
        navigate('/forward-requests')
      } else if (typeLower.includes('manual') || typeLower.includes('resolution')) {
        navigate('/resolutions/manual-review')
      } else {
        navigate(`/reports?q=${item.report_id}`)
      }
    }
  }

  const getNotificationIcon = (type: string) => {
    const iconClass = 'h-4 w-4 shrink-0'
    switch (type.toLowerCase()) {
      case 'report':
      case 'assignment':
        return <FileText className={`${iconClass} text-blue-500`} />
      case 'resolution':
      case 'verification':
        return <CheckCircle className={`${iconClass} text-emerald-500`} />
      case 'feedback':
      case 'comment':
        return <MessageSquare className={`${iconClass} text-purple-500`} />
      case 'alert':
      case 'cancellation':
        return <AlertTriangle className={`${iconClass} text-rose-500`} />
      default:
        return <Info className={`${iconClass} text-neutral-500`} />
    }
  }

  return (
    <div className="space-y-6 pb-10 text-left select-none">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
        <div className="flex shrink-0 flex-col gap-1.5">
          <h1 className="text-neutral-850 text-2xl font-black tracking-tight dark:text-white">
            Notifications Centre
          </h1>
          <p className="text-[13px] leading-relaxed font-semibold text-neutral-500 dark:text-neutral-400">
            Stay up to date with civic report statuses, worker actions, and platform updates.
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
            className="dark:border-neutral-850 flex h-8 items-center gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Notifications List Container */}
      {isLoading ? (
        <div className="flex h-52 flex-col items-center justify-center gap-2">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#0A3C7D] border-t-transparent dark:border-blue-500" />
          <span className="text-xs font-bold text-neutral-500">Loading notifications...</span>
        </div>
      ) : error ? (
        <div className="border-rose-250 flex h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-rose-50/10 p-5 dark:border-rose-950/20">
          <AlertTriangle className="h-8 w-8 text-rose-500" />
          <span className="text-xs font-bold text-rose-600">Failed to load notifications.</span>
          <Button variant="outline" size="xs" onClick={() => refetch()} className="h-7">
            Retry Connection
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/20 p-5 dark:border-neutral-800">
          <Bell className="h-8 w-8 text-neutral-400" />
          <span className="text-xs font-bold text-neutral-500">All clear! No notifications.</span>
          <p className="text-[11px] font-medium text-neutral-400">
            We will alert you here when new actions require your attention.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`group flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all duration-150 ${
                item.is_read
                  ? 'border-neutral-150 dark:border-neutral-850 bg-white opacity-75 dark:bg-[#1C1C1E]'
                  : 'border-neutral-200 bg-neutral-50/50 shadow-xs hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:bg-neutral-900/60'
              }`}
            >
              {/* Unread marker */}
              {!item.is_read && (
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
              )}

              {/* Icon Type */}
              <div className="dark:bg-neutral-850 mt-0.5 rounded-lg bg-neutral-100 p-2">
                {getNotificationIcon(item.type)}
              </div>

              {/* Message Details */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-xs font-black tracking-tight text-neutral-800 dark:text-white">
                    {item.title}
                  </h4>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
                    <Clock className="h-3 w-3" />
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs leading-relaxed font-medium text-neutral-600 dark:text-neutral-400">
                  {item.message}
                </p>

                {item.report_id && (
                  <div className="mt-2.5 inline-flex items-center gap-1 rounded bg-[#0A3C7D]/5 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-[#0A3C7D] uppercase dark:bg-blue-600/10 dark:text-blue-400">
                    Report Ref: #{item.report_id}
                  </div>
                )}
              </div>

              {/* Action indicator */}
              {!item.is_read && (
                <ChevronRight className="text-neutral-350 dark:text-neutral-550 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
