import React, { useState } from 'react'
import { ArrowLeftRight, Search, ShieldAlert, RefreshCw, Inbox, Send, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  usePendingRequestsQuery,
  useIncomingRequestsQuery,
  useRejectedRequestsQuery,
  useForwardDetailsQuery,
  useApproveForwardMutation,
  useRejectForwardMutation,
  useAcceptForwardMutation,
  useDeclineForwardMutation,
} from '../hooks/use-forward-requests'
import { ForwardRequestsDetailsDrawer } from '../components/ForwardRequestsDetailsDrawer'
import { ConfirmationDialog } from '@/features/reports/components/ConfirmationDialog'
import type { ForwardReasonType } from '../types'

export default function ForwardRequestsPage() {
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming' | 'rejected'>('outgoing')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)

  // React Queries
  const {
    data: pendingForwards = [],
    isLoading: isPendingLoading,
    error: pendingError,
    refetch: refetchPending,
    isRefetching: isPendingRefetching,
  } = usePendingRequestsQuery()

  const {
    data: incomingForwards = [],
    isLoading: isIncomingLoading,
    error: incomingError,
    refetch: refetchIncoming,
    isRefetching: isIncomingRefetching,
  } = useIncomingRequestsQuery()

  const {
    data: rejectedForwards = [],
    isLoading: isRejectedLoading,
    error: rejectedError,
    refetch: refetchRejected,
    isRefetching: isRejectedRefetching,
  } = useRejectedRequestsQuery()

  const { data: detailData, isLoading: isDetailLoading } = useForwardDetailsQuery(selectedRequestId)

  // Confirmation state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    action: 'approve' | 'reject' | 'accept' | 'decline' | null
    data?: {
      requestId: number
      payload?: { department_id: number; reason_type: ForwardReasonType; remarks: string }
      reason?: string
    }
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: null,
  })

  // Mutations
  const approveMutation = useApproveForwardMutation()
  const rejectMutation = useRejectForwardMutation()
  const acceptMutation = useAcceptForwardMutation()
  const declineMutation = useDeclineForwardMutation()

  const handleApproveTrigger = (
    requestId: number,
    payload: { department_id: number; reason_type: ForwardReasonType; remarks: string }
  ) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Approve & Forward',
      description:
        'Are you sure you want to approve this forward request and route it to the selected destination department?',
      action: 'approve',
      data: { requestId, payload },
    })
  }

  const handleRejectTrigger = (requestId: number, reason: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reject Request',
      description:
        'Are you sure you want to reject this forward request? This will route it back to the worker.',
      action: 'reject',
      data: { requestId, reason },
    })
  }

  const handleAcceptTrigger = (requestId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Accept Transfer',
      description:
        'Are you sure you want to accept this incoming transfer request? The report will be assigned to your department backlog.',
      action: 'accept',
      data: { requestId },
    })
  }

  const handleDeclineTrigger = (requestId: number, reason: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Decline Transfer',
      description:
        'Are you sure you want to decline this incoming transfer request? It will be returned to the sender department.',
      action: 'decline',
      data: { requestId, reason },
    })
  }

  const handleApprove = async (
    requestId: number,
    payload: { department_id: number; reason_type: ForwardReasonType; remarks: string }
  ) => {
    try {
      await approveMutation.mutateAsync({ requestId, payload })
      toast.success('Forward request approved and routed successfully!')
      setSelectedRequestId(null)
    } catch (e) {
      console.error(e)
      toast.error('Failed to approve forward request.')
    }
  }

  const handleReject = async (requestId: number, reason: string) => {
    try {
      await rejectMutation.mutateAsync({ requestId, reason })
      toast.success('Forward request rejected back to worker.')
      setSelectedRequestId(null)
    } catch (e) {
      console.error(e)
      toast.error('Failed to reject forward request.')
    }
  }

  const handleAccept = async (requestId: number) => {
    try {
      await acceptMutation.mutateAsync(requestId)
      toast.success('Incoming transfer accepted successfully! Report added to department queue.')
      setSelectedRequestId(null)
    } catch (e) {
      console.error(e)
      toast.error('Failed to accept incoming transfer.')
    }
  }

  const handleDecline = async (requestId: number, reason: string) => {
    try {
      await declineMutation.mutateAsync({ requestId, reason })
      toast.success('Incoming transfer declined and returned to sender.')
      setSelectedRequestId(null)
    } catch (e) {
      console.error(e)
      toast.error('Failed to decline incoming transfer.')
    }
  }

  const handleRefresh = () => {
    if (activeTab === 'outgoing') {
      refetchPending()
    } else if (activeTab === 'incoming') {
      refetchIncoming()
    } else {
      refetchRejected()
    }
  }

  const currentLoading =
    activeTab === 'outgoing'
      ? isPendingLoading
      : activeTab === 'incoming'
        ? isIncomingLoading
        : isRejectedLoading
  const currentError =
    activeTab === 'outgoing'
      ? pendingError
      : activeTab === 'incoming'
        ? incomingError
        : rejectedError
  const currentRefetching =
    activeTab === 'outgoing'
      ? isPendingRefetching
      : activeTab === 'incoming'
        ? isIncomingRefetching
        : isRejectedRefetching

  // Client-side text search filtering
  const currentList =
    activeTab === 'outgoing'
      ? pendingForwards
      : activeTab === 'incoming'
        ? incomingForwards
        : rejectedForwards

  const filteredList = currentList.filter(
    (item) =>
      item.report_id.toString().includes(searchTerm) ||
      item.id.toString().includes(searchTerm) ||
      item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.decision_reason &&
        item.decision_reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.source_department_name &&
        item.source_department_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.destination_department_name &&
        item.destination_department_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.worker_name && item.worker_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'border-amber-250 bg-amber-50 text-amber-700 dark:border-amber-950 dark:bg-amber-950/20'
      case 'Approved By Source':
      case 'Waiting Destination':
        return 'border-blue-250 bg-blue-50 text-blue-700 dark:border-blue-950 dark:bg-blue-950/20'
      case 'Accepted':
        return 'border-emerald-250 bg-emerald-50 text-emerald-700 dark:border-emerald-950 dark:bg-emerald-950/20'
      case 'Rejected':
      case 'Cancelled':
        return 'border-rose-250 bg-rose-50 text-rose-700 dark:border-rose-950 dark:bg-rose-950/20'
      default:
        return 'border-neutral-200 bg-neutral-50 text-neutral-600'
    }
  }

  return (
    <div className="space-y-6 pb-10 text-left select-none">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
        <div className="flex shrink-0 flex-col gap-1.5">
          <h1 className="text-2xl font-black tracking-tight text-neutral-800 dark:text-white">
            Transfer Requests
          </h1>
          <p className="text-[13px] leading-relaxed font-semibold text-neutral-500 dark:text-neutral-400">
            Review worker forward requests to re-assign incorrect categories or administrative
            transfers.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={handleRefresh}
          disabled={currentLoading || currentRefetching}
          className="dark:border-neutral-850 flex h-8 items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${currentRefetching ? 'animate-spin' : ''}`} />
          Refresh Requests
        </Button>
      </div>

      {/* Tabs Switcher */}
      <div className="dark:border-neutral-850 flex flex-wrap border-b border-neutral-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab('outgoing')
            setSearchTerm('')
          }}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-black tracking-wider uppercase transition-colors duration-150 outline-none sm:gap-2 sm:px-6 ${
            activeTab === 'outgoing'
              ? 'border-[#0A3C7D] text-[#0A3C7D] dark:border-blue-500 dark:text-blue-400'
              : 'hover:text-neutral-750 dark:text-neutral-450 border-transparent text-neutral-500 dark:hover:text-neutral-300'
          }`}
        >
          <Send className="h-4 w-4" />
          Outgoing Forwards
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('incoming')
            setSearchTerm('')
          }}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-black tracking-wider uppercase transition-colors duration-150 outline-none sm:gap-2 sm:px-6 ${
            activeTab === 'incoming'
              ? 'border-[#0A3C7D] text-[#0A3C7D] dark:border-blue-500 dark:text-blue-400'
              : 'hover:text-neutral-750 dark:text-neutral-450 border-transparent text-neutral-500 dark:hover:text-neutral-300'
          }`}
        >
          <Inbox className="h-4 w-4" />
          Incoming Transfers
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('rejected')
            setSearchTerm('')
          }}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-black tracking-wider uppercase transition-colors duration-150 outline-none sm:gap-2 sm:px-6 ${
            activeTab === 'rejected'
              ? 'border-rose-600 text-rose-600 dark:border-rose-500 dark:text-rose-400'
              : 'hover:text-neutral-750 dark:text-neutral-450 border-transparent text-neutral-500 dark:hover:text-neutral-300'
          }`}
        >
          <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          Rejected
        </button>
      </div>

      {/* Control Banner search */}
      <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <div className="relative flex-1">
          <Search className="text-neutral-450 absolute top-2.5 left-3 h-4 w-4 dark:text-neutral-500" />
          <input
            type="text"
            placeholder={
              activeTab === 'outgoing'
                ? 'Search outgoing forwards by report ID, reason, status...'
                : activeTab === 'incoming'
                  ? 'Search incoming transfers by report ID, reason, status...'
                  : 'Search rejected requests by report ID, rejection reason, department...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 pr-4 pl-9.5 text-xs font-semibold transition-all outline-none placeholder:text-neutral-400 focus:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200"
          />
        </div>
      </div>

      {/* Main Request Grid / Table */}
      {currentLoading ? (
        <div className="flex h-52 flex-col items-center justify-center gap-2">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#0A3C7D] border-t-transparent dark:border-blue-500" />
          <span className="text-xs font-bold text-neutral-500">Retrieving requests...</span>
        </div>
      ) : currentError ? (
        <div className="border-rose-250 flex h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-rose-50/10 p-5 dark:border-rose-950/20">
          <ShieldAlert className="h-8 w-8 text-rose-500" />
          <span className="text-xs font-bold text-rose-600">Failed to load forward requests.</span>
          <Button variant="outline" size="xs" onClick={handleRefresh} className="h-7">
            Retry Connection
          </Button>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/20 p-5 dark:border-neutral-800">
          <ArrowLeftRight className="h-8 w-8 text-neutral-400" />
          <span className="text-xs font-bold text-neutral-500">No requests found.</span>
          <p className="text-[11px] font-medium text-neutral-400">
            {activeTab === 'outgoing'
              ? 'No outgoing forwards found.'
              : activeTab === 'incoming'
                ? 'No incoming transfers found.'
                : 'No rejected transfer requests recorded for your department.'}
          </p>
        </div>
      ) : activeTab === 'rejected' ? (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-xs font-bold text-neutral-700 dark:text-neutral-300">
              <thead>
                <tr className="text-neutral-450 dark:border-neutral-850 border-b border-neutral-100 bg-neutral-50/70 text-[10px] font-black tracking-wider uppercase dark:bg-neutral-900/40 dark:text-neutral-500">
                  <th className="px-4 py-3">Req ID</th>
                  <th className="px-4 py-3">Report Ref</th>
                  <th className="px-4 py-3">Source Sector</th>
                  <th className="px-4 py-3">Destination Sector</th>
                  <th className="px-4 py-3">Rejection Reason</th>
                  <th className="px-4 py-3">Rejection Date</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="dark:divide-neutral-850 divide-y divide-neutral-100">
                {filteredList.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-neutral-50/30 dark:hover:bg-neutral-900/10"
                  >
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">#{item.id}</td>
                    <td className="px-4 py-3 font-extrabold text-[#0A3C7D] select-all dark:text-blue-400">
                      Report #{item.report_id}
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">
                      {item.source_department_name || 'Source Dept'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-600 dark:text-neutral-400">
                      {item.destination_department_name || 'N/A'}
                    </td>
                    <td className="max-w-xs px-4 py-3 font-semibold text-rose-700 dark:text-rose-400">
                      {item.decision_reason || item.reason}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-neutral-500 dark:text-neutral-400">
                      {item.reviewed_at ? new Date(item.reviewed_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${getStatusBadgeClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => setSelectedRequestId(item.id)}
                        className="h-7 cursor-pointer dark:border-neutral-800"
                      >
                        Review Request
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (< md) */}
          <div className="divide-y divide-neutral-100 md:hidden dark:divide-neutral-800">
            {filteredList.map((item) => (
              <div key={item.id} className="space-y-2.5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-[#0A3C7D] dark:text-blue-400">
                    Report #{item.report_id}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${getStatusBadgeClass(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                  <div>
                    <span className="font-semibold text-neutral-500">Request ID:</span> #{item.id}
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-500">Source:</span>{' '}
                    {item.source_department_name || 'Source Dept'}
                  </div>
                  <div className="font-medium text-rose-600 dark:text-rose-400">
                    <span className="font-semibold text-neutral-500 dark:text-neutral-400">
                      Rejection Reason:
                    </span>{' '}
                    {item.decision_reason || item.reason}
                  </div>
                </div>
                <div className="pt-1 text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setSelectedRequestId(item.id)}
                    className="h-7 cursor-pointer text-xs"
                  >
                    Review Request
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-xs font-bold text-neutral-700 dark:text-neutral-300">
              <thead>
                <tr className="text-neutral-450 dark:border-neutral-850 border-b border-neutral-100 bg-neutral-50/70 text-[10px] font-black tracking-wider uppercase dark:bg-neutral-900/40 dark:text-neutral-500">
                  <th className="px-4 py-3">Request ID</th>
                  <th className="px-4 py-3">Report ID</th>
                  <th className="px-4 py-3">Transfer Reason Summary</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="dark:divide-neutral-850 divide-y divide-neutral-100">
                {filteredList.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-neutral-50/30 dark:hover:bg-neutral-900/10"
                  >
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">#{item.id}</td>
                    <td className="px-4 py-3 font-extrabold text-[#0A3C7D] select-all dark:text-blue-400">
                      Report #{item.report_id}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 font-semibold" title={item.reason}>
                      {item.reason}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${getStatusBadgeClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => setSelectedRequestId(item.id)}
                        className="h-7 cursor-pointer dark:border-neutral-800"
                      >
                        Review Request
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (< md) */}
          <div className="divide-y divide-neutral-100 md:hidden dark:divide-neutral-800">
            {filteredList.map((item) => (
              <div key={item.id} className="space-y-2.5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-[#0A3C7D] dark:text-blue-400">
                    Report #{item.report_id}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${getStatusBadgeClass(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  {item.reason}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-semibold text-neutral-400">
                    Request ID: #{item.id}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setSelectedRequestId(item.id)}
                    className="h-7 cursor-pointer text-xs"
                  >
                    Review Request
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details drawer */}
      <ForwardRequestsDetailsDrawer
        isOpen={selectedRequestId !== null}
        onClose={() => setSelectedRequestId(null)}
        requestId={selectedRequestId}
        detail={detailData}
        isLoading={isDetailLoading}
        isIncoming={activeTab === 'incoming'}
        onApprove={handleApproveTrigger}
        onReject={handleRejectTrigger}
        onAccept={handleAcceptTrigger}
        onDecline={handleDeclineTrigger}
        isSubmitting={
          approveMutation.isPending ||
          rejectMutation.isPending ||
          acceptMutation.isPending ||
          declineMutation.isPending
        }
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={
          confirmDialog.action === 'reject' || confirmDialog.action === 'decline'
            ? 'Confirm Reject'
            : 'Confirm'
        }
        cancelLabel="Cancel"
        isDanger={confirmDialog.action === 'reject' || confirmDialog.action === 'decline'}
        isSubmitting={
          approveMutation.isPending ||
          rejectMutation.isPending ||
          acceptMutation.isPending ||
          declineMutation.isPending
        }
        onConfirm={async () => {
          const { action, data } = confirmDialog
          if (!action || !data) return
          if (action === 'approve' && data.payload) {
            await handleApprove(data.requestId, data.payload)
          } else if (action === 'reject' && data.reason) {
            await handleReject(data.requestId, data.reason)
          } else if (action === 'accept') {
            await handleAccept(data.requestId)
          } else if (action === 'decline' && data.reason) {
            await handleDecline(data.requestId, data.reason)
          }
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
