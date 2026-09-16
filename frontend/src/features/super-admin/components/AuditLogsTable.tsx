import { useState } from 'react'
import { useAuditLogsQuery } from '../hooks/use-super-admin'
import { superAdminService } from '../services/super-admin.service'
import { Button } from '@/components/ui/button'
import { Shield, Download, ChevronLeft, ChevronRight, Search, FileText } from 'lucide-react'

export function AuditLogsTable() {
  const [page, setPage] = useState(1)
  const pageSize = 15
  const [actionFilter, setActionFilter] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading, error, refetch } = useAuditLogsQuery({
    page,
    page_size: pageSize,
    action: actionFilter.trim() || undefined,
  })

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      setIsExporting(true)
      const blob = await superAdminService.exportAuditLogs(format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `system_audit_logs.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      alert('Failed to export audit logs.')
    } finally {
      setIsExporting(false)
    }
  }

  const items = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <div className="space-y-4">
      {/* Table Header & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-black tracking-tight text-neutral-900 dark:text-white">
            System Action Audit Logs
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter Input */}
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setPage(1)
              }}
              placeholder="Filter by action..."
              className="h-8.5 w-48 rounded-lg border border-neutral-200 bg-white pr-3 pl-8 text-xs font-bold outline-none focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#1C1C1E]"
            />
          </div>

          {/* Export Dropdown / Buttons */}
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={isExporting}
            onClick={() => handleExport('csv')}
            className="flex h-8.5 items-center gap-1.5 px-3 text-xs font-bold dark:border-neutral-800"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={isExporting}
            onClick={() => handleExport('xlsx')}
            className="flex h-8.5 items-center gap-1.5 px-3 text-xs font-bold dark:border-neutral-800"
          >
            <FileText className="h-3.5 w-3.5 text-emerald-600" />
            <span>Excel</span>
          </Button>
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <table className="w-full text-left text-xs font-semibold select-none">
          <thead className="border-b border-neutral-100 bg-neutral-50/80 text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:border-neutral-800 dark:bg-neutral-900/50">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">User ID</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Report ID</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="dark:divide-neutral-850 divide-y divide-neutral-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-400">
                  Loading audit log records...
                </td>
              </tr>
            )}

            {error && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-red-500">
                  Failed to load audit logs.{' '}
                  <button onClick={() => refetch()} className="underline">
                    Retry
                  </button>
                </td>
              </tr>
            )}

            {!isLoading && !error && items.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-400">
                  No audit log records found.
                </td>
              </tr>
            )}

            {!isLoading &&
              !error &&
              items.map((log) => (
                <tr
                  key={log.id}
                  className="dark:hover:bg-neutral-850/40 transition-colors hover:bg-neutral-50/60"
                >
                  <td className="px-4 py-3 font-mono font-bold text-neutral-500">#{log.id}</td>
                  <td className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 font-bold text-neutral-800 dark:text-white">
                    {log.user_id ? `User #${log.user_id}` : 'System'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-blue-50 px-2 py-0.5 font-extrabold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-neutral-500">
                    {log.report_id ? `#${log.report_id}` : '-'}
                  </td>
                  <td
                    className="max-w-xs truncate px-4 py-3 text-neutral-500"
                    title={log.details || ''}
                  >
                    {log.details || '-'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && !error && total > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 shadow-xs select-none dark:border-neutral-800 dark:bg-[#1C1C1E]">
          <span className="text-xs font-semibold text-neutral-500">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} items
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="h-7 px-2 font-bold dark:border-neutral-800"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>
            <span className="px-2 text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="h-7 px-2 font-bold dark:border-neutral-800"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
