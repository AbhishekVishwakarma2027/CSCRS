import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Megaphone, Clock, Users, Calendar, XCircle, Loader2, Trash2 } from 'lucide-react'
import {
  useAnnouncementsQuery,
  useEndAnnouncementMutation,
  useDeleteAnnouncementMutation,
} from '../hooks/use-super-admin'
import type { AnnouncementItemResponse } from '../types'
import { toast } from 'sonner'
import { formatDate } from '@/utils/format'
import { ConfirmationDialog } from '@/features/reports/components/ConfirmationDialog'

type StatusFilterType = 'ALL' | 'ACTIVE' | 'SCHEDULED' | 'EXPIRED'
type TypeFilterType = 'ALL' | 'INFORMATIONAL' | 'MAINTENANCE' | 'URGENT_WARNING'

export function ActiveAnnouncementsWidget() {
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL')
  const [typeFilter, setTypeFilter] = useState<TypeFilterType>('ALL')

  const {
    data: announcements = [],
    isLoading,
    error,
  } = useAnnouncementsQuery(statusFilter, typeFilter)
  const endMutation = useEndAnnouncementMutation()
  const deleteMutation = useDeleteAnnouncementMutation()

  const [confirmEndId, setConfirmEndId] = useState<string | null>(null)
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<AnnouncementItemResponse | null>(
    null
  )

  const handleEndAnnouncement = async (broadcastId: string) => {
    try {
      await endMutation.mutateAsync(broadcastId)
      toast.success('Announcement ended for all recipient users.')
      setConfirmEndId(null)
    } catch {
      toast.error('Failed to end announcement.')
    }
  }

  const handleDeleteAnnouncement = async () => {
    if (!deletingAnnouncement) return
    try {
      await deleteMutation.mutateAsync(deletingAnnouncement.broadcast_id)
      toast.success(`Scheduled announcement "${deletingAnnouncement.title}" deleted successfully.`)
      setDeletingAnnouncement(null)
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } }
      const errorDetail =
        apiErr?.response?.data?.detail || 'Failed to delete scheduled announcement.'
      toast.error(errorDetail)
    }
  }

  const statusOptions: { label: string; value: StatusFilterType }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Scheduled', value: 'SCHEDULED' },
    { label: 'Expired', value: 'EXPIRED' },
  ]

  const typeOptions: { label: string; value: TypeFilterType }[] = [
    { label: 'All Types', value: 'ALL' },
    { label: 'Informational', value: 'INFORMATIONAL' },
    { label: 'Maintenance', value: 'MAINTENANCE' },
    { label: 'Urgent Warning', value: 'URGENT_WARNING' },
  ]

  const getEmptyStateMessage = () => {
    const statusTextMap: Record<StatusFilterType, string> = {
      ALL: '',
      ACTIVE: 'active',
      SCHEDULED: 'scheduled',
      EXPIRED: 'expired',
    }

    const typeTextMap: Record<TypeFilterType, string> = {
      ALL: 'announcements',
      INFORMATIONAL: 'informational announcements',
      MAINTENANCE: 'maintenance announcements',
      URGENT_WARNING: 'urgent warning announcements',
    }

    const s = statusTextMap[statusFilter]
    const t = typeTextMap[typeFilter]

    if (statusFilter === 'ALL' && typeFilter === 'ALL') {
      return 'No system announcements found'
    }

    if (s) {
      return `No ${s} ${t}`
    }

    return `No ${t}`
  }

  return (
    <>
      <Card className="border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <div className="flex flex-col gap-4 border-b border-neutral-100 pb-4 lg:flex-row lg:items-center lg:justify-between dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-[#0A3C7D] dark:text-blue-400" />
            <div>
              <h3 className="text-base font-black tracking-tight text-neutral-900 dark:text-white">
                System Announcement Lifecycle Management
              </h3>
              <p className="text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
                Active, scheduled, and expired platform broadcasts with real-time revocation
                controls.
              </p>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="announcement-status-filter"
                className="text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500"
              >
                Status:
              </label>
              <select
                id="announcement-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
                className="h-8.5 w-[130px] cursor-pointer rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-bold text-neutral-700 transition-colors outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-300"
                aria-label="Filter announcements by status"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Dropdown */}
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="announcement-type-filter"
                className="text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500"
              >
                Type:
              </label>
              <select
                id="announcement-type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilterType)}
                className="h-8.5 w-[170px] cursor-pointer rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-bold text-neutral-700 transition-colors outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-300"
                aria-label="Filter announcements by type"
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-4 flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#0A3C7D] dark:text-blue-400" />
          </div>
        ) : error ? (
          <div className="mt-4 rounded-xl border border-dashed border-rose-200 bg-rose-50/20 p-4 text-center dark:border-rose-950/40">
            <p className="text-xs font-bold text-rose-600">Failed to load system announcements.</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 p-6 text-center dark:border-neutral-800 dark:bg-neutral-900/30">
            <Megaphone className="mx-auto h-6 w-6 text-neutral-400" />
            <p className="mt-1 text-xs font-bold text-neutral-500 dark:text-neutral-400">
              {getEmptyStateMessage()}
            </p>
          </div>
        ) : (
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
                          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-2 dark:border-rose-900/40 dark:bg-rose-950/30">
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
                            className="flex cursor-pointer items-center gap-1 border-rose-200 font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/30"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>End Announcement</span>
                          </Button>
                        )}
                      </div>
                    )}

                    {item.lifecycle_state === 'SCHEDULED' && (
                      <div className="shrink-0 pt-2 sm:pt-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => setDeletingAnnouncement(item)}
                          className="flex cursor-pointer items-center gap-1 border-rose-200 font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Announcement</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      {deletingAnnouncement && (
        <ConfirmationDialog
          isOpen={!!deletingAnnouncement}
          title="Delete Announcement?"
          description={`This scheduled announcement "${deletingAnnouncement.title}" will be permanently removed. This action cannot be undone.`}
          confirmLabel="Delete Announcement"
          cancelLabel="Cancel"
          isDanger={true}
          isSubmitting={deleteMutation.isPending}
          onConfirm={handleDeleteAnnouncement}
          onCancel={() => setDeletingAnnouncement(null)}
        />
      )}
    </>
  )
}
