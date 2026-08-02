import { useState, useEffect } from 'react'
import { useDashboardHighPriority } from '../hooks/use-dashboard'
import { Card } from '@/components/ui/card'
import { formatRelativeTime } from '@/utils/format'
import { AlertCircle, User, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export function HighPriorityQueue() {
  const { data, isLoading, error, refetch, dataUpdatedAt } = useDashboardHighPriority()
  const reports = data || []
  const [lastUpdatedText, setLastUpdatedText] = useState('')

  // Dynamic relative time calculator for dataUpdatedAt
  useEffect(() => {
    if (!dataUpdatedAt) return
    const updateText = () => {
      const diffMs = Date.now() - dataUpdatedAt
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 1) {
        setLastUpdatedText('Last refreshed: just now')
      } else {
        setLastUpdatedText(`Last refreshed: ${diffMins}m ago`)
      }
    }
    updateText()
    const interval = setInterval(updateText, 30000)
    return () => clearInterval(interval)
  }, [dataUpdatedAt])

  const handleItemClick = (reportNumber: string) => {
    toast.info(`Manual review of report ${reportNumber} will be integrated in a later phase.`)
  }

  // 1. Loading State (renders vertical skeleton list items matching card height)
  if (isLoading) {
    return (
      <Card className="flex h-[330px] flex-col justify-between border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2 dark:border-neutral-800">
          <div className="bg-neutral-250 h-4 w-36 animate-pulse rounded" />
        </div>
        <div className="mt-4 flex-1 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse items-start justify-between border-b border-neutral-50 py-2 last:border-0"
            >
              <div className="flex-grow space-y-2">
                <div className="h-3.5 w-1/3 rounded bg-neutral-200" />
                <div className="bg-neutral-150 h-3 w-1/2 rounded" />
              </div>
              <div className="h-5 w-14 rounded bg-neutral-100" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  // 2. Error State (matching card height)
  if (error) {
    return (
      <Card className="flex h-[330px] flex-col items-center justify-center gap-2 border border-neutral-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <AlertCircle className="h-6 w-6 shrink-0 text-rose-500" />
        <h4 className="dark:text-neutral-350 text-xs font-bold text-neutral-700">
          Failed to load critical queue
        </h4>
        <button
          onClick={() => refetch()}
          className="mt-2 cursor-pointer rounded px-1 text-xs font-black text-[#0A3C7D] outline-none hover:underline focus:ring-2 focus:ring-blue-500 dark:text-blue-400"
        >
          Retry Load
        </button>
      </Card>
    )
  }

  // 3. Empty State (highly professional and height-matched)
  if (reports.length === 0) {
    return (
      <Card className="flex h-[330px] flex-col items-center justify-center border border-neutral-200 bg-white p-6 text-center shadow-sm select-none dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <div className="shadow-xxs mb-3.5 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400">
          <ShieldCheck className="h-6 w-6 animate-pulse" />
        </div>
        <h4 className="text-xs leading-none font-black tracking-widest text-neutral-700 uppercase dark:text-neutral-300">
          Queue Is Clear
        </h4>
        <p className="text-neutral-450 dark:text-neutral-450 mt-2.5 max-w-[200px] text-[11px] leading-normal font-bold">
          No unresolved critical or high priority incidents pending immediate manual verification.
        </p>
        {lastUpdatedText && (
          <span className="mt-4 text-[9px] font-semibold text-neutral-400 dark:text-neutral-500">
            {lastUpdatedText}
          </span>
        )}
      </Card>
    )
  }

  // 4. Ready State
  return (
    <Card
      role="region"
      aria-label="Critical Incident Queue"
      className="group animate-fade-in flex h-[330px] flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 pb-2 select-none dark:border-neutral-800">
        <h4 className="flex items-center gap-2 text-[10px] font-black tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#DC2626]" />
          Critical Queue
        </h4>
        {lastUpdatedText && (
          <span className="text-neutral-450 text-[9px] font-semibold dark:text-neutral-500">
            {lastUpdatedText}
          </span>
        )}
      </div>

      {/* List Container */}
      <div className="flex-grow scrollbar-thin space-y-3 overflow-y-auto pt-2">
        {reports.map((report) => (
          <button
            key={report.report_number}
            onClick={() => handleItemClick(report.report_number)}
            className="flex w-full cursor-pointer items-start justify-between gap-4 rounded-lg border border-transparent p-2 text-left transition-all duration-200 outline-none hover:border-neutral-100 hover:bg-neutral-50 focus:ring-2 focus:ring-blue-500 dark:hover:border-neutral-800 dark:hover:bg-neutral-800/30"
            aria-label={`Critical report ${report.report_number}, category ${report.issue_type}`}
          >
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="block text-xs font-black text-[#0A3C7D] dark:text-blue-400">
                  {report.report_number}
                </span>
                <span className="text-neutral-450 py-0.2 dark:border-neutral-750 shrink-0 rounded border border-neutral-200 bg-neutral-100 px-1.5 text-[9px] font-black uppercase dark:bg-neutral-800 dark:text-neutral-400">
                  {report.issue_type?.toLowerCase()}
                </span>
              </div>

              <div className="text-neutral-450 flex flex-wrap items-center gap-x-2 text-[10px] font-bold dark:text-neutral-500">
                <span>{report.department_name}</span>
                <span>•</span>
                <span>{formatRelativeTime(report.created_at)}</span>
              </div>

              {/* Assigned Worker */}
              <div className="flex items-center space-x-1.5 pt-0.5 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                <User className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <span className="truncate">
                  {report.assigned_worker
                    ? `Assigned: ${report.assigned_worker}`
                    : 'Worker Unassigned'}
                </span>
              </div>
            </div>

            {/* Risk Score */}
            <div className="shrink-0 text-right">
              <span className="inline-flex items-center rounded border border-[#DC2626]/20 bg-[#DC2626]/10 px-2 py-1 text-[10px] font-black tracking-wider text-[#DC2626] uppercase dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
                Risk: {report.risk_score ? report.risk_score.toFixed(1) : 'N/A'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </Card>
  )
}
export default HighPriorityQueue
