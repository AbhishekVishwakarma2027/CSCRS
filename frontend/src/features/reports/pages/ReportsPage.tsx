import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileText, ChevronLeft, ChevronRight, X, AlertCircle, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { UserRole } from '@/types/auth.types'
import { Button } from '@/components/ui/button'

import { TableFilterHeader } from '../components/TableFilterHeader'
import { ReportsTable } from '../components/ReportsTable'
import { ReportDetailsDrawer } from '../components/ReportDetailsDrawer'
import { ConfirmationDialog } from '../components/ConfirmationDialog'
import { TransferRequestModal } from '../components/TransferRequestModal'
import { AssignWorkerModal } from '../components/AssignWorkerModal'
import type { ReportListItem } from '../types'
import {
  useReportsListQuery,
  useDepartmentsQuery,
  useAssignReportMutation,
  useCancelReportMutation,
  useReopenReportMutation,
} from '../hooks/use-reports'
import {
  usePendingRequestsQuery,
  useApproveForwardMutation,
} from '@/features/forward-requests/hooks/use-forward-requests'
import type { ForwardReasonType } from '@/features/forward-requests/types'

const CANCELLATION_REASONS = [
  { value: 'DUPLICATE', label: 'Duplicate Report' },
  { value: 'ALREADY_RESOLVED', label: 'Already Resolved' },
  { value: 'NOT_A_CIVIC_ISSUE', label: 'Not a Civic Issue' },
  { value: 'FALSE_REPORT', label: 'Spam or False representation' },
  { value: 'OUTSIDE_JURISDICTION', label: 'Location is outside city boundaries' },
  { value: 'OTHER', label: 'Other (specify in remarks)' },
]

