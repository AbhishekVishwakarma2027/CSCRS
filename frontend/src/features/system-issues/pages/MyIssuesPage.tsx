import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ListCheck,
  Search,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Paperclip,
  Eye,
  MessageSquareQuote,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/utils/format'
import { SystemIssueCategory, SystemIssueStatus, type MySystemIssueItem } from '../types'
import { useMySystemIssuesQuery } from '../hooks/use-system-issues'
import { SystemIssueDetailsDrawer } from '../components/SystemIssueDetailsDrawer'
import { PATHS } from '@/routes/paths'

export default function MyIssuesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Drawer state for viewing full issue detail
  const [selectedIssue, setSelectedIssue] = useState<MySystemIssueItem | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Query custom hook fetching user's own submitted system issues
  const {
    data: issues = [],
    isLoading,
    isRefetching,
    refetch,
  } = useMySystemIssuesQuery({
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    search: searchQuery || undefined,
  })

  // Quick stat counters
  const totalCount = issues.length
  const openCount = issues.filter(
    (i) => i.status === SystemIssueStatus.OPEN || i.status === SystemIssueStatus.IN_REVIEW
  ).length
  const resolvedCount = issues.filter((i) => i.status === SystemIssueStatus.RESOLVED).length
  const rejectedCount = issues.filter((i) => i.status === SystemIssueStatus.REJECTED).length

  const handleOpenDetail = (issue: MySystemIssueItem) => {
    setSelectedIssue(issue)
    setIsDrawerOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-black text-emerald-700 uppercase dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Resolved
          </span>
        )
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-100 px-2.5 py-0.5 text-[11px] font-black text-blue-700 uppercase dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-400">
            <Clock className="h-3 w-3" />
            In Review
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-100 px-2.5 py-0.5 text-[11px] font-black text-rose-700 uppercase dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        )
      default: // OPEN
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-[11px] font-black text-amber-700 uppercase dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400">
            <AlertCircle className="h-3 w-3" />
            Open
          </span>
        )
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12 text-left select-none">
      {/* Header Banner & Navigation Tabs */}
      <div className="flex flex-col gap-4 border-b border-neutral-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0A3C7D]/10 text-[#0A3C7D] dark:bg-blue-900/30 dark:text-blue-400">
              <ListCheck className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-black tracking-widest text-[#0A3C7D] uppercase dark:text-blue-400">
              My System Issues
            </h1>
          </div>
          <p className="mt-1 text-[13px] font-semibold text-neutral-500 dark:text-neutral-400">
            Track status, admin feedback, and resolution updates for issues reported by you.
          </p>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex items-center gap-2">
          <Link to={PATHS.SUBMIT_ISSUE}>
            <Button className="h-9 bg-[#0A3C7D] px-4 text-xs font-bold text-white hover:bg-[#0A3C7D]/90 dark:bg-blue-600 dark:hover:bg-blue-500">
              <PlusCircle className="mr-1.5 h-4 w-4" />
              Report New Issue
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="dark:hover:bg-neutral-850 h-9 border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats Summary Grid */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200/70 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-[#1E1E20]">
          <span className="text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
            Total Submitted
          </span>
          <div className="mt-1 text-2xl font-black text-neutral-900 dark:text-white">
            {totalCount}
          </div>
        </div>

        <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-4 shadow-xs dark:border-amber-900/30 dark:bg-amber-950/10">
          <span className="text-[11px] font-black tracking-wider text-amber-700 uppercase dark:text-amber-400">
            Active / In Review
          </span>
          <div className="mt-1 text-2xl font-black text-amber-800 dark:text-amber-300">
            {openCount}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-4 shadow-xs dark:border-emerald-900/30 dark:bg-emerald-950/10">
          <span className="text-[11px] font-black tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
            Resolved
          </span>
          <div className="mt-1 text-2xl font-black text-emerald-800 dark:text-emerald-300">
            {resolvedCount}
          </div>
        </div>

        <div className="rounded-xl border border-rose-200/70 bg-rose-50/40 p-4 shadow-xs dark:border-rose-900/30 dark:bg-rose-950/10">
          <span className="text-[11px] font-black tracking-wider text-rose-700 uppercase dark:text-rose-400">
            Rejected
          </span>
          <div className="mt-1 text-2xl font-black text-rose-800 dark:text-rose-300">
            {rejectedCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-neutral-200/70 bg-neutral-50/60 p-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:bg-[#1E1E20]">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or issue number (e.g. ISS-000001)..."
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-9 text-xs font-bold text-neutral-800 outline-none focus:ring-2 focus:ring-[#0A3C7D]/20 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 outline-none dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-300"
          >
            <option value="">All Statuses</option>
            {Object.values(SystemIssueStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 outline-none dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-300"
          >
            <option value="">All Categories</option>
            {Object.values(SystemIssueCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Issues List Container */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="dark:bg-neutral-850 h-28 animate-pulse rounded-xl border border-neutral-200/60 bg-neutral-100 dark:border-neutral-800"
            />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white py-14 text-center dark:border-neutral-800 dark:bg-[#1C1C1E]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-base font-black text-neutral-800 dark:text-neutral-200">
            No system issues found
          </h3>
          <p className="mt-1 max-w-sm text-xs font-semibold text-neutral-400">
            {searchQuery || statusFilter || categoryFilter
              ? 'No reported issues match your active search or filter criteria.'
              : 'You have not submitted any platform bugs or technical issues yet.'}
          </p>
          <div className="mt-4">
            <Link to={PATHS.SUBMIT_ISSUE}>
              <Button
                size="sm"
                className="bg-[#0A3C7D] text-xs font-bold text-white hover:bg-[#0A3C7D]/90"
              >
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                Report an Issue
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {issues.map((issue) => (
            <div
              key={issue.issue_number}
              className="group rounded-xl border border-neutral-200/70 bg-white p-4 transition-all duration-200 hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-[#1E1E20] dark:hover:border-neutral-700"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                {/* Issue Header info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-[#0A3C7D] dark:text-blue-400">
                      {issue.issue_number}
                    </span>
                    {getStatusBadge(issue.status)}
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                      {issue.category}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-neutral-900 dark:text-white">
                    {issue.title}
                  </h3>

                  <p className="line-clamp-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {issue.description}
                  </p>
                </div>

                {/* Right side Metadata & Details Trigger */}
                <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <span className="text-[11px] font-semibold text-neutral-400">
                    {formatDate(issue.created_at)}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDetail(issue)}
                    className="h-8 border-neutral-200 text-xs font-bold text-[#0A3C7D] hover:bg-blue-50 dark:border-neutral-800 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    View Details
                  </Button>
                </div>
              </div>

              {/* Bottom Extra Info Bar (Remarks & Attachments) */}
              {(issue.remarks ||
                (issue.attachments && issue.attachments.length > 0) ||
                issue.related_report_number) && (
                <div className="mt-3.5 flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-3 dark:border-neutral-800/70">
                  {/* Super Admin Remarks Alert */}
                  {issue.remarks && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-blue-200/80 bg-blue-50/70 px-2.5 py-1 text-xs font-bold text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300">
                      <MessageSquareQuote className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                      <span>Admin Note: {issue.remarks}</span>
                    </div>
                  )}

                  {/* Attachment indicator */}
                  {issue.attachments && issue.attachments.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                      <Paperclip className="h-3.5 w-3.5 text-neutral-400" />
                      {issue.attachments.length} attachment(s)
                    </span>
                  )}

                  {/* Related Report link */}
                  {issue.related_report_number && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                      Related:{' '}
                      <span className="font-mono text-neutral-700 dark:text-neutral-300">
                        {issue.related_report_number}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drawer Component for Full Details */}
      <SystemIssueDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          setSelectedIssue(null)
        }}
        issue={selectedIssue}
      />
    </div>
  )
}
