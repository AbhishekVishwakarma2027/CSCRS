import React, { useState } from 'react'
import { ClipboardCheck, Search, ShieldAlert, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  usePendingReviewsQuery,
  useReviewDetailsQuery,
  useApproveReviewMutation,
  useRejectReviewMutation,
} from '../hooks/use-resolutions'
import { ManualReviewDetailsDrawer } from '../components/ManualReviewDetailsDrawer'
import { ConfirmationDialog } from '@/features/reports/components/ConfirmationDialog'

export default function ManualReviewPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null)

  // Confirmation state
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false)
  const [approveTargetId, setApproveTargetId] = useState<number | null>(null)

  // React Queries
  const {
    data: pendingReviews = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = usePendingReviewsQuery()
  const { data: detailData, isLoading: isDetailLoading } = useReviewDetailsQuery(selectedReportId)

  // Mutations
  const approveMutation = useApproveReviewMutation()
  const rejectMutation = useRejectReviewMutation()

  const handleApproveTrigger = (reportId: number) => {
    setApproveTargetId(reportId)
    setIsApproveConfirmOpen(true)
  }

  const handleApprove = async (reportId: number) => {
    try {
      await approveMutation.mutateAsync(reportId)
      toast.success('Resolution approved successfully!')
      setSelectedReportId(null)
    } catch (e) {
      console.error(e)
      toast.error('Failed to approve resolution.')
    }
  }

  const handleReject = async (reportId: number, reason: string) => {
    try {
      await rejectMutation.mutateAsync({ reportId, reason })
      toast.success('Resolution rejected and sent back to worker.')
      setSelectedReportId(null)
    } catch (e) {
      console.error(e)
      toast.error('Failed to reject resolution.')
    }
  }

  // Client-side text search filtering
  const filteredReviews = pendingReviews.filter(
    (item) =>
      item.report_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.issue_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.worker_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getScoreColorClass = (score: number | null) => {
    if (score === null) return 'border-neutral-200 text-neutral-500 bg-neutral-50'
    if (score >= 0.8)
      return 'border-emerald-250 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/15'
    if (score >= 0.5) return 'border-amber-250 text-amber-600 bg-amber-50/50 dark:bg-amber-950/15'
    return 'border-rose-250 text-rose-600 bg-rose-50/50 dark:bg-rose-950/15'
  }

  return (
    <div className="space-y-6 pb-10 text-left select-none">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
        <div className="flex shrink-0 flex-col gap-1.5">
          <h1 className="text-2xl font-black tracking-tight text-neutral-800 dark:text-white">
            Manual Verification Review
          </h1>
          <p className="text-[13px] leading-relaxed font-semibold text-neutral-500 dark:text-neutral-400">
            Audit resolutions flagged by AI verification systems due to low likeness score or
            metadata warnings.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="dark:border-neutral-850 flex h-8 items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh Queue
        </Button>
      </div>

      {/* Control Banner search */}
      <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <div className="relative flex-1">
          <Search className="text-neutral-450 absolute top-2.5 left-3 h-4 w-4 dark:text-neutral-500" />
          <input
            type="text"
            placeholder="Search by reference, issue category, or worker name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 pr-4 pl-9.5 text-xs font-semibold transition-all outline-none placeholder:text-neutral-400 focus:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200"
          />
        </div>
      </div>

      {/* Main Review Queue Table */}
      {isLoading ? (
        <div className="flex h-52 flex-col items-center justify-center gap-2">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#0A3C7D] border-t-transparent dark:border-blue-500" />
          <span className="text-xs font-bold text-neutral-500">Retrieving manual queue...</span>
        </div>
      ) : error ? (
        <div className="border-rose-250 flex h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-rose-50/10 p-5 dark:border-rose-950/20">
          <ShieldAlert className="h-8 w-8 text-rose-500" />
          <span className="text-xs font-bold text-rose-600">Failed to load manual reviews.</span>
          <Button variant="outline" size="xs" onClick={() => refetch()} className="h-7">
            Retry Connection
          </Button>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/20 p-5 dark:border-neutral-800">
          <ClipboardCheck className="h-8 w-8 text-neutral-400" />
          <span className="text-xs font-bold text-neutral-500">No pending reviews found.</span>
          <p className="text-[11px] font-medium text-neutral-400">
            All worker resolutions have been verified automatically or audited.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
          <table className="w-full border-collapse text-left text-xs font-bold text-neutral-700 dark:text-neutral-300">
            <thead>
              <tr className="text-neutral-450 dark:border-neutral-850 border-b border-neutral-100 bg-neutral-50/70 text-[10px] font-black tracking-wider uppercase dark:bg-neutral-900/40 dark:text-neutral-500">
                <th className="px-4 py-3">Reference ID</th>
                <th className="px-4 py-3">Issue Category</th>
                <th className="px-4 py-3">Submitted By</th>
                <th className="px-4 py-3 text-center">AI Similarity</th>
                <th className="px-4 py-3">Submitted Date</th>
                <th className="px-4 py-3 text-center">AI Decision</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="dark:divide-neutral-850 divide-y divide-neutral-100">
              {filteredReviews.map((item) => (
                <tr
                  key={item.report_id}
                  className="transition-colors hover:bg-neutral-50/30 dark:hover:bg-neutral-900/10"
                >
                  <td className="px-4 py-3 font-extrabold text-[#0A3C7D] select-all dark:text-blue-400">
                    {item.report_number}
                  </td>
                  <td className="px-4 py-3 font-semibold capitalize">
                    {item.issue_type.toLowerCase()}
                  </td>
                  <td className="px-4 py-3 font-semibold">{item.worker_name}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-md border px-1.5 py-0.5 text-[10px] font-extrabold ${getScoreColorClass(
                        item.scene_similarity
                      )}`}
                    >
                      {item.scene_similarity !== null
                        ? `${(item.scene_similarity * 100).toFixed(0)}%`
                        : 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-500 dark:text-neutral-400">
                    {new Date(item.resolved_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${
                        item.verification_decision === 'PASS'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-950 dark:bg-emerald-950/20'
                          : item.verification_decision === 'FAIL'
                            ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-950 dark:bg-rose-950/20'
                            : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-950 dark:bg-amber-950/20'
                      }`}
                    >
                      {item.verification_decision || 'NEEDS REVIEW'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => setSelectedReportId(item.report_id)}
                      className="h-7 cursor-pointer dark:border-neutral-800"
                    >
                      Audit Resolution
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details drawer */}
      <ManualReviewDetailsDrawer
        isOpen={selectedReportId !== null}
        onClose={() => setSelectedReportId(null)}
        reportId={selectedReportId}
        detail={detailData}
        isLoading={isDetailLoading}
        onApprove={handleApproveTrigger}
        onReject={handleReject}
        isSubmitting={approveMutation.isPending || rejectMutation.isPending}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isApproveConfirmOpen}
        title="Approve Resolution"
        description="Are you sure you want to approve this resolution? This will mark the civic report as verified and close the manual review queue record."
        confirmLabel="Approve"
        cancelLabel="Cancel"
        isDanger={false}
        isSubmitting={approveMutation.isPending}
        onConfirm={async () => {
          if (approveTargetId) {
            await handleApprove(approveTargetId)
            setIsApproveConfirmOpen(false)
            setApproveTargetId(null)
          }
        }}
        onCancel={() => {
          setIsApproveConfirmOpen(false)
          setApproveTargetId(null)
        }}
      />
    </div>
  )
}
