import React, { useState } from 'react'
import {
  X,
  FileImage,
  MapPin,
  User,
  Activity,
  CheckCircle,
  XCircle,
  Building,
  History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP_CONFIG } from '@/config/app.config'
import { useDepartmentsQuery } from '@/features/reports/hooks/use-reports'
import type { ForwardRequestDetailResponse, ForwardReasonType } from '../types'

interface ForwardRequestsDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  requestId: number | null
  detail: ForwardRequestDetailResponse | undefined
  isLoading: boolean
  isIncoming: boolean // True = Incoming requests tab, False = Outgoing requests tab
  onApprove: (
    requestId: number,
    payload: { department_id: number; reason_type: ForwardReasonType; remarks: string }
  ) => void
  onReject: (requestId: number, reason: string) => void
  onAccept: (requestId: number) => void
  onDecline: (requestId: number, reason: string) => void
  isSubmitting: boolean
}

const FORWARD_REASONS = [
  { value: 'WRONG_AI_CLASSIFICATION', label: 'Wrong AI Classification' },
  { value: 'WRONG_CITIZEN_CATEGORY', label: 'Wrong Citizen Category' },
  { value: 'ADMINISTRATIVE_TRANSFER', label: 'Administrative Transfer' },
  { value: 'DUPLICATE_DEPARTMENT', label: 'Duplicate Department Assignment' },
  { value: 'OTHER', label: 'Other (specify in remarks)' },
]

