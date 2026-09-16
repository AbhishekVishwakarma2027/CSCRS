import React, { useState, useEffect } from 'react'
import { ArrowLeftRight, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDepartmentsQuery } from '@/features/departments/hooks/use-departments'
import type { ReportListItem } from '../types'
import type { ForwardReasonType } from '@/features/forward-requests/types'

interface TransferRequestModalProps {
  isOpen: boolean
  onClose: () => void
  report: ReportListItem | null
  onSubmit: (data: {
    department_id: number
    reason_type: ForwardReasonType
    remarks: string
  }) => Promise<void>
  isSubmitting: boolean
}

const FORWARD_REASONS: { value: ForwardReasonType; label: string }[] = [
  { value: 'WRONG_AI_CLASSIFICATION', label: 'Wrong AI Classification' },
  { value: 'WRONG_CITIZEN_CATEGORY', label: 'Wrong Citizen Category' },
  { value: 'ADMINISTRATIVE_TRANSFER', label: 'Administrative Transfer' },
  { value: 'DUPLICATE_DEPARTMENT', label: 'Duplicate Department Assignment' },
  { value: 'OTHER', label: 'Other (specify in remarks)' },
]

export function TransferRequestModal({
  isOpen,
  onClose,
  report,
  onSubmit,
  isSubmitting,
}: TransferRequestModalProps) {
  const [destDeptId, setDestDeptId] = useState<number | ''>('')
  const [reasonType, setReasonType] = useState<ForwardReasonType>('WRONG_AI_CLASSIFICATION')
  const [remarks, setRemarks] = useState('')

  // Query departments from existing department service
  const { data: departments = [], isLoading: isDeptsLoading } = useDepartmentsQuery()

  // Reset form when report changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setDestDeptId('')
      setReasonType('WRONG_AI_CLASSIFICATION')
      setRemarks('')
    }
  }, [isOpen, report])

  if (!isOpen || !report) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (destDeptId === '' || remarks.trim().length < 5) return

    await onSubmit({
      department_id: Number(destDeptId),
      reason_type: reasonType,
      remarks: remarks.trim(),
    })
  }

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 duration-200 dark:bg-black/80">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-[#1C1C1E]">
        {/* Modal Header */}
        <div className="dark:border-neutral-850 flex items-center justify-between border-b border-neutral-100 pb-2">
          <h3 className="flex items-center gap-1.5 text-sm font-black tracking-wider text-[#0A3C7D] uppercase dark:text-blue-400">
            <ArrowLeftRight className="h-4.5 w-4.5" />
            Transfer / Forward Report #{report.report_number}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-450 cursor-pointer rounded-md outline-none hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Destination Department */}
          <div className="space-y-1">
            <label
              htmlFor="transfer-dept-select"
              className="text-[12px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500"
            >
              Destination Department
            </label>
            <select
              id="transfer-dept-select"
              value={destDeptId}
              onChange={(e) => setDestDeptId(e.target.value ? Number(e.target.value) : '')}
              required
              disabled={isDeptsLoading}
              className="h-9 w-full cursor-pointer rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-bold outline-none focus:border-[#0A3C7D] dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
            >
              <option
                value=""
                className="bg-white text-neutral-900 dark:bg-[#1C1C1E] dark:text-neutral-200"
              >
                {isDeptsLoading ? 'Loading departments...' : 'Select Target Department...'}
              </option>
              {departments
                .filter((d) => d.id !== report.department_id && (d.is_active ?? true))
                .map((d) => (
                  <option
                    key={d.id}
                    value={d.id}
                    className="bg-white text-neutral-900 dark:bg-[#1C1C1E] dark:text-neutral-200"
                  >
                    {d.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Reason Category */}
          <div className="space-y-1">
            <label
              htmlFor="transfer-reason-select"
              className="text-[12px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500"
            >
              Transfer Reason Category
            </label>
            <select
              id="transfer-reason-select"
              value={reasonType}
              onChange={(e) => setReasonType(e.target.value as ForwardReasonType)}
              required
              className="h-9 w-full cursor-pointer rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-bold outline-none focus:border-[#0A3C7D] dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
            >
              {FORWARD_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label
              htmlFor="transfer-remarks-textarea"
              className="text-[12px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500"
            >
              Transfer Remarks (Min 5 characters)
            </label>
            <textarea
              id="transfer-remarks-textarea"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required
              placeholder="Enter detailed notes explaining why this civic issue should be transferred to the target department..."
              rows={3}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
            />
          </div>

          {/* Alert Notice */}
          <div className="flex items-start gap-2 rounded-lg bg-amber-50/60 p-2.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/20 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>
              This will route a forward request to the destination department. The report's
              department will update after destination acceptance.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="dark:border-neutral-850 flex items-center justify-end gap-2 border-t border-neutral-100 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-8 cursor-pointer dark:border-neutral-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || destDeptId === '' || remarks.trim().length < 5}
              className="h-8 bg-[#0A3C7D] text-xs font-black tracking-wider text-white uppercase hover:bg-[#0A3C7D]/95 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {isSubmitting ? 'Submitting Transfer...' : 'Initiate Transfer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
