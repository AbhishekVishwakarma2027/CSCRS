import React, { useState, useMemo } from 'react'
import {
  Search,
  Ban,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Copy,
  Calendar,
  ShieldAlert,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/utils/format'
import { toast } from 'sonner'
import {
  useCitizensQuery,
  useBlockCitizenMutation,
  useUnblockCitizenMutation,
} from '../hooks/use-user-directories'
import type { CityAdminCitizenItem, BlockTypeEnum } from '../types'

const BLOCK_TYPES: { value: BlockTypeEnum; label: string }[] = [
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'TERMINATED', label: 'Terminated' },
  { value: 'DISMISSED', label: 'Dismissed' },
  { value: 'RETIRED', label: 'Retired' },
  { value: 'TRANSFERRED', label: 'Transferred' },
]

export function CitizensTab() {
  const { data: citizens = [], isLoading, isError, refetch } = useCitizensQuery()
  const blockMutation = useBlockCitizenMutation()
  const unblockMutation = useUnblockCitizenMutation()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all')

  // Block modal state
  const [targetCitizen, setTargetCitizen] = useState<CityAdminCitizenItem | null>(null)
  const [blockType, setBlockType] = useState<BlockTypeEnum>('SUSPENDED')
  const [reason, setReason] = useState('')

  // Unblock confirmation modal state
  const [unblockTarget, setUnblockTarget] = useState<CityAdminCitizenItem | null>(null)

  const filteredCitizens = useMemo(() => {
    return citizens.filter((citizen) => {
      const matchesSearch =
        citizen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        citizen.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (citizen.phone && citizen.phone.includes(searchTerm))

      const isBlocked = citizen.is_blocked || !citizen.is_active
      if (statusFilter === 'active') return matchesSearch && !isBlocked
      if (statusFilter === 'blocked') return matchesSearch && isBlocked
      return matchesSearch
    })
  }, [citizens, searchTerm, statusFilter])

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetCitizen) return

    if (!reason.trim() || reason.trim().length < 5) {
      toast.error('Please provide a reason (at least 5 characters).')
      return
    }

    try {
      await blockMutation.mutateAsync({
        citizenId: targetCitizen.id,
        payload: {
          block_type: blockType,
          reason: reason.trim(),
        },
      })
      toast.success(`Citizen ${targetCitizen.name} has been blocked.`)
      setTargetCitizen(null)
      setReason('')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to block citizen.')
    }
  }

  const handleUnblockConfirm = async () => {
    if (!unblockTarget) return

    try {
      await unblockMutation.mutateAsync(unblockTarget.id)
      toast.success(`Citizen ${unblockTarget.name} has been unblocked.`)
      setUnblockTarget(null)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to unblock citizen.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex max-w-lg flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-9 text-[13px] font-semibold outline-none focus:border-[#0A3C7D] focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'blocked')}
            className="cursor-pointer rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-semibold outline-none focus:border-[#0A3C7D] focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Main Table Container (Desktop & Tablet) */}
      <div className="dark:border-neutral-850 hidden rounded-xl border border-neutral-200/60 bg-white shadow-xs md:block dark:bg-[#1E1E20]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] font-semibold whitespace-nowrap text-neutral-600 dark:text-neutral-300">
            <thead>
              <tr className="dark:border-neutral-850 border-b border-neutral-200/60 bg-neutral-50/50 dark:bg-[#1C1C1E]">
                <th className="text-neutral-450 px-5 py-3 font-black tracking-wider uppercase dark:text-neutral-500">
                  Citizen
                </th>
                <th className="text-neutral-450 px-5 py-3 font-black tracking-wider uppercase dark:text-neutral-500">
                  Contact
                </th>
                <th className="text-neutral-450 px-5 py-3 font-black tracking-wider uppercase dark:text-neutral-500">
                  Status
                </th>
                <th className="text-neutral-450 px-5 py-3 font-black tracking-wider uppercase dark:text-neutral-500">
                  Registered Date
                </th>
                <th className="text-neutral-450 px-5 py-3 text-right font-black tracking-wider uppercase dark:text-neutral-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="dark:border-neutral-850 border-b border-neutral-100">
                    <td className="px-5 py-4">
                      <div className="h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="ml-auto h-7 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-8 w-8 text-rose-500" />
                      <p className="text-[14px] font-bold text-neutral-700 dark:text-neutral-300">
                        Failed to load registered citizens directory.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        className="mt-2 gap-1.5 text-xs font-bold"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : filteredCitizens.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex size-14 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-900/50">
                        <XCircle className="h-7 w-7 text-neutral-400 dark:text-neutral-500" />
                      </div>
                      <h3 className="mt-4 text-[15px] font-black tracking-wide text-neutral-700 uppercase dark:text-neutral-300">
                        No Citizens Found
                      </h3>
                      <p className="mt-1 max-w-sm text-[13px] font-semibold text-neutral-500 dark:text-neutral-400">
                        {searchTerm || statusFilter !== 'all'
                          ? 'No citizen accounts match the selected filter parameters.'
                          : 'No registered citizen records exist in the system directory.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCitizens.map((citizen) => {
                  const isBlocked = citizen.is_blocked || !citizen.is_active

                  return (
                    <tr
                      key={citizen.id}
                      className="dark:border-neutral-850 border-b border-neutral-100 transition-colors hover:bg-neutral-50/50 dark:hover:bg-[#1A1A1C]"
                    >
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0A3C7D]/10 text-xs font-black text-[#0A3C7D] dark:bg-blue-900/30 dark:text-blue-400">
                            {citizen.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-bold text-neutral-800 dark:text-neutral-200">
                              {citizen.name}
                            </span>
                            <span className="text-neutral-450 block text-[11px] font-semibold dark:text-neutral-500">
                              ID: #{citizen.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(citizen.email)
                                toast.success(`Copied ${citizen.email} to clipboard!`)
                              }}
                              title="Copy email address"
                              aria-label={`Copy email ${citizen.email}`}
                              className="group inline-flex cursor-pointer items-center gap-1 text-left font-semibold text-neutral-800 transition-colors select-text hover:text-[#0A3C7D] dark:text-neutral-200 dark:hover:text-blue-400"
                            >
                              <span className="select-text">{citizen.email}</span>
                              <Copy className="h-3 w-3 shrink-0 text-neutral-400 opacity-60 transition-opacity group-hover:text-[#0A3C7D] group-hover:opacity-100 dark:group-hover:text-blue-400" />
                            </button>
                          </div>
                          {citizen.phone && (
                            <div className="flex items-center gap-1.5 text-[12px] text-neutral-500">
                              <Phone className="h-3 w-3 shrink-0 text-neutral-400" />
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(citizen.phone!)
                                  toast.success(`Copied ${citizen.phone} to clipboard!`)
                                }}
                                title="Copy phone number"
                                aria-label={`Copy phone number ${citizen.phone}`}
                                className="group inline-flex cursor-pointer items-center gap-1 text-left font-medium text-neutral-600 transition-colors select-text hover:text-[#0A3C7D] dark:text-neutral-300 dark:hover:text-blue-400"
                              >
                                <span className="select-text">{citizen.phone}</span>
                                <Copy className="h-3 w-3 shrink-0 text-neutral-400 opacity-60 transition-opacity group-hover:text-[#0A3C7D] group-hover:opacity-100 dark:group-hover:text-blue-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase ${
                            isBlocked
                              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400'
                          }`}
                        >
                          {isBlocked ? (
                            <>
                              <Ban className="h-3 w-3" />
                              Blocked
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </>
                          )}
                        </span>
                      </td>

                      {/* Registered Date */}
                      <td className="px-5 py-3.5 text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                          <span>{formatDate(citizen.created_at)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        {isBlocked ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUnblockTarget(citizen)}
                            className="h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                          >
                            Unblock
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTargetCitizen(citizen)
                              setBlockType('SUSPENDED')
                              setReason('')
                            }}
                            className="h-8 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
                          >
                            <Ban className="mr-1.5 h-3.5 w-3.5" />
                            Block
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Responsive Cards Reflow */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="dark:border-neutral-850 animate-pulse space-y-2 rounded-xl border border-neutral-200/60 bg-white p-4 dark:bg-[#1E1E20]"
            >
              <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-3 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
            </div>
          ))
        ) : isError ? (
          <div className="dark:border-neutral-850 rounded-xl border border-neutral-200/60 bg-white p-6 text-center dark:bg-[#1E1E20]">
            <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
            <p className="mt-2 text-sm font-bold text-neutral-700 dark:text-neutral-300">
              Failed to load registered citizens directory.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-3 gap-1.5 text-xs font-bold"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
          </div>
        ) : filteredCitizens.length === 0 ? (
          <div className="dark:border-neutral-850 rounded-xl border border-neutral-200/60 bg-white p-8 text-center dark:bg-[#1E1E20]">
            <XCircle className="mx-auto h-8 w-8 text-neutral-400" />
            <h3 className="mt-2 text-sm font-black text-neutral-700 uppercase dark:text-neutral-300">
              No Citizens Found
            </h3>
          </div>
        ) : (
          filteredCitizens.map((citizen) => {
            const isBlocked = citizen.is_blocked || !citizen.is_active

            return (
              <div
                key={citizen.id}
                className="dark:border-neutral-850 space-y-3 rounded-xl border border-neutral-200/60 bg-white p-4 shadow-xs dark:bg-[#1E1E20]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0A3C7D]/10 text-xs font-black text-[#0A3C7D] dark:bg-blue-900/30 dark:text-blue-400">
                      {citizen.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate font-bold text-neutral-800 dark:text-neutral-200">
                        {citizen.name}
                      </span>
                      <span className="text-neutral-450 block text-[11px] font-semibold dark:text-neutral-500">
                        ID: #{citizen.id}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase ${
                      isBlocked
                        ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400'
                    }`}
                  >
                    {isBlocked ? (
                      <>
                        <Ban className="h-3 w-3" />
                        Blocked
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-1.5 border-t border-neutral-100 pt-2.5 text-xs dark:border-neutral-800">
                  <div className="flex items-start gap-1.5 text-neutral-700 dark:text-neutral-300">
                    <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(citizen.email)
                        toast.success(`Copied ${citizen.email} to clipboard!`)
                      }}
                      className="group inline-flex min-w-0 cursor-pointer items-center gap-1 text-left font-semibold text-neutral-800 hover:text-[#0A3C7D] dark:text-neutral-200 dark:hover:text-blue-400"
                    >
                      <span className="min-w-0 break-all select-text">{citizen.email}</span>
                      <Copy className="h-3 w-3 shrink-0 text-neutral-400 opacity-60 group-hover:opacity-100" />
                    </button>
                  </div>

                  {citizen.phone && (
                    <div className="flex items-center gap-1.5 text-[12px] text-neutral-500">
                      <Phone className="h-3 w-3 shrink-0 text-neutral-400" />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(citizen.phone!)
                          toast.success(`Copied ${citizen.phone} to clipboard!`)
                        }}
                        className="group inline-flex min-w-0 cursor-pointer items-center gap-1 text-left font-medium text-neutral-600 hover:text-[#0A3C7D] dark:text-neutral-300 dark:hover:text-blue-400"
                      >
                        <span className="min-w-0 break-words select-text">{citizen.phone}</span>
                        <Copy className="h-3 w-3 shrink-0 text-neutral-400 opacity-60 group-hover:opacity-100" />
                      </button>
                    </div>
                  )}

                  <div className="text-neutral-450 flex items-center gap-1.5 dark:text-neutral-400">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    <span>{formatDate(citizen.created_at)}</span>
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-2.5 text-right dark:border-neutral-800">
                  {isBlocked ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setUnblockTarget(citizen)}
                      className="h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                    >
                      Unblock
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTargetCitizen(citizen)
                        setBlockType('SUSPENDED')
                        setReason('')
                      }}
                      className="h-8 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
                    >
                      <Ban className="mr-1.5 h-3.5 w-3.5" />
                      Block
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Block Citizen Modal */}
      {targetCitizen && (
        <>
          <div
            className="animate-in fade-in fixed inset-0 z-50 bg-neutral-900/60 transition-opacity duration-300 dark:bg-black/80"
            onClick={() => setTargetCitizen(null)}
          />
          <div
            role="dialog"
            className="animate-in slide-in-from-bottom-[5%] fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl transition-all duration-300 dark:border dark:border-neutral-800 dark:bg-[#1C1C1E]"
          >
            <div className="dark:border-neutral-850 flex items-center justify-between border-b border-neutral-100 p-4">
              <h2 className="flex items-center gap-2 text-lg font-black tracking-wider text-rose-600 uppercase dark:text-rose-500">
                <ShieldAlert className="h-5 w-5" />
                Block Citizen Account
              </h2>
              <button
                type="button"
                onClick={() => setTargetCitizen(null)}
                className="cursor-pointer text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBlockSubmit} className="space-y-4 p-5">
              <p className="text-[13px] font-semibold text-neutral-600 dark:text-neutral-400">
                Are you sure you want to block citizen{' '}
                <strong className="text-neutral-900 dark:text-neutral-100">
                  {targetCitizen.name}
                </strong>
                ?
              </p>

              <div>
                <label className="text-neutral-450 mb-1.5 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Action Type
                </label>
                <select
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value as BlockTypeEnum)}
                  className="w-full cursor-pointer rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-bold outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
                >
                  {BLOCK_TYPES.map((bt) => (
                    <option key={bt.value} value={bt.value}>
                      {bt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-neutral-450 mb-1.5 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Reason for Block
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State official reason for restricting this citizen account..."
                  className="w-full rounded-lg border border-neutral-200 bg-white p-3 text-[13px] font-semibold outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
                />
              </div>

              <div className="dark:border-neutral-850 flex items-center justify-end gap-3 border-t border-neutral-100 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setTargetCitizen(null)}
                  className="text-[13px] font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={blockMutation.isPending}
                  className="bg-rose-600 text-[13px] font-bold text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500"
                >
                  {blockMutation.isPending ? 'Blocking...' : 'Confirm Block'}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Unblock Confirmation Modal */}
      {unblockTarget && (
        <>
          <div
            className="animate-in fade-in fixed inset-0 z-50 bg-neutral-900/60 transition-opacity duration-300 dark:bg-black/80"
            onClick={() => setUnblockTarget(null)}
          />
          <div
            role="dialog"
            className="animate-in slide-in-from-bottom-[5%] fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl transition-all duration-300 dark:border dark:border-neutral-800 dark:bg-[#1C1C1E]"
          >
            <div className="dark:border-neutral-850 flex items-center justify-between border-b border-neutral-100 p-4">
              <h2 className="flex items-center gap-2 text-lg font-black tracking-wider text-emerald-600 uppercase dark:text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
                Unblock Citizen Account
              </h2>
              <button
                type="button"
                onClick={() => setUnblockTarget(null)}
                className="cursor-pointer text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <p className="text-[13px] font-semibold text-neutral-600 dark:text-neutral-400">
                Are you sure you want to unblock citizen{' '}
                <strong className="text-neutral-900 dark:text-neutral-100">
                  {unblockTarget.name}
                </strong>
                ? This will restore full access to their civic account.
              </p>

              <div className="dark:border-neutral-850 flex items-center justify-end gap-3 border-t border-neutral-100 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setUnblockTarget(null)}
                  className="text-[13px] font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleUnblockConfirm}
                  disabled={unblockMutation.isPending}
                  className="bg-emerald-600 text-[13px] font-bold text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  {unblockMutation.isPending ? 'Unblocking...' : 'Confirm Unblock'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
