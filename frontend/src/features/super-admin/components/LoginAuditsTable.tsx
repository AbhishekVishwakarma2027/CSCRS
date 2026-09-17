import { useState } from 'react'
import { useLoginAuditsQuery } from '../hooks/use-super-admin'
import type { LoginAuditItem } from '../types'
import { LoginAuditDetailsDrawer } from './LoginAuditDetailsDrawer'
import { Button } from '@/components/ui/button'
import { Lock, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react'

export function LoginAuditsTable() {
  const [page, setPage] = useState(1)
  const pageSize = 15
  const [successFilter, setSuccessFilter] = useState<'all' | 'success' | 'failed'>('all')
  const [selectedAudit, setSelectedAudit] = useState<LoginAuditItem | null>(null)

  const filterParam =
    successFilter === 'all' ? undefined : successFilter === 'success' ? true : false

  const { data, isLoading, error, refetch } = useLoginAuditsQuery({
    page,
    page_size: pageSize,
    login_success: filterParam,
  })

  const items = data?.items || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <div className="space-y-4">
      {/* Table Header & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-indigo-600" />
          <h3 className="text-base font-black tracking-tight text-neutral-900 dark:text-white">
            User Login Security Audits
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={successFilter}
            onChange={(e) => {
              setSuccessFilter(e.target.value as 'all' | 'success' | 'failed')
              setPage(1)
            }}
            className="h-8.5 cursor-pointer rounded-lg border border-neutral-200 bg-white px-3 text-xs font-bold outline-none focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#1C1C1E]"
          >
            <option value="all">All Login Attempts</option>
            <option value="success">Successful Logins</option>
            <option value="failed">Failed Attempts</option>
          </select>
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <table className="w-full text-left text-xs font-semibold select-none">
          <thead className="border-b border-neutral-100 bg-neutral-50/80 text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:border-neutral-800 dark:bg-neutral-900/50">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Email Address</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">IP Address</th>
              <th className="px-4 py-3">User Agent</th>
            </tr>
          </thead>
          <tbody className="dark:divide-neutral-850 divide-y divide-neutral-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-400">
                  Loading login security audit records...
                </td>
              </tr>
            )}

            {error && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-red-500">
                  Failed to load login audits.{' '}
                  <button onClick={() => refetch()} className="underline">
                    Retry
                  </button>
                </td>
              </tr>
            )}

            {!isLoading && !error && items.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-400">
                  No login audit records found.
                </td>
              </tr>
            )}

            {!isLoading &&
              !error &&
              items.map((log) => {
                const isSelected = selectedAudit?.id === log.id
                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedAudit(log)}
                    className={`dark:hover:bg-neutral-850/60 cursor-pointer transition-colors hover:bg-neutral-50/80 ${
                      isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-neutral-500">#{log.id}</td>
                    <td className="px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">
                      {log.login_at ? new Date(log.login_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 font-bold text-neutral-800 dark:text-white">
                      {log.email || (log.user_id ? `User #${log.user_id}` : 'Anonymous')}
                    </td>
                    <td className="px-4 py-3">
                      {log.login_success ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 font-bold text-red-700 dark:bg-red-950/40 dark:text-red-400">
                          <XCircle className="h-3.5 w-3.5" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-500">
                      {log.ip_address || 'Unknown'}
                    </td>
                    <td
                      className="max-w-xs truncate px-4 py-3 text-neutral-400"
                      title={log.user_agent || ''}
                    >
                      {log.user_agent || 'Unknown'}
                    </td>
                  </tr>
                )
              })}
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

      {/* Login Audit Details Drawer */}
      <LoginAuditDetailsDrawer
        isOpen={!!selectedAudit}
        onClose={() => setSelectedAudit(null)}
        audit={selectedAudit}
      />
    </div>
  )
}
