import React, { useState } from 'react'
import { X, UserCheck, User, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkersQuery } from '@/features/workers/hooks/use-workers'

interface AssignWorkerModalProps {
  isOpen: boolean
  onClose: () => void
  reportId: number | null
  reportNumber: string | null
  onAssign: (reportId: number, workerId?: number, remarks?: string) => Promise<void>
  isSubmitting: boolean
}

export function AssignWorkerModal({
  isOpen,
  onClose,
  reportId,
  reportNumber,
  onAssign,
  isSubmitting,
}: AssignWorkerModalProps) {
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | 'auto'>('auto')
  const [remarks, setRemarks] = useState('')

  const { data: workers = [], isLoading, error } = useWorkersQuery()

  if (!isOpen || !reportId) return null

  // Active department workers (non-blocked)
  const activeWorkers = workers.filter((w) => !w.is_blocked)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const workerId = selectedWorkerId === 'auto' ? undefined : Number(selectedWorkerId)
    await onAssign(reportId, workerId, remarks || undefined)
    setRemarks('')
    setSelectedWorkerId('auto')
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs transition-opacity dark:bg-black/80"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl transition-all dark:border-neutral-800 dark:bg-[#1C1C1E]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0A3C7D] dark:bg-blue-950/40 dark:text-blue-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-neutral-800 dark:text-white">
                Assign Field Worker
              </h3>
              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Report #{reportNumber || reportId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left">
          {/* Worker Selection List */}
          <div className="space-y-2">
            <label className="text-[11px] font-black tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
              Select Department Worker
            </label>

            {isLoading ? (
              <div className="flex h-32 items-center justify-center gap-2 rounded-xl border border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40">
                <Loader2 className="h-5 w-5 animate-spin text-[#0A3C7D] dark:text-blue-400" />
                <span className="text-xs font-semibold text-neutral-500">
                  Loading department workers...
                </span>
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-950/30 dark:bg-rose-950/20 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>Failed to load department workers. You can still use Auto-Assign.</span>
              </div>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {/* Auto Assign option */}
                <label
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                    selectedWorkerId === 'auto'
                      ? 'border-[#0A3C7D] bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/20'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-[#151516] dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="worker"
                      value="auto"
                      checked={selectedWorkerId === 'auto'}
                      onChange={() => setSelectedWorkerId('auto')}
                      className="accent-[#0A3C7D]"
                    />
                    <div>
                      <p className="text-xs font-black text-neutral-800 dark:text-white">
                        Auto-Assign (System Choice)
                      </p>
                      <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                        Automatically route to best available worker in department
                      </p>
                    </div>
                  </div>
                  <CheckCircle2
                    className={`h-4 w-4 ${
                      selectedWorkerId === 'auto'
                        ? 'text-[#0A3C7D] dark:text-blue-400'
                        : 'text-neutral-300 dark:text-neutral-700'
                    }`}
                  />
                </label>

                {/* Explicit Department Workers */}
                {activeWorkers.map((worker) => (
                  <label
                    key={worker.user_id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                      selectedWorkerId === worker.user_id
                        ? 'border-[#0A3C7D] bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/20'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-[#151516] dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="worker"
                        value={worker.user_id}
                        checked={selectedWorkerId === worker.user_id}
                        onChange={() => setSelectedWorkerId(worker.user_id)}
                        className="accent-[#0A3C7D]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-neutral-500" />
                          <p className="text-xs font-black text-neutral-800 dark:text-white">
                            {worker.name}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              worker.is_available
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                            }`}
                          >
                            {worker.is_available ? 'Available' : 'Busy'}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                          {worker.designation || 'Field Worker'} ({worker.employee_code})
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Remarks input */}
          <div className="space-y-1">
            <label
              htmlFor="assignment-remarks"
              className="text-[11px] font-black tracking-wider text-neutral-500 uppercase dark:text-neutral-400"
            >
              Assignment Notes / Instructions (Optional)
            </label>
            <textarea
              id="assignment-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter special instructions for the assigned worker..."
              rows={2}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-semibold outline-none focus:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 dark:border-neutral-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 bg-[#0A3C7D] text-xs font-black tracking-wider text-white uppercase hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning...
                </div>
              ) : (
                'Confirm Assignment'
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