export function ForwardRequestsDetailsDrawer({
  isOpen,
  onClose,
  requestId,
  detail,
  isLoading,
  isIncoming,
  onApprove,
  onReject,
  onAccept,
  onDecline,
  isSubmitting,
}: ForwardRequestsDetailsDrawerProps) {
  const [remarks, setRemarks] = useState('')
  const [reasonType, setReasonType] = useState<ForwardReasonType>('WRONG_AI_CLASSIFICATION')
  const [destDeptId, setDestDeptId] = useState<number | ''>('')
  const [showDenyForm, setShowDenyForm] = useState(false)
  const [denyReason, setDenyReason] = useState('')

  // Query departments for destination selection
  const { data: departments = [] } = useDepartmentsQuery(!isIncoming)

  if (!isOpen) return null

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return undefined
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    const normalizedPath = path.replace(/\\/g, '/')
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`
    return `${APP_CONFIG.apiBaseUrl}${cleanPath}`
  }

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (requestId && destDeptId !== '' && remarks.trim().length >= 5) {
      onApprove(requestId, {
        department_id: Number(destDeptId),
        reason_type: reasonType,
        remarks: remarks,
      })
      setRemarks('')
      setDestDeptId('')
      onClose()
    }
  }

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (requestId && denyReason.trim().length >= 5) {
      if (isIncoming) {
        onDecline(requestId, denyReason)
      } else {
        onReject(requestId, denyReason)
      }
      setDenyReason('')
      setShowDenyForm(false)
      onClose()
    }
  }

  const handleAccept = () => {
    if (requestId) {
      onAccept(requestId)
      onClose()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-neutral-900/60 transition-opacity duration-300 dark:bg-black/80"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-2xl flex-col border-l border-neutral-200 bg-white shadow-2xl transition-transform duration-300 sm:w-[650px] dark:border-neutral-800 dark:bg-[#1C1C1E]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800/80">
          <div>
            <h2 className="text-neutral-850 text-base font-black tracking-tight dark:text-white">
              {isIncoming ? 'Incoming Transfer Request' : 'Outgoing Forward Request'}
            </h2>
            {detail && (
              <p className="text-neutral-450 mt-0.5 text-[11px] font-extrabold tracking-wider uppercase dark:text-neutral-500">
                Report Ref: {detail.report.report_number}
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

        {/* Scroll Content */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0A3C7D] border-t-transparent dark:border-blue-500" />
              <span className="text-xs font-bold text-neutral-500">Loading request details...</span>
            </div>
          ) : !detail ? (
            <div className="flex h-40 items-center justify-center text-xs font-semibold text-neutral-500">
              Failed to load details.
            </div>
          ) : (
            <>
              {/* Rejection / Decision Details Banner */}
              {(detail.status === 'Rejected' || detail.decision_reason) && (
                <div className="border-rose-250 rounded-xl border bg-rose-50/60 p-4 dark:border-rose-950/40 dark:bg-rose-950/20">
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-black tracking-wider text-rose-700 uppercase dark:text-rose-400">
                    <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    Rejection / Decision Details
                  </h4>
                  <div className="space-y-2">
                    {detail.decision_reason && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300">
                          Rejection Reason:
                        </span>
                        <p className="rounded-lg border border-rose-200/80 bg-white p-3 text-xs leading-relaxed font-semibold text-rose-950 shadow-2xs dark:border-rose-900/50 dark:bg-neutral-900 dark:text-rose-200">
                          {detail.decision_reason}
                        </p>
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-400">
                      {detail.reviewer_name && (
                        <span>
                          Reviewed By:{' '}
                          <strong className="text-neutral-800 dark:text-neutral-200">
                            {detail.reviewer_name}
                          </strong>
                        </span>
                      )}
                      {detail.reviewed_at && (
                        <span>
                          Reviewed At:{' '}
                          <strong className="text-neutral-800 dark:text-neutral-200">
                            {new Date(detail.reviewed_at).toLocaleString()}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Request Status / Worker reason */}
              <div className="border-neutral-150 rounded-xl border bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
                <h4 className="text-neutral-450 mb-2 flex items-center gap-1.5 text-xs font-black tracking-wider uppercase dark:text-neutral-500">
                  <Activity className="h-4 w-4 text-blue-500" />
                  Worker Submission Details
                </h4>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    <span className="text-neutral-400">Request Reason:</span>
                  </p>
                  <p className="rounded-lg border border-neutral-100 bg-white p-3 text-xs leading-relaxed font-medium text-neutral-700 dark:border-neutral-800 dark:bg-[#151516] dark:text-neutral-300">
                    {detail.reason}
                  </p>
                  <div className="mt-2 flex justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    <span>Status:</span>
                    <span className="text-[#0A3C7D] dark:text-blue-400">{detail.status}</span>
                  </div>
                </div>
              </div>

              {/* Report Images Section: Original Uploaded Image & AI Annotated Image */}
              {(detail.images.original_image || detail.images.annotated_image) && (
                <div className="space-y-3">
                  <h4 className="text-neutral-450 flex items-center gap-1.5 text-xs font-black tracking-wider uppercase dark:text-neutral-500">
                    <FileImage className="h-4 w-4 text-blue-500" />
                    Report Visual Evidence
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {detail.images.original_image && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                          Uploaded Report Image
                        </span>
                        <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
                          <img
                            src={getImageUrl(detail.images.original_image)}
                            alt="Uploaded Civic report"
                            className="h-44 w-full cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-95"
                            onClick={() => {
                              const url = getImageUrl(detail.images.original_image)
                              if (url) window.open(url, '_blank')
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {detail.images.annotated_image && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black tracking-wider text-blue-600 uppercase dark:text-blue-400">
                          AI Annotated Image
                        </span>
                        <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-neutral-50 p-1 dark:border-blue-900/40 dark:bg-neutral-900">
                          <img
                            src={getImageUrl(detail.images.annotated_image)}
                            alt="AI Annotated report"
                            className="h-44 w-full cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-95"
                            onClick={() => {
                              const url = getImageUrl(detail.images.annotated_image)
                              if (url) window.open(url, '_blank')
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Grid: Worker Info and Report Metadata */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="border-neutral-150 space-y-2.5 rounded-xl border p-4 dark:border-neutral-800">
                  <h5 className="text-neutral-450 flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
                    <User className="h-3.5 w-3.5 text-[#0A3C7D] dark:text-blue-400" />
                    Field Worker Details
                  </h5>
                  <div className="space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    <p className="flex justify-between">
                      <span className="text-neutral-400">Name:</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-100">
                        {detail.worker.name}
                      </span>
                    </p>
                    <p className="flex justify-between gap-2">
                      <span className="text-neutral-400">Email:</span>
                      <span className="truncate text-right font-medium text-neutral-700 select-all dark:text-neutral-300">
                        {detail.worker.email || 'N/A'}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-neutral-400">Phone:</span>
                      <span className="font-medium text-neutral-700 select-all dark:text-neutral-300">
                        {detail.worker.phone || 'N/A'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="border-neutral-150 space-y-2.5 rounded-xl border p-4 dark:border-neutral-800">
                  <h5 className="text-neutral-450 flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
                    <Building className="h-3.5 w-3.5 text-[#0A3C7D] dark:text-blue-400" />
                    Department Scope
                  </h5>
                  <div className="space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    <p className="flex justify-between">
                      <span className="text-neutral-400">Source Sector:</span>
                      <span>{detail.departments.source_department.name}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-neutral-400">Proposed Sector:</span>
                      <span>{detail.departments.destination_department?.name || 'Unassigned'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Geographic Metadata */}
              <div className="border-neutral-150 space-y-2 rounded-xl border p-4 dark:border-neutral-800">
                <h5 className="text-neutral-450 flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
                  <MapPin className="h-3.5 w-3.5 text-[#0A3C7D] dark:text-blue-400" />
                  Report Address Details
                </h5>
                <div className="space-y-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  <p className="flex justify-between">
                    <span className="text-neutral-400">Address:</span>
                    <span
                      className="max-w-[280px] truncate text-right"
                      title={detail.report.address || ''}
                    >
                      {detail.report.address || 'Unavailable'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-neutral-400">Coordinates:</span>
                    <span>
                      {detail.report.latitude.toFixed(6)}, {detail.report.longitude.toFixed(6)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Timeline context */}
              {detail.timeline.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-neutral-450 flex items-center gap-1.5 text-xs font-black tracking-wider uppercase dark:text-neutral-500">
                    <History className="h-4 w-4 text-blue-500" />
                    Request Timeline History
                  </h4>
                  <div className="relative space-y-4 border-l border-neutral-200 pl-4 dark:border-neutral-800">
                    {detail.timeline.map((t, idx) => (
                      <div key={idx} className="relative space-y-0.5 text-xs">
                        <div className="absolute top-1 -left-[20.5px] h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-500 dark:border-[#1C1C1E]" />
                        <span className="text-[10px] text-neutral-400">
                          {new Date(t.created_at).toLocaleString()}
                        </span>
                        <p className="dark:text-neutral-250 font-extrabold text-neutral-700">
                          {t.title}
                        </p>
                        <p className="font-medium text-neutral-500 dark:text-neutral-400">
                          {t.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {detail && !isLoading && (
          <div className="border-t border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800/80 dark:bg-neutral-900/60">
            {/* Rejection / Deny Input popup */}
            {showDenyForm ? (
              <form onSubmit={handleRejectSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label
                    htmlFor="forward-reject-reason-input"
                    className="text-[10px] font-black tracking-wider text-rose-700 uppercase dark:text-rose-400"
                  >
                    Provide Reason (Min 5 characters)
                  </label>
                  <textarea
                    id="forward-reject-reason-input"
                    value={denyReason}
                    onChange={(e) => setDenyReason(e.target.value)}
                    required
                    placeholder="Enter remarks explaining why this transfer request is being declined..."
                    rows={2}
                    className="w-full rounded-lg border border-neutral-200 bg-white p-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-rose-500 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setShowDenyForm(false)}
                    className="dark:border-neutral-850 h-8"
                  >
                    Go Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || denyReason.trim().length < 5}
                    className="h-8 bg-rose-600 text-xs font-black tracking-wider text-white uppercase hover:bg-rose-500"
                  >
                    Confirm Decline
                  </Button>
                </div>
              </form>
            ) : !isIncoming && detail.status === 'Pending' ? (
              /* Outgoing review options: Approve & Forward, or Reject */
              <form onSubmit={handleApproveSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label
                      htmlFor="destination-department-select"
                      className="text-neutral-450 text-[10px] font-black tracking-wider uppercase dark:text-neutral-500"
                    >
                      Destination Department
                    </label>
                    <select
                      id="destination-department-select"
                      value={destDeptId}
                      onChange={(e) => setDestDeptId(e.target.value ? Number(e.target.value) : '')}
                      required
                      className="h-9 w-full cursor-pointer rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-bold outline-none dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
                    >
                      <option value="">Select Department...</option>
                      {departments
                        .filter((d) => d.id !== detail.departments.source_department.id)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="forward-reason-select"
                      className="text-neutral-450 text-[10px] font-black tracking-wider uppercase dark:text-neutral-500"
                    >
                      Transfer Reason Category
                    </label>
                    <select
                      id="forward-reason-select"
                      value={reasonType}
                      onChange={(e) => setReasonType(e.target.value as ForwardReasonType)}
                      required
                      className="h-9 w-full cursor-pointer rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-bold outline-none dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
                    >
                      {FORWARD_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="forward-remarks-textarea"
                    className="text-neutral-450 text-[10px] font-black tracking-wider uppercase dark:text-neutral-500"
                  >
                    Transfer Decision Remarks (Min 5 characters)
                  </label>
                  <textarea
                    id="forward-remarks-textarea"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    required
                    placeholder="Provide specific notes on why this civic issue belongs to the destination department..."
                    rows={2}
                    className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-2 dark:border-neutral-800/60">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => setShowDenyForm(true)}
                    className="h-9 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-950/20 dark:hover:bg-rose-950/10"
                  >
                    Reject Request
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || destDeptId === '' || remarks.trim().length < 5}
                    className="h-9 bg-emerald-600 text-xs font-black tracking-wider text-white uppercase hover:bg-emerald-500"
                  >
                    Approve & Forward
                  </Button>
                </div>
              </form>
            ) : isIncoming &&
              (detail.status === 'Approved By Source' ||
                detail.status === 'Waiting Destination') ? (
              /* Incoming decision options: Accept, or Decline */
              <div className="flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setShowDenyForm(true)}
                  className="flex h-9 items-center gap-1 border-rose-200 bg-white px-4 text-xs font-black tracking-wider text-rose-600 uppercase hover:bg-rose-50 hover:text-rose-700 dark:border-rose-950/20 dark:bg-neutral-900 dark:text-rose-400 dark:hover:bg-rose-950/10"
                >
                  <XCircle className="h-4 w-4" />
                  Decline Transfer
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleAccept}
                  className="flex h-9 items-center gap-1 bg-emerald-600 px-4 text-xs font-black tracking-wider text-white uppercase hover:bg-emerald-500"
                >
                  <CheckCircle className="h-4 w-4" />
                  Accept Transfer
                </Button>
              </div>
            ) : (
              <div className="text-right text-xs font-bold text-neutral-500 uppercase">
                Reviewed / Closed Request
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
