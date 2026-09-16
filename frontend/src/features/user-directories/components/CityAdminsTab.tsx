import React, { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  Ban,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/utils/format'
import { toast } from 'sonner'
import { CreateCityAdminModal } from './CreateCityAdminModal'
import {
  useCityAdminsQuery,
  useBlockCityAdminMutation,
  useUnblockCityAdminMutation,
} from '../hooks/use-user-directories'
import type { CityAdminItem, BlockTypeEnum } from '../types'

const BLOCK_TYPES: { value: BlockTypeEnum; label: string }[] = [
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'TERMINATED', label: 'Terminated' },
  { value: 'DISMISSED', label: 'Dismissed' },
  { value: 'RETIRED', label: 'Retired' },
  { value: 'TRANSFERRED', label: 'Transferred' },
]

export function CityAdminsTab() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { data: admins = [], isLoading, isError, refetch } = useCityAdminsQuery()

  const blockMutation = useBlockCityAdminMutation()
  const unblockMutation = useUnblockCityAdminMutation()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all')

  // Block modal state
  const [targetAdmin, setTargetAdmin] = useState<CityAdminItem | null>(null)
  const [blockType, setBlockType] = useState<BlockTypeEnum>('SUSPENDED')
  const [reason, setReason] = useState('')

  // Unblock confirmation modal state
  const [unblockTarget, setUnblockTarget] = useState<CityAdminItem | null>(null)

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchesSearch =
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (admin.phone && admin.phone.includes(searchTerm))

      const isBlocked = admin.is_blocked || !admin.is_active
      if (statusFilter === 'active') return matchesSearch && !isBlocked
      if (statusFilter === 'blocked') return matchesSearch && isBlocked
      return matchesSearch
    })
  }, [admins, searchTerm, statusFilter])

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetAdmin) return

    if (!reason.trim() || reason.trim().length < 5) {
      toast.error('Please provide a reason (at least 5 characters).')
      return
    }

    try {
      await blockMutation.mutateAsync({
        adminId: targetAdmin.id,
        payload: {
          block_type: blockType,
          reason: reason.trim(),
        },
      })
      toast.success(`City Administrator ${targetAdmin.name} has been blocked.`)
      setTargetAdmin(null)
      setReason('')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to block City Administrator.')
    }
  }

  const handleUnblockSubmit = async () => {
    if (!unblockTarget) return

    try {
      await unblockMutation.mutateAsync(unblockTarget.id)
      toast.success(`City Administrator ${unblockTarget.name} has been unblocked.`)
      setUnblockTarget(null)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to unblock City Administrator.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-9 text-[13px] font-bold outline-none focus:border-[#0A3C7D] focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'blocked')}
            className="cursor-pointer rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-bold outline-none focus:border-[#0A3C7D] focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked / Inactive</option>
          </select>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-[#0A3C7D] text-[13px] font-bold text-white hover:bg-[#0A3C7D]/90 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Create City Admin
        </Button>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-[#1C1C1E]">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="h-6 w-6 animate-spin text-[#0A3C7D] dark:text-blue-500" />
            <span className="ml-2 text-sm font-semibold text-neutral-500">
              Loading City Administrators...
            </span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="h-8 w-8 text-rose-500" />
            <p className="mt-2 text-sm font-bold text-neutral-700 dark:text-neutral-300">
              Failed to load City Administrators
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
              Retry
            </Button>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <ShieldCheck className="h-10 w-10 text-neutral-300 dark:text-neutral-600" />
            <p className="mt-2 text-sm font-bold text-neutral-600 dark:text-neutral-400">
              No City Administrators found.
            </p>
            {searchTerm && (
              <p className="text-xs text-neutral-400">Try clearing your search query.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-500">
                  <th className="px-4 py-3">Administrator</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-[13px] dark:divide-neutral-800">
                {filteredAdmins.map((admin) => {
                  const isBlocked = admin.is_blocked

                  return (
                    <tr
                      key={admin.id}
                      className="transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30"
                    >
                      {/* Name & ID */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 font-black text-[#0A3C7D] dark:bg-blue-950/50 dark:text-blue-400">
                            {admin.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-800 dark:text-neutral-200">
                              {admin.name}
                            </div>
                            <div className="text-[11px] text-neutral-400">ID: #{admin.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                            <Mail className="h-3.5 w-3.5 text-neutral-400" />
                            <span>{admin.email}</span>
                          </div>
                          {admin.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                              <Phone className="h-3.5 w-3.5 text-neutral-400" />
                              <span>{admin.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {isBlocked ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                              <XCircle className="h-3 w-3" />
                              Blocked
                            </span>
                          ) : admin.is_active ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                              <AlertCircle className="h-3 w-3" />
                              Pending Activation
                            </span>
                          )}

                          {admin.is_email_verified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                              Verified
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-3.5 text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                          <span>{formatDate(admin.created_at)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        {isBlocked ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUnblockTarget(admin)}
                            className="h-8 border-emerald-200 bg-emerald-50/50 text-xs font-bold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                          >
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            Unblock
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTargetAdmin(admin)
                              setReason('')
                              setBlockType('SUSPENDED')
                            }}
                            className="h-8 border-rose-200 bg-rose-50/50 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
                          >
                            <Ban className="mr-1.5 h-3.5 w-3.5" />
                            Block
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateCityAdminModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Block Modal */}
      {targetAdmin && (
        <>
          <div
            className="animate-in fade-in fixed inset-0 z-50 bg-neutral-900/60 dark:bg-black/80"
            onClick={() => setTargetAdmin(null)}
          />
          <div
            role="dialog"
            className="animate-in slide-in-from-bottom-[5%] fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl dark:border dark:border-neutral-800 dark:bg-[#1C1C1E]"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 p-4 dark:border-neutral-800">
              <h3 className="flex items-center gap-2 text-base font-black text-rose-600 dark:text-rose-400">
                <Ban className="h-5 w-5" />
                Block City Administrator
              </h3>
              <button
                onClick={() => setTargetAdmin(null)}
                className="cursor-pointer text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBlockSubmit} className="space-y-4 p-5">
              <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                You are blocking{' '}
                <strong className="text-neutral-900 dark:text-white">{targetAdmin.name}</strong> (
                {targetAdmin.email}).
              </p>

              <div>
                <label className="mb-1 block text-[11px] font-black text-neutral-500 uppercase">
                  Block Reason Type
                </label>
                <select
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value as BlockTypeEnum)}
                  className="w-full rounded-lg border border-neutral-200 bg-white p-2 text-[13px] font-bold outline-none focus:border-rose-500 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
                >
                  {BLOCK_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-black text-neutral-500 uppercase">
                  Detailed Reason
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the administrative reason for blocking this user..."
                  className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-[13px] outline-none focus:border-rose-500 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setTargetAdmin(null)}
                  className="text-[13px] font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={blockMutation.isPending}
                  className="bg-rose-600 text-[13px] font-bold text-white hover:bg-rose-700"
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
            className="animate-in fade-in fixed inset-0 z-50 bg-neutral-900/60 dark:bg-black/80"
            onClick={() => setUnblockTarget(null)}
          />
          <div
            role="dialog"
            className="animate-in slide-in-from-bottom-[5%] fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-5 shadow-2xl dark:border dark:border-neutral-800 dark:bg-[#1C1C1E]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Unblock City Administrator?
                </h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Restore platform access for <strong>{unblockTarget.name}</strong>.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
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
                disabled={unblockMutation.isPending}
                onClick={handleUnblockSubmit}
                className="bg-emerald-600 text-[13px] font-bold text-white hover:bg-emerald-700"
              >
                {unblockMutation.isPending ? 'Unblocking...' : 'Unblock Access'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
