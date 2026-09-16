import React, { useState, useEffect, useMemo } from 'react'
import { Megaphone, AlertTriangle, Info, X } from 'lucide-react'
import { useActiveBroadcastsQuery } from '@/features/notifications/hooks/use-notifications'

const DISMISSED_SESSION_KEY = 'cscrs_dismissed_announcement_ids'

export function AnnouncementBanner() {
  const { data: broadcasts = [] } = useActiveBroadcastsQuery()

  // Track session-dismissed broadcast IDs
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem(DISMISSED_SESSION_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Persist dismissed IDs to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(DISMISSED_SESSION_KEY, JSON.stringify(dismissedIds))
    } catch {
      // Ignore storage errors
    }
  }, [dismissedIds])

  // Filter for active, un-dismissed broadcasts
  const activeAnnouncement = useMemo(() => {
    const eligible = broadcasts.filter((b) => !dismissedIds.includes(b.broadcast_id))

    if (eligible.length === 0) return null

    // Pick the most recent broadcast by created_at descending
    return [...eligible].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]
  }, [broadcasts, dismissedIds])

  if (!activeAnnouncement) return null

  const handleDismiss = () => {
    const id = activeAnnouncement.broadcast_id
    setDismissedIds((prev) => [...prev, id])
  }

  const annType = activeAnnouncement.announcement_type || 'INFORMATIONAL'

  // Determine styling based on severity type
  let containerStyle =
    'border-b border-[#F5E89F] bg-[#FFF7CC] text-red-950 dark:border-[#54480A] dark:bg-[#3D3408]'
  let iconContainerStyle = 'bg-red-600/15 text-red-800 dark:bg-red-900/30 dark:text-red-950'
  let labelStyle = 'text-red-800 dark:text-red-950'
  let messageStyle = 'text-red-900 dark:text-red-950'
  let closeBtnStyle =
    'border-red-800/30 text-red-800 hover:bg-red-600/20 hover:text-red-950 dark:border-red-900/40 dark:text-red-950 dark:hover:bg-red-900/30'
  let IconComponent = Megaphone

  if (annType === 'URGENT_WARNING') {
    containerStyle =
      'border-b border-rose-800 bg-rose-700 text-white dark:border-rose-900 dark:bg-rose-950'
    iconContainerStyle = 'bg-white/20 text-white'
    labelStyle = 'text-rose-100'
    messageStyle = 'text-white'
    closeBtnStyle =
      'border-white/30 text-white hover:bg-white/20 hover:text-white dark:border-rose-800'
    IconComponent = AlertTriangle
  } else if (annType === 'INFORMATIONAL') {
    containerStyle =
      'border-b border-blue-900/40 bg-[#0A3C7D] text-white dark:border-blue-900/70 dark:bg-[#082B5A]'
    iconContainerStyle = 'bg-white/20 text-white'
    labelStyle = 'text-blue-100'
    messageStyle = 'text-white'
    closeBtnStyle =
      'border-white/30 text-white hover:bg-white/20 hover:text-white dark:border-blue-800'
    IconComponent = Info
  }

  return (
    <div
      role="region"
      aria-label="System Announcement"
      className={`animate-in slide-in-from-top-2 relative z-30 flex items-center justify-between px-4 py-3 shadow-xs ${containerStyle}`}
    >
      <div className="flex flex-1 items-start gap-3 pr-4 sm:items-center">
        <div
          className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg sm:mt-0 ${iconContainerStyle}`}
        >
          <IconComponent className="h-4 w-4" />
        </div>
        <div className="flex flex-col text-left sm:flex-row sm:items-center sm:gap-2">
          <span className={`text-xs font-black tracking-wide uppercase ${labelStyle}`}>
            [{annType}] {activeAnnouncement.title}:
          </span>
          <span className={`text-xs font-bold ${messageStyle}`}>{activeAnnouncement.message}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        className={`flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors ${closeBtnStyle}`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
