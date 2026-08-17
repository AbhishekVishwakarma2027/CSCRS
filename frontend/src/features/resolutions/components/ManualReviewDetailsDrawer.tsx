import React, { useState } from 'react'
import {
  X,
  FileImage,
  MapPin,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP_CONFIG } from '@/config/app.config'
import type { ManualReviewDetail } from '../types'

interface ManualReviewDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  reportId: number | null
  detail: ManualReviewDetail | undefined
  isLoading: boolean
  onApprove: (reportId: number) => void
  onReject: (reportId: number, reason: string) => void
  isSubmitting: boolean
}

export function ManualReviewDetailsDrawer({
  isOpen,
  onClose,
  reportId,
  detail,
  isLoading,
  onApprove,
  onReject,
  isSubmitting,
}: ManualReviewDetailsDrawerProps) {
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  if (!isOpen) return null

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return undefined
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${APP_CONFIG.apiBaseUrl}${cleanPath}`
  }

  const handleApprove = () => {
    if (reportId) {
      onApprove(reportId)
    }
  }

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (reportId && rejectReason.trim().length >= 5) {
      onReject(reportId, rejectReason)
      setRejectReason('')
      setShowRejectForm(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-neutral-900/60 transition-opacity duration-300 dark:bg-black/80"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-2xl flex-col border-l border-neutral-200 bg-white shadow-2xl transition-transform duration-300 sm:w-[650px] dark:border-neutral-800 dark:bg-[#1C1C1E]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800/80">
          <div>
            <h2 className="text-neutral-850 text-base font-black tracking-tight dark:text-white">
              Resolution Audit Details
            </h2>
            {detail && (
              <p className="text-neutral-450 mt-0.5 text-[11px] font-extrabold tracking-wider uppercase dark:text-neutral-500">
                Reference: {detail.report_number}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0A3C7D] border-t-transparent dark:border-blue-500" />
              <span className="text-xs font-bold text-neutral-500">Loading audit profile...</span>
            </div>
          ) : !detail ? (
            <div className="flex h-40 items-center justify-center text-xs font-semibold text-neutral-500">
              Failed to load resolution details.
            </div>
          ) : (
            <>
              {/* Image Side-by-Side Comparison */}
              <div className="space-y-3">
                <h4 className="text-neutral-450 flex items-center gap-1.5 text-xs font-black tracking-wider uppercase dark:text-neutral-500">
                  <FileImage className="h-4 w-4 text-blue-500" />
                  Image Comparison Verification
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Original / Annotated Image */}
                  <div className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
                    <span className="absolute top-2 left-2 z-10 rounded-md bg-neutral-900/80 px-2 py-0.5 text-[9px] font-black tracking-wider text-white uppercase">
                      Original / Annotated
                    </span>
                    <img
                      src={
                        getImageUrl(detail.annotated_image_path || detail.original_image_path) ||
                        '/placeholder-image.png'
                      }
                      alt="Original civic issue"
                      className="h-44 w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Resolution Image */}
                  <div className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
                    <span className="absolute top-2 left-2 z-10 rounded-md bg-emerald-600 px-2 py-0.5 text-[9px] font-black tracking-wider text-white uppercase">
                      Worker Resolution
                    </span>
                    <img
                      src={getImageUrl(detail.resolution_image_path) || '/placeholder-image.png'}
                      alt="Worker resolution"
                      className="h-44 w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </div>
              </div>

              {/* AI Verification Metric Stats */}
              <div className="border-neutral-150 rounded-xl border bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
                <h4 className="text-neutral-450 mb-3 flex items-center gap-1.5 text-xs font-black tracking-wider uppercase dark:text-neutral-500">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  AI Verification Decision
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                      Similarity Score
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${(detail.scene_similarity || 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-neutral-700 dark:text-neutral-300">
                        {detail.scene_similarity !== null
                          ? `${(detail.scene_similarity * 100).toFixed(0)}%`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                      Verification Result
                    </span>
                    <div className="flex items-center gap-1">
                      {detail.verification_decision === 'PASS' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 uppercase">
                          <CheckCircle className="h-3.5 w-3.5" /> Pass
                        </span>
                      ) : detail.verification_decision === 'FAIL' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-rose-600 uppercase">
                          <XCircle className="h-3.5 w-3.5" /> Fail
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-amber-600 uppercase">
                          <AlertTriangle className="h-3.5 w-3.5" /> Needs Review
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                      Issue Class Found
                    </span>
                    <span className="block text-xs font-extrabold text-neutral-700 capitalize dark:text-neutral-300">
                      {detail.yolo_issue_found ? 'Civic Issue Present' : 'Clear / Resolved'}
                    </span>
                  </div>
                </div>

                {detail.failure_reason && (
                  <div className="mt-3.5 flex items-start gap-2 rounded-lg bg-rose-50/50 p-2.5 dark:bg-rose-950/10">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black tracking-wider text-rose-700 uppercase dark:text-rose-400">
                        AI Flag Reason
                      </span>
                      <p className="text-[11px] leading-relaxed font-semibold text-neutral-600 dark:text-neutral-400">
                        {detail.failure_reason}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Resolution Remarks */}
              <div className="space-y-1.5">
                <span className="dark:text-neutral-550 text-[10px] font-extrabold tracking-wider text-neutral-400 uppercase">
                  Worker Resolutions Remarks
                </span>
                <p className="rounded-xl border border-neutral-100 bg-neutral-50/20 p-3.5 text-xs leading-relaxed font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/20 dark:text-neutral-300">
                  {detail.remarks || 'No remarks provided by worker.'}
                </p>
              </div>

              {/* Details Fields Section */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Field Worker Profile */}
                <div className="border-neutral-150 space-y-2.5 rounded-xl border p-4 dark:border-neutral-800">
                  <h5 className="text-neutral-450 flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
                    <User className="h-3.5 w-3.5 text-[#0A3C7D] dark:text-blue-400" />
                    Field Worker Info
                  </h5>
                  <div className="space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    <p className="flex justify-between">
                      <span className="text-neutral-400">Name:</span>
                      <span>{detail.worker_name}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-neutral-400">Email:</span>
                      <span className="select-all">{detail.worker_email}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-neutral-400">Phone:</span>
                      <span>{detail.worker_phone || 'N/A'}</span>
                    </p>
                  </div>
                </div>

                {/* Audit Context */}
                <div className="border-neutral-150 space-y-2.5 rounded-xl border p-4 dark:border-neutral-800">
                  <h5 className="text-neutral-450 flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
                    <Layers className="h-3.5 w-3.5 text-[#0A3C7D] dark:text-blue-400" />
                    Resolution context
                  </h5>
                  <div className="space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    <p className="flex justify-between">
                      <span className="text-neutral-400">Category:</span>
                      <span className="capitalize">{detail.issue_type.toLowerCase()}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-neutral-400">Verification Attempt:</span>
                      <span>Attempt #{detail.attempt_number || 1}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-neutral-400">Submitted Date:</span>
                      <span>{new Date(detail.resolved_at).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Geographic Metadata */}
              <div className="border-neutral-150 space-y-2 rounded-xl border p-4 dark:border-neutral-800">
                <h5 className="text-neutral-450 flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
                  <MapPin className="h-3.5 w-3.5 text-[#0A3C7D] dark:text-blue-400" />
                  Resolution Location Details
                </h5>
                <div className="space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  <p className="flex justify-between">
                    <span className="text-neutral-400">Address:</span>
                    <span
                      className="max-w-[280px] truncate text-right"
                      title={detail.address || ''}
                    >
                      {detail.address || 'Unavailable'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-neutral-400">Coordinates:</span>
                    <span>
                      {detail.latitude !== null && detail.longitude !== null
                        ? `${detail.latitude.toFixed(6)}, ${detail.longitude.toFixed(6)}`
                        : 'Unavailable'}
                    </span>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {detail && !isLoading && (
          <div className="border-t border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800/80 dark:bg-neutral-900/60">
            {showRejectForm ? (
              <form onSubmit={handleRejectSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label
                    htmlFor="rejection-reason-input"
                    className="text-[10px] font-black tracking-wider text-rose-700 uppercase dark:text-rose-400"
                  >
                    Provide Reason for Rejection (Min 5 characters)
                  </label>
                  <textarea
                    id="rejection-reason-input"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    required
                    placeholder="Provide specific feedback explaining why the resolution image or remarks are insufficient..."
                    rows={2}
                    className="w-full rounded-lg border border-neutral-200 bg-white p-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-rose-500 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setShowRejectForm(false)}
                    className="dark:border-neutral-850 h-8"
                  >
                    Go Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || rejectReason.trim().length < 5}
                    className="h-8 bg-rose-600 text-xs font-black tracking-wider text-white uppercase hover:bg-rose-500"
                  >
                    Confirm Reject
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setShowRejectForm(true)}
                  className="flex h-9 items-center gap-1 border-rose-200 bg-white px-4 text-xs font-black tracking-wider text-rose-600 uppercase hover:bg-rose-50 hover:text-rose-700 dark:border-rose-950/20 dark:bg-neutral-900 dark:text-rose-400 dark:hover:bg-rose-950/10"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Resolution
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleApprove}
                  className="flex h-9 items-center gap-1 bg-emerald-600 px-4 text-xs font-black tracking-wider text-white uppercase hover:bg-emerald-500"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve Resolution
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