export default function ReportsPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const activeRole = user?.role || UserRole.CITY_ADMIN
  const isCityAdmin = activeRole === UserRole.CITY_ADMIN
  const isDeptAdmin = activeRole === UserRole.DEPARTMENT_ADMIN

  // ─── 1. Persistent Layout Preferences (localStorage) ──────────────────────────
  const [density, setDensity] = useState<'comfortable' | 'compact'>(() => {
    const saved = localStorage.getItem('cscrs-reports-prefs-density')
    return saved === 'compact' ? 'compact' : 'comfortable'
  })

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('cscrs-reports-prefs-columns')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // Fallback to default columns
      }
    }
    return [
      'report_number',
      'issue_type',
      'department',
      'priority',
      'created_at',
      'status',
      'actions',
    ]
  })

  // Synchronize layout preferences to localStorage
  useEffect(() => {
    localStorage.setItem('cscrs-reports-prefs-density', density)
  }, [density])

  useEffect(() => {
    localStorage.setItem('cscrs-reports-prefs-columns', JSON.stringify(visibleColumns))
  }, [visibleColumns])

  // Convert visibleColumns array to react-table friendly record
  const columnVisibilityRecord = useMemo(() => {
    const record: Record<string, boolean> = {}
    const defaultCols = [
      'report_number',
      'issue_type',
      'department',
      'priority',
      'created_at',
      'status',
      'actions',
    ]
    defaultCols.forEach((col) => {
      record[col] = visibleColumns.includes(col)
    })
    return record
  }, [visibleColumns])

  // ─── 2. URL State & Query Filter Parameters ────────────────────────────────
  const pageParam = parseInt(searchParams.get('page') || '1', 10)
  const queryParam = searchParams.get('q') || ''
  const statusParam = searchParams.get('status') || ''
  const priorityParam = searchParams.get('priority') || ''
  const categoryParam = searchParams.get('issue_type') || ''

  // Local state for debounced search input text
  const [searchInputValue, setSearchInputValue] = useState(queryParam)

  // Debounced Search Sync
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (searchInputValue) {
          next.set('q', searchInputValue)
        } else {
          next.delete('q')
        }
        next.set('page', '1') // Reset index to page 1 on search text update
        return next
      })
    }, 300)
    return () => clearTimeout(handler)
  }, [searchInputValue, setSearchParams])

  // Standard filter setters
  const setFilterParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      next.set('page', '1') // Reset to page 1
      return next
    })
  }

  // ─── 3. Queries and Mutations ───────────────────────────────────────────────
  // Fetch department lookup mapping (authorized for City Admins, Super Admins, and Department Admins)
  const { data: deptsData } = useDepartmentsQuery(isCityAdmin || isDeptAdmin)
  const departmentsMap = useMemo<Record<number, string>>(() => {
    const mapping: Record<number, string> = {}
    if (deptsData) {
      deptsData.forEach((d: { id: number; name: string }) => {
        mapping[d.id] = d.name
      })
    }
    return mapping
  }, [deptsData])

  // Fetch reports list
  const reportsListFilters = {
    page: pageParam,
    page_size: 10,
    q: queryParam,
    status: statusParam,
    priority: priorityParam,
    issue_type: categoryParam,
  }

  const {
    data: paginatedResponse,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useReportsListQuery(activeRole, reportsListFilters)

  const reports = paginatedResponse?.items || []
  const totalPages = paginatedResponse?.total_pages || 1
  const totalItems = paginatedResponse?.total_items || 0

  // Mutations
  const assignMutation = useAssignReportMutation()
  const cancelMutation = useCancelReportMutation()
  const reopenMutation = useReopenReportMutation()

  // Forward Requests
  const { data: pendingForwards = [] } = usePendingRequestsQuery()
  const approveForwardMutation = useApproveForwardMutation()
  const [selectedReportForTransfer, setSelectedReportForTransfer] = useState<ReportListItem | null>(
    null
  )

  // Assign Worker State
  const [selectedReportForAssign, setSelectedReportForAssign] = useState<ReportListItem | null>(
    null
  )

  // ─── 4. Details Drawer & Confirmation Dialogs Toggles ────────────────────────
  const [selectedReportForDetails, setSelectedReportForDetails] = useState<ReportListItem | null>(
    null
  )

  const [activeCancelId, setActiveCancelId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('DUPLICATE')
  const [cancelRemarks, setCancelRemarks] = useState('')
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)

  const [activeReopenId, setActiveReopenId] = useState<number | null>(null)
  const [reopenReason, setReopenReason] = useState('')
  const [isReopenConfirmOpen, setIsReopenConfirmOpen] = useState(false)

  // ─── 5. Trigger Handler Operations ──────────────────────────────────────────
  const handleOpenAssignModal = (reportId: number) => {
    const reportToAssign =
      reports.find((r) => r.id === reportId) ||
      (selectedReportForDetails?.id === reportId ? selectedReportForDetails : null)
    if (reportToAssign) {
      setSelectedReportForAssign(reportToAssign)
    } else {
      setSelectedReportForAssign({
        id: reportId,
        report_number: reportId.toString(),
      } as ReportListItem)
    }
  }

  const handleAssignExecute = async (reportId: number, workerId?: number, remarks?: string) => {
    try {
      await assignMutation.mutateAsync({ reportId, workerId, remarks })
      toast.success(
        workerId
          ? `Worker assigned successfully to Report #${reportId}!`
          : `Report #${reportId} auto-assigned successfully!`
      )
      setSelectedReportForAssign(null)
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } }
      toast.error(apiError.response?.data?.detail || 'Assignment failed')
    }
  }

  // Opens double-confirmation popup
  const handleCancelFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCancelId) return
    if (cancelRemarks.trim().length < 5) {
      toast.error('Remarks must be at least 5 characters long')
      return
    }
    setIsCancelConfirmOpen(true)
  }

  // Submits the cancellation mutation
  const executeCancel = async () => {
    if (!activeCancelId) return
    try {
      await cancelMutation.mutateAsync({
        reportId: activeCancelId,
        reasonType: cancelReason,
        remarks: cancelRemarks,
      })
      toast.success('Report successfully cancelled.')
      setActiveCancelId(null)
      setCancelRemarks('')
      setIsCancelConfirmOpen(false)
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } }
      toast.error(apiError.response?.data?.detail || 'Cancellation failed')
    }
  }

  // Opens double-confirmation popup
  const handleReopenFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeReopenId) return
    setIsReopenConfirmOpen(true)
  }

  // Submits the reopening mutation
  const executeReopen = async () => {
    if (!activeReopenId) return
    try {
      await reopenMutation.mutateAsync({
        reportId: activeReopenId,
        reason: reopenReason || undefined,
      })
      toast.success('Report successfully reopened.')
      setActiveReopenId(null)
      setReopenReason('')
      setIsReopenConfirmOpen(false)
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } }
      toast.error(apiError.response?.data?.detail || 'Reopening failed')
    }
  }
  // Executes report transfer / forward request approval
  const handleExecuteTransfer = async (data: {
    department_id: number
    reason_type: ForwardReasonType
    remarks: string
  }) => {
    if (!selectedReportForTransfer) return

    const pendingReq = pendingForwards.find((p) => p.report_id === selectedReportForTransfer.id)

    try {
      if (pendingReq) {
        await approveForwardMutation.mutateAsync({
          requestId: pendingReq.id,
          payload: {
            department_id: data.department_id,
            reason_type: data.reason_type,
            remarks: data.remarks,
          },
        })
        toast.success(
          `Report #${selectedReportForTransfer.report_number} forward request approved and routed to destination department!`
        )
      } else {
        toast.error(
          'No pending worker forward request found for this report. The report must be flagged by the assigned worker before routing.'
        )
        return
      }

      refetch()
      setSelectedReportForTransfer(null)
    } catch (err) {
      console.error(err)
      const apiError = err as { response?: { data?: { detail?: string } } }
      toast.error(apiError.response?.data?.detail || 'Failed to process report transfer request.')
    }
  }

  // ─── 6. Pagination Navigation ──────────────────────────────────────────────
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', String(newPage))
        return next
      })
    }
  }

  // Available column titles for visible checkbox toggles
  const ALL_COLUMNS = [
    { id: 'report_number', label: 'Reference Number' },
    { id: 'issue_type', label: 'Issue Category' },
    ...(!isDeptAdmin ? [{ id: 'department', label: 'Department' }] : []),
    { id: 'priority', label: 'Priority' },
    { id: 'created_at', label: 'Created Date' },
    { id: 'status', label: 'Status' },
  ]

  const handleToggleColumn = (colId: string) => {
    setVisibleColumns((prev) =>
      prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId]
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Widget */}
      <div className="flex items-center justify-between select-none">
        <div>
          <h2 className="dark:text-blue-450 flex items-center gap-2 text-2xl font-black tracking-tight text-[#0A3C7D]">
            <FileText className="h-5 w-5 text-[#0A3C7D] dark:text-blue-400" />
            {isCityAdmin ? 'Citywide Civic Records' : 'Department Queue'}
          </h2>
          <p className="text-neutral-450 mt-1 text-[13px] font-semibold dark:text-neutral-500">
            Manage, verify, audit, and track operational civic reports across municipal sectors.
          </p>
        </div>
      </div>

      {/* 2. Filter & Toolbar header */}
      <TableFilterHeader
        searchValue={searchInputValue}
        onSearchChange={setSearchInputValue}
        statusValue={statusParam}
        onStatusChange={(val) => setFilterParam('status', val)}
        priorityValue={priorityParam}
        onPriorityChange={(val) => setFilterParam('priority', val)}
        categoryValue={categoryParam}
        onCategoryChange={(val) => setFilterParam('issue_type', val)}
        density={density}
        onDensityChange={setDensity}
        allColumns={ALL_COLUMNS}
        visibleColumns={visibleColumns}
        onToggleColumn={handleToggleColumn}
        isRefetching={isRefetching}
        onRefresh={refetch}
      />

      {/* 3. Main TanStack Reports Table grid */}
      <ReportsTable
        data={reports}
        isLoading={isLoading}
        error={error}
        userRole={activeRole}
        density={density}
        columnVisibility={columnVisibilityRecord}
        departmentsMap={departmentsMap}
        onRefetch={refetch}
        onViewDetails={setSelectedReportForDetails}
        onAssign={handleOpenAssignModal}
        onCancel={setActiveCancelId}
        onReopen={setActiveReopenId}
        onTransfer={setSelectedReportForTransfer}
      />

      {/* 4. Pagination Controls Footer - Always rendered when loaded successfully */}
      {!isLoading && !error && isCityAdmin && (
        <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 shadow-xs select-none dark:border-neutral-800 dark:bg-[#1C1C1E]">
          <span className="text-neutral-455 dark:text-neutral-505 text-[13px] font-bold">
            Showing {totalItems > 0 ? (pageParam - 1) * 10 + 1 : 0}–
            {Math.min(pageParam * 10, totalItems)} of {totalItems} items
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={pageParam <= 1}
              onClick={() => handlePageChange(pageParam - 1)}
              className="h-7 cursor-pointer px-2 text-xs font-bold dark:border-neutral-800"
            >
              <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Prev</span>
            </Button>

            {/* Direct Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <Button
                key={num}
                type="button"
                variant={pageParam === num ? 'default' : 'outline'}
                size="xs"
                onClick={() => handlePageChange(num)}
                className={`h-7 w-7 cursor-pointer p-0 text-xs font-extrabold dark:border-neutral-800 ${
                  pageParam === num
                    ? 'bg-[#0A3C7D] text-white hover:bg-[#0A3C7D]/90 dark:bg-blue-600 dark:hover:bg-blue-500'
                    : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400'
                }`}
              >
                {num}
              </Button>
            ))}

            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={pageParam >= totalPages}
              onClick={() => handlePageChange(pageParam + 1)}
              className="h-7 cursor-pointer px-2 text-xs font-bold dark:border-neutral-800"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── CANCELLATION MODAL DIALOG ────────────────────────────────────────── */}
      {activeCancelId && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 duration-200 dark:bg-black/80">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-[#1C1C1E]">
            <div className="dark:border-neutral-850 flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="flex items-center gap-1.5 text-sm font-black tracking-wider text-rose-600 uppercase">
                <AlertCircle className="h-4.5 w-4.5" />
                Cancel Report Issue
              </h3>
              <button
                type="button"
                onClick={() => setActiveCancelId(null)}
                className="text-neutral-450 cursor-pointer rounded-md outline-none hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleCancelFormSubmit}
              className="space-y-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-300"
            >
              <div className="space-y-1">
                <label className="text-neutral-450 text-[10px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Select Administrative Category
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 font-sans text-xs font-bold outline-none focus:ring-1 focus:ring-rose-500 dark:border-neutral-800 dark:bg-[#1C1C1E]"
                >
                  {CANCELLATION_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-450 text-[10px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Provide Detailed Remarks (Min 5 characters)
                </label>
                <textarea
                  value={cancelRemarks}
                  onChange={(e) => setCancelRemarks(e.target.value)}
                  placeholder="Enter specific administrative reasons for cancelling this report..."
                  required
                  rows={4}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 font-sans text-[13px] font-bold outline-none focus:ring-1 focus:ring-rose-500 dark:border-neutral-800 dark:bg-[#1C1C1E]"
                />
              </div>

              <div className="dark:border-neutral-850 flex items-center justify-end gap-2 border-t border-neutral-100 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveCancelId(null)}
                  className="h-8 cursor-pointer dark:border-neutral-800"
                >
                  Go Back
                </Button>
                <Button
                  type="submit"
                  disabled={cancelMutation.isPending || cancelRemarks.trim().length < 5}
                  className="h-8 cursor-pointer bg-rose-600 text-white hover:bg-rose-500"
                >
                  {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── REOPEN MODAL DIALOG ──────────────────────────────────────────────── */}
      {activeReopenId && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 duration-200 dark:bg-black/80">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-[#1C1C1E]">
            <div className="dark:border-neutral-850 flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="flex items-center gap-1.5 text-sm font-black tracking-wider text-emerald-600 uppercase">
                <RotateCcw className="h-4.5 w-4.5" />
                Reopen Civic Report Issue
              </h3>
              <button
                type="button"
                onClick={() => setActiveReopenId(null)}
                className="text-neutral-450 cursor-pointer rounded-md outline-none hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleReopenFormSubmit}
              className="space-y-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-300"
            >
              <div className="space-y-1">
                <label className="text-neutral-450 text-[10px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Provide Detailed Reopening Context
                </label>
                <textarea
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Enter remarks explaining why this report is being reopened for verification..."
                  rows={4}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 font-sans text-[13px] font-bold outline-none focus:ring-1 focus:ring-emerald-500 dark:border-neutral-800 dark:bg-[#1C1C1E]"
                />
              </div>

              <div className="dark:border-neutral-850 flex items-center justify-end gap-2 border-t border-neutral-100 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveReopenId(null)}
                  className="h-8 cursor-pointer dark:border-neutral-800"
                >
                  Go Back
                </Button>
                <Button
                  type="submit"
                  disabled={reopenMutation.isPending}
                  className="h-8 cursor-pointer bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  {reopenMutation.isPending ? 'Reopening...' : 'Confirm Reopen'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ─── DETAILS DRAWER & OPERATION DOUBLE CONFIRMATIONS ──────────────────── */}
      <ReportDetailsDrawer
        isOpen={!!selectedReportForDetails}
        onClose={() => setSelectedReportForDetails(null)}
        report={selectedReportForDetails}
        departmentsMap={departmentsMap}
        onAssign={(id) => {
          handleOpenAssignModal(id)
        }}
        onTransfer={(r) => {
          setSelectedReportForDetails(null)
          setSelectedReportForTransfer(r)
        }}
      />

      <ConfirmationDialog
        isOpen={isCancelConfirmOpen}
        title="Double Confirm Cancellation"
        description="Are you absolutely sure you want to cancel this report? This action will alert all coordinators and cannot be undone."
        confirmLabel="Yes, Cancel"
        cancelLabel="No, Go Back"
        isDanger={true}
        isSubmitting={cancelMutation.isPending}
        onConfirm={executeCancel}
        onCancel={() => setIsCancelConfirmOpen(false)}
      />

      <ConfirmationDialog
        isOpen={isReopenConfirmOpen}
        title="Double Confirm Reopening"
        description="Are you sure you want to reopen this report? This will change the status to Pending/Reopened and reschedule automatic worker assignment queueing."
        confirmLabel="Yes, Reopen"
        cancelLabel="No, Go Back"
        isDanger={false}
        isSubmitting={reopenMutation.isPending}
        onConfirm={executeReopen}
        onCancel={() => setIsReopenConfirmOpen(false)}
      />

      {/* ─── TRANSFER / FORWARD MODAL DIALOG ────────────────────────────────────── */}
      <TransferRequestModal
        isOpen={!!selectedReportForTransfer}
        onClose={() => setSelectedReportForTransfer(null)}
        report={selectedReportForTransfer}
        onSubmit={handleExecuteTransfer}
        isSubmitting={approveForwardMutation.isPending}
      />

      {/* ─── MANUAL WORKER ASSIGNMENT MODAL DIALOG ─────────────────────────────── */}
      <AssignWorkerModal
        isOpen={!!selectedReportForAssign}
        onClose={() => setSelectedReportForAssign(null)}
        reportId={selectedReportForAssign?.id || null}
        reportNumber={selectedReportForAssign?.report_number || null}
        onAssign={handleAssignExecute}
        isSubmitting={assignMutation.isPending}
      />
    </div>
  )
}
