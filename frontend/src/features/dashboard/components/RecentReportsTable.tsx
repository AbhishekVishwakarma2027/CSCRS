import { useDashboardRecentReports } from '../hooks/use-dashboard'
import { Card } from '@/components/ui/card'
import { formatDate } from '@/utils/format'
import { AlertCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'

// WCAG AA Compliant High Contrast Badges (using dark tones for light themes)
const PRIORITY_BADGES: Record<string, string> = {
  LOW: 'bg-[#6B7280]/10 text-[#475569] border-[#6B7280]/20 dark:bg-neutral-800/50 dark:text-neutral-400 dark:border-neutral-700/40',
  MEDIUM:
    'bg-[#3B82F6]/10 text-[#1D4ED8] border-[#3B82F6]/20 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
  HIGH: 'bg-[#F59E0B]/10 text-[#B45309] border-[#F59E0B]/20 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30',
  CRITICAL:
    'bg-[#DC2626]/10 text-[#991B1B] border-[#DC2626]/20 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
}

const STATUS_BADGES: Record<string, string> = {
  PENDING:
    'bg-[#EF4444]/10 text-[#B91C1C] border-[#EF4444]/20 dark:bg-red-950/20 dark:text-red-450 dark:border-red-900/30',
  ASSIGNED:
    'bg-[#F59E0B]/10 text-[#B45309] border-[#F59E0B]/20 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30',
  IN_PROGRESS:
    'bg-[#3B82F6]/10 text-[#1D4ED8] border-[#3B82F6]/20 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
  RESOLVED:
    'bg-[#22C55E]/10 text-[#15803D] border-[#22C55E]/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
  CLOSED:
    'bg-[#6B7280]/10 text-[#475569] border-[#6B7280]/20 dark:bg-neutral-800/30 dark:text-neutral-400 dark:border-neutral-700/40',
  REJECTED:
    'bg-[#6B7280]/10 text-[#475569] border-[#6B7280]/20 dark:bg-neutral-800/30 dark:text-neutral-400 dark:border-neutral-700/40',
  CANCELLED:
    'bg-[#DC2626]/10 text-[#991B1B] border-[#DC2626]/20 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
  REOPENED:
    'bg-[#6366F1]/10 text-[#4338CA] border-[#6366F1]/20 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30',
}

export function RecentReportsTable() {
  const { data, isLoading, error, refetch } = useDashboardRecentReports()
  const reports = data || []

  // 1. Loading State (pulse skeletons, equal height match)
  if (isLoading) {
    return (
      <Card className="flex h-[340px] flex-col justify-between border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2 dark:border-neutral-800">
          <div className="bg-neutral-250 h-4 w-32 animate-pulse rounded" />
        </div>
        <div className="mt-4 flex-1 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex animate-pulse items-center justify-between py-1">
              <div className="h-3 w-16 rounded bg-neutral-200" />
              <div className="bg-neutral-150 h-3 w-28 rounded" />
              <div className="h-3 w-20 rounded bg-neutral-200" />
              <div className="h-4.5 w-12 rounded-full bg-neutral-100" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  // 2. Error State (matching layout heights)
  if (error) {
    return (
      <Card className="flex min-h-[340px] flex-col items-center justify-center gap-2 border border-neutral-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <AlertCircle className="h-6 w-6 shrink-0 text-rose-500" />
        <h4 className="dark:text-neutral-350 text-xs font-bold text-neutral-700">
          Failed to load recent reports
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

  // 3. Empty State
  if (reports.length === 0) {
    return (
      <Card className="flex min-h-[340px] flex-col items-center justify-center gap-2 border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <div className="text-neutral-455 dark:bg-neutral-850 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-50">
          <FileText className="h-5 w-5" />
        </div>
        <h4 className="dark:text-neutral-450 text-xs font-black tracking-widest text-neutral-600 uppercase">
          No reports resolved
        </h4>
        <p className="text-neutral-450 dark:text-neutral-550 max-w-[220px] text-[11px] leading-relaxed font-semibold">
          There are currently no active civic reports in the database ledger.
        </p>
      </Card>
    )
  }

  const formatBadgeText = (text: string) => {
    return text.replace(/_/g, ' ')
  }

  const handleReferenceClick = (reportNumber: string) => {
    toast.info(
      `Navigation to report details (${reportNumber}) will be integrated in a later phase.`
    )
  }

  // 4. Ready State
  return (
    <Card
      role="region"
      aria-label="Recent Civic Reports Table"
      className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 pb-2 dark:border-neutral-800">
        <h4 className="flex items-center gap-2 text-[10px] font-black tracking-widest text-neutral-500 uppercase select-none dark:text-neutral-400">
          <FileText className="h-4 w-4 text-[#0A3C7D]" />
          Recent Civic Reports
        </h4>
      </div>

      {/* Scrollable Container with Sticky Headers */}
      <div className="max-h-[265px] w-full scrollbar-thin overflow-x-auto overflow-y-auto focus:outline-none">
        <table className="w-full min-w-[500px] border-collapse text-left">
          <thead>
            <tr className="text-neutral-450 dark:border-neutral-850 border-b border-neutral-100 text-[10px] font-black uppercase select-none dark:text-neutral-400">
              <th className="sticky top-0 z-10 bg-white px-3 py-2 dark:bg-[#1C1C1E]">Reference</th>
              <th className="sticky top-0 z-10 bg-white px-3 py-2 dark:bg-[#1C1C1E]">
                Issue Category
              </th>
              <th className="sticky top-0 z-10 bg-white px-3 py-2 dark:bg-[#1C1C1E]">Department</th>
              <th className="sticky top-0 z-10 bg-white px-3 py-2 dark:bg-[#1C1C1E]">Priority</th>
              <th className="sticky top-0 z-10 bg-white px-3 py-2 dark:bg-[#1C1C1E]">
                Created Date
              </th>
              <th className="sticky top-0 z-10 bg-white px-3 py-2 text-right dark:bg-[#1C1C1E]">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="dark:divide-neutral-850 dark:text-neutral-350 divide-y divide-neutral-100 text-xs font-bold text-neutral-700">
            {reports.map((report) => (
              <tr
                key={report.report_number}
                className="transition-colors hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40"
              >
                <td className="px-3 py-2.5">
                  <button
                    onClick={() => handleReferenceClick(report.report_number)}
                    className="-mx-1 cursor-pointer rounded px-1 text-left font-extrabold text-[#0A3C7D] transition-colors outline-none hover:text-[#0D9488] hover:underline focus:ring-2 focus:ring-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                    aria-label={`View details of report ${report.report_number}`}
                  >
                    {report.report_number}
                  </button>
                </td>

                {/* Truncated Category with tooltip */}
                <td className="px-3 py-2.5">
                  <span
                    className="inline-block max-w-[120px] truncate capitalize lg:max-w-[160px]"
                    title={report.issue_type}
                  >
                    {report.issue_type?.toLowerCase()}
                  </span>
                </td>

                {/* Truncated Department with tooltip */}
                <td className="px-3 py-2.5">
                  <span
                    className="inline-block max-w-[120px] truncate font-semibold text-neutral-500 lg:max-w-[165px] dark:text-neutral-400"
                    title={report.department_name || 'Unassigned'}
                  >
                    {report.department_name || 'Unassigned'}
                  </span>
                </td>

                <td className="px-3 py-2.5 select-none">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                      PRIORITY_BADGES[report.priority.toUpperCase()] ||
                      'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {report.priority}
                  </span>
                </td>

                <td className="px-3 py-2.5 font-semibold text-neutral-500 dark:text-neutral-400">
                  {formatDate(report.created_at)}
                </td>

                <td className="px-3 py-2.5 text-right select-none">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                      STATUS_BADGES[report.status.toUpperCase()] ||
                      'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {formatBadgeText(report.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
export default RecentReportsTable
