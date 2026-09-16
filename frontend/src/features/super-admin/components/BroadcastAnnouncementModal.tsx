import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useBroadcastAnnouncementMutation } from '../hooks/use-super-admin'
import { NOTIFICATIONS_QUERY_KEYS } from '@/features/notifications/hooks/use-notifications'
import { Button } from '@/components/ui/button'
import { Megaphone, Send, Loader2, X, AlertTriangle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

interface BroadcastAnnouncementModalProps {
  isOpen: boolean
  onClose: () => void
}

const TARGET_ROLE_LABELS: Record<string, string> = {
  ALL: 'All Active Users',
  CITIZEN: 'Citizens Only',
  WORKER: 'Field Workers Only',
  DEPARTMENT_ADMIN: 'Department Admins Only',
  CITY_ADMIN: 'City Admins Only',
}

const ANNOUNCEMENT_TYPE_LABELS: Record<string, string> = {
  INFORMATIONAL: 'Informational Notice',
  MAINTENANCE: 'Maintenance Alert',
  URGENT_WARNING: 'Urgent Warning',
}

export function BroadcastAnnouncementModal({ isOpen, onClose }: BroadcastAnnouncementModalProps) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [targetRole, setTargetRole] = useState('ALL')
  const [announcementType, setAnnouncementType] = useState('INFORMATIONAL')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const broadcastMutation = useBroadcastAnnouncementMutation()

  if (!isOpen) return null

  const handleReset = () => {
    setTitle('')
    setMessage('')
    setTargetRole('ALL')
    setAnnouncementType('INFORMATIONAL')
    setStartsAt('')
    setEndsAt('')
    setStep('form')
    setErrorMessage(null)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      setErrorMessage('Please fill in both title and announcement message.')
      return
    }

    if (startsAt && endsAt) {
      if (new Date(startsAt) >= new Date(endsAt)) {
        setErrorMessage('Start time must be strictly before end time.')
        return
      }
    }

    if (endsAt) {
      if (new Date(endsAt) <= new Date()) {
        setErrorMessage('End time must be set in the future.')
        return
      }
    }

    setErrorMessage(null)
    setStep('confirm')
  }

  const handleConfirmBroadcast = async () => {
    setErrorMessage(null)
    try {
      const res = await broadcastMutation.mutateAsync({
        title: title.trim(),
        message: message.trim(),
        target_role: targetRole,
        announcement_type: announcementType,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      })

      // Invalidate notification queries so recipient bell & banner pick up the announcement
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEYS.all })

      toast.success(res.message || 'Announcement broadcast successfully!')
      handleClose()
    } catch (err: unknown) {
      console.error(err)
      const message =
        err instanceof Error ? err.message : 'Failed to broadcast announcement. Please try again.'
      setErrorMessage(message)
      toast.error('Broadcast failed. Please check form details and try again.')
    }
  }

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 duration-200 dark:bg-black/80">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <button
          type="button"
          onClick={handleClose}
          disabled={broadcastMutation.isPending}
          className="absolute top-4 right-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-xl font-black text-neutral-900 dark:text-white">
          <Megaphone className="h-5 w-5 text-[#0A3C7D] dark:text-blue-400" />
          <span>Broadcast System Announcement</span>
        </div>
        <p className="mt-1 text-xs font-semibold text-neutral-500">
          Deliver a platform notification with optional maintenance scheduling and severity rules.
        </p>

        {step === 'form' ? (
          <form onSubmit={handleProceedToConfirm} className="mt-4 space-y-4 text-left">
            <div className="grid grid-cols-2 gap-3">
              {/* Target Role Selector */}
              <div>
                <label className="mb-1 block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Target Audience
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full cursor-pointer rounded-lg border border-neutral-200 bg-white p-2.5 text-xs font-bold text-neutral-800 outline-none focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#141416] dark:text-white"
                >
                  <option value="ALL">All Active Users</option>
                  <option value="CITIZEN">Citizens Only</option>
                  <option value="WORKER">Field Workers Only</option>
                  <option value="DEPARTMENT_ADMIN">Department Admins Only</option>
                  <option value="CITY_ADMIN">City Admins Only</option>
                </select>
              </div>

              {/* Announcement Type Selector */}
              <div>
                <label className="mb-1 block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Announcement Severity
                </label>
                <select
                  value={announcementType}
                  onChange={(e) => setAnnouncementType(e.target.value)}
                  className="w-full cursor-pointer rounded-lg border border-neutral-200 bg-white p-2.5 text-xs font-bold text-neutral-800 outline-none focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#141416] dark:text-white"
                >
                  <option value="INFORMATIONAL">Informational</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="URGENT_WARNING">Urgent Warning</option>
                </select>
              </div>
            </div>

            {/* Scheduled Timestamps (Optional) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                  Scheduled Start (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white p-2 text-xs font-semibold text-neutral-800 outline-none focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#141416] dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                  Scheduled End (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white p-2 text-xs font-semibold text-neutral-800 outline-none focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#141416] dark:text-white"
                />
              </div>
            </div>

            {/* Announcement Title */}
            <div>
              <label className="mb-1 block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Announcement Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled System Maintenance Notice"
                maxLength={150}
                className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-xs font-bold text-neutral-900 outline-none focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#141416] dark:text-white"
              />
            </div>

            {/* Announcement Message Body */}
            <div>
              <label className="mb-1 block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Message Content *
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your system announcement message here..."
                maxLength={1000}
                className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-xs font-bold text-neutral-900 outline-none focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#141416] dark:text-white"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                {errorMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="font-bold dark:border-neutral-800"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                size="sm"
                className="flex items-center gap-2 bg-[#0A3C7D] font-bold text-white hover:bg-[#0A3C7D]/90 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <span>Review Announcement</span>
              </Button>
            </div>
          </form>
        ) : (
          /* Step 2: Confirmation View */
          <div className="mt-4 space-y-4 text-left">
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Confirm Platform-Wide Broadcast</span>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                Are you sure you want to broadcast this announcement? It will appear for targeted
                users according to its schedule and severity type.
              </p>
            </div>

            <div className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 dark:border-neutral-800 dark:bg-[#18181A]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-black text-neutral-400 uppercase">
                    Target Scope:
                  </span>
                  <span className="ml-1.5 text-xs font-bold text-[#0A3C7D] dark:text-blue-400">
                    {TARGET_ROLE_LABELS[targetRole] || targetRole}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-neutral-400 uppercase">
                    Severity:
                  </span>
                  <span className="ml-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    {ANNOUNCEMENT_TYPE_LABELS[announcementType] || announcementType}
                  </span>
                </div>
              </div>

              {(startsAt || endsAt) && (
                <div className="grid grid-cols-2 gap-2 border-t border-neutral-200/50 pt-1 dark:border-neutral-800">
                  <div>
                    <span className="text-[10px] font-black text-neutral-400 uppercase">
                      Starts At:
                    </span>
                    <span className="ml-1 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {startsAt ? new Date(startsAt).toLocaleString() : 'Immediate'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-neutral-400 uppercase">
                      Ends At:
                    </span>
                    <span className="ml-1 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {endsAt ? new Date(endsAt).toLocaleString() : 'No expiration'}
                    </span>
                  </div>
                </div>
              )}

              <div className="border-t border-neutral-200/50 pt-1 dark:border-neutral-800">
                <span className="text-[10px] font-black text-neutral-400 uppercase">Title:</span>
                <p className="text-sm font-extrabold text-neutral-900 dark:text-white">{title}</p>
              </div>

              <div>
                <span className="text-[10px] font-black text-neutral-400 uppercase">
                  Message Preview:
                </span>
                <p className="mt-0.5 text-xs leading-relaxed font-semibold whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
                  {message}
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                {errorMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={broadcastMutation.isPending}
                onClick={() => setStep('form')}
                className="flex items-center gap-1.5 font-bold dark:border-neutral-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Edit</span>
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={broadcastMutation.isPending}
                onClick={handleConfirmBroadcast}
                className="flex items-center gap-2 bg-[#0A3C7D] font-bold text-white hover:bg-[#0A3C7D]/90 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                {broadcastMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Confirm & Send Broadcast</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
