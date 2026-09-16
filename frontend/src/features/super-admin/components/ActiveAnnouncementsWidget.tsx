import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Megaphone, Clock, Users, Calendar, XCircle, Loader2 } from 'lucide-react'
import { useAnnouncementsQuery, useEndAnnouncementMutation } from '../hooks/use-super-admin'
import type { AnnouncementItemResponse } from '../types'
import { toast } from 'sonner'
import { formatDate } from '@/utils/format'

export function ActiveAnnouncementsWidget() {
  const { data: announcements = [], isLoading, error } = useAnnouncementsQuery()
  const endMutation = useEndAnnouncementMutation()

  const [confirmEndId, setConfirmEndId] = useState<string | null>(null)

  const handleEndAnnouncement = async (broadcastId: string) => {
    try {
      await endMutation.mutateAsync(broadcastId)
      toast.success('Announcement ended for all recipient users.')
      setConfirmEndId(null)
    } catch (err) {
      console.error(err)
      toast.error('Failed to end announcement.')
    }
  }

  if (isLoading) {
    return (
      <Card className="animate-pulse p-6">
        <div className="h-5 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="dark:bg-neutral-850 mt-4 h-24 rounded bg-neutral-100" />
      </Card>
    )
  }

  if (error || announcements.length === 0) {
    return null
  }

  return (
    <Card className="border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
      <div className="flex flex-col gap-2 border-b border-neutral-100 pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-[#0A3C7D] dark:text-blue-400" />
          <div>
            <h3 className="text-base font-black tracking-tight text-neutral-900 dark:text-white">
              System Announcement Lifecycle Management
            </h3>
            <p className="text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
              Active, scheduled, and expired platform broadcasts with real-time revocation controls.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {announcements.map((item: AnnouncementItemResponse) => {
          const isConfirming = confirmEndId === item.broadcast_id

          let typeColorClass =
            'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-400'
          if (item.announcement_type === 'MAINTENANCE') {
            typeColorClass =
              'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400'
          } else if (item.announcement_type === 'URGENT_WARNING') {
            typeColorClass =
              'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400'
          }

          let stateColorClass =
            'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400'
          if (item.lifecycle_state === 'SCHEDULED') {
            stateColorClass =
              'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-400'
          } else if (item.lifecycle_state === 'EXPIRED') {
            stateColorClass =
              'border-neutral-200 bg-neutral-100 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-850 dark:text-neutral-400'
          }

          return (
            <div
              key={item.broadcast_id}
              className="dark:border-neutral-850 rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 transition-all dark:bg-[#18181A]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase ${typeColorClass}`}
                    >
                      {item.announcement_type}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase ${stateColorClass}`}
                    >
                      {item.lifecycle_state}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-neutral-500">
                      <Users className="h-3 w-3" />
                      {item.recipient_count} recipients
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                    {item.title}
                  </h4>
                  <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    {item.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-semibold text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      Created: {formatDate(item.created_at)}
                    </span>
                    {item.starts_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-blue-500" />
                        Starts: {new Date(item.starts_at).toLocaleString()}
                      </span>
                    )}
                    {item.ends_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        Ends: {new Date(item.ends_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {item.lifecycle_state === 'ACTIVE' && (
                  <div className="shrink-0 pt-2 sm:pt-0">
                    {isConfirming ? (
                      <div className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-2 dark:border-rose-900/40 dark:bg-rose-950/30">
                        <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
                          End for all users?
                        </span>
                        <Button
                          type="button"
                          size="xs"
                          disabled={endMutation.isPending}
                          onClick={() => handleEndAnnouncement(item.broadcast_id)}
                          className="bg-rose-600 font-bold text-white hover:bg-rose-700"
                        >
                          {endMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            'Confirm'
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          disabled={endMutation.isPending}
                          onClick={() => setConfirmEndId(null)}
                          className="font-bold dark:border-neutral-800"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => setConfirmEndId(item.broadcast_id)}
                        className="flex items-center gap-1 border-rose-200 font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/30"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>End Announcement</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
