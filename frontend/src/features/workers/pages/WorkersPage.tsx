import React, { useState, useMemo } from 'react'
import {
  Users,
  AlertTriangle,
  UserPlus,
  X,
  Mail,
  Phone,
  ShieldCheck,
  Briefcase,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  RefreshCw,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDate } from '@/utils/format'
import {
  useWorkersQuery,
  useInviteWorkerMutation,
  useActivateWorkerMutation,
  useDeactivateWorkerMutation,
  useBlockWorkerMutation,
  useUnblockWorkerMutation,
} from '../hooks/use-workers'
import type { WorkerDirectoryItem } from '../services/workers.service'

export default function WorkersPage() {
  // Query
  const { data: workers = [], isLoading, error, refetch } = useWorkersQuery()

  // Controls state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<
    'JOINED_DESC' | 'JOINED_ASC' | 'NAME_ASC' | 'AVAILABLE_FIRST'
  >('JOINED_DESC')

  // Invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [employeeCode, setEmployeeCode] = useState('')
  const [designation, setDesignation] = useState('')

  // Block modal state
  const [selectedWorker, setSelectedWorker] = useState<WorkerDirectoryItem | null>(null)
  const [isBlockOpen, setIsBlockOpen] = useState(false)
  const [blockType, setBlockType] = useState('TRANSFERRED')
  const [blockReason, setBlockReason] = useState('')

  // Action pending tracking
  const [actionWorkerId, setActionWorkerId] = useState<number | null>(null)

  // Mutations
  const inviteMutation = useInviteWorkerMutation()
  const activateMutation = useActivateWorkerMutation()
  const deactivateMutation = useDeactivateWorkerMutation()
  const blockMutation = useBlockWorkerMutation()
  const unblockMutation = useUnblockWorkerMutation()

  // Filtered & Sorted Workers
  const filteredWorkers = useMemo(() => {
    return workers
      .filter((w) => {
        // Search filter (name, email, phone, employee_code, designation)
        const query = searchQuery.trim().toLowerCase()
        if (query) {
          const matchName = w.name.toLowerCase().includes(query)
          const matchEmail = w.email.toLowerCase().includes(query)
          const matchPhone = w.phone ? w.phone.toLowerCase().includes(query) : false
          const matchCode = w.employee_code.toLowerCase().includes(query)
          const matchDesignation = w.designation.toLowerCase().includes(query)

          if (!matchName && !matchEmail && !matchPhone && !matchCode && !matchDesignation) {
            return false
          }
        }

        // Status Filter
        if (statusFilter === 'ACTIVE') return w.is_active && !w.is_blocked
        if (statusFilter === 'INACTIVE') return !w.is_active && !w.is_blocked
        if (statusFilter === 'BLOCKED') return w.is_blocked
        if (statusFilter === 'AVAILABLE') return w.is_available && w.is_active && !w.is_blocked
        if (statusFilter === 'BUSY') return !w.is_available && w.is_active && !w.is_blocked

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'JOINED_DESC') {
          return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime()
        }
        if (sortBy === 'JOINED_ASC') {
          return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
        }
        if (sortBy === 'NAME_ASC') {
          return a.name.localeCompare(b.name)
        }
        if (sortBy === 'AVAILABLE_FIRST') {
          return (b.is_available ? 1 : 0) - (a.is_available ? 1 : 0)
        }
        return 0
      })
  }, [workers, searchQuery, statusFilter, sortBy])

  // Handlers
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !employeeCode || !designation) {
      toast.error('Please fill in all required fields.')
      return
    }

    try {
      await inviteMutation.mutateAsync({
        name,
        email,
        phone: phone || undefined,
        employee_code: employeeCode,
        designation,
      })
      toast.success(`Invitation successfully queued and sent to ${email}!`)
      setIsInviteOpen(false)
      setName('')
      setEmail('')
      setPhone('')
      setEmployeeCode('')
      setDesignation('')
    } catch (err) {
      console.error(err)
      const apiError = err as { response?: { data?: { detail?: string } } }
      toast.error(apiError.response?.data?.detail || 'Failed to send worker invitation.')
    }
  }

  const handleActivateWorker = async (w: WorkerDirectoryItem) => {
    setActionWorkerId(w.id)
    try {
      await activateMutation.mutateAsync(w.id)
      toast.success(`Worker ${w.name} (#${w.id}) account activated successfully!`)
    } catch (err) {
      console.error(err)
      const apiError = err as { response?: { data?: { detail?: string } } }
      toast.error(apiError.response?.data?.detail || 'Failed to activate worker.')
    } finally {
      setActionWorkerId(null)
    }
  }

  const handleDeactivateWorker = async (w: WorkerDirectoryItem) => {
    setActionWorkerId(w.id)
    try {
      await deactivateMutation.mutateAsync(w.id)
      toast.success(`Worker ${w.name} (#${w.id}) account deactivated.`)
    } catch (err) {
      console.error(err)
      const apiError = err as { response?: { data?: { detail?: string } } }
      toast.error(apiError.response?.data?.detail || 'Failed to deactivate worker.')
    } finally {
      setActionWorkerId(null)
    }
  }

  const handleUnblockWorker = async (w: WorkerDirectoryItem) => {
    setActionWorkerId(w.id)
    try {
      await unblockMutation.mutateAsync(w.id)
      toast.success(`Worker ${w.name} (#${w.id}) has been unblocked.`)
    } catch (err) {
      console.error(err)
      const apiError = err as { response?: { data?: { detail?: string } } }
      toast.error(apiError.response?.data?.detail || 'Failed to unblock worker.')
    } finally {
      setActionWorkerId(null)
    }
  }

  const openBlockModal = (w: WorkerDirectoryItem) => {
    setSelectedWorker(w)
    setBlockReason('')
    setIsBlockOpen(true)
  }

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWorker) return
    if (!blockReason.trim()) {
      toast.error('Please enter a block reason.')
      return
    }

    setActionWorkerId(selectedWorker.id)
    try {
      await blockMutation.mutateAsync({
        workerId: selectedWorker.id,
        blockType,
        reason: blockReason,
      })
      toast.success(`Worker ${selectedWorker.name} (#${selectedWorker.id}) has been blocked.`)
      setIsBlockOpen(false)
      setSelectedWorker(null)
      setBlockReason('')
    } catch (err) {
      console.error(err)
      const apiError = err as { response?: { data?: { detail?: string } } }
      toast.error(apiError.response?.data?.detail || 'Failed to block worker.')
    } finally {
      setActionWorkerId(null)
    }
  }

  return (
    <div className="space-y-6 pb-10 text-left select-none">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
        <div className="flex shrink-0 flex-col gap-1.5">
          <h1 className="text-neutral-850 text-2xl font-black tracking-tight dark:text-white">
            Field Force Directory
          </h1>
          <p className="text-[13px] leading-relaxed font-semibold text-neutral-500 dark:text-neutral-400">
            Audit, search, activate/deactivate, and manage operational field workers in your
            department.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsInviteOpen(true)}
          className="flex h-9 cursor-pointer items-center justify-center gap-1.5 bg-[#0A3C7D] px-4 text-xs font-black tracking-wider text-white uppercase hover:bg-[#0A3C7D]/95 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <UserPlus className="h-4 w-4" />
          Invite Field Worker
        </Button>
      </div>

      {/* Controls Bar: Search, Filter, Sort */}
      <Card className="border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, employee ID, or designation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 pr-3 pl-9 text-xs font-semibold outline-none focus:border-[#0A3C7D] dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200 dark:focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute top-2.5 right-3 text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter & Sort Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Status */}
            <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs dark:border-neutral-800 dark:bg-neutral-900/60">
              <Filter className="h-3.5 w-3.5 text-neutral-400" />
              <select
                aria-label="Filter Workers by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="cursor-pointer bg-transparent text-xs font-bold text-neutral-700 outline-none dark:text-neutral-300"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="BLOCKED">Blocked</option>
                <option value="AVAILABLE">Available Force</option>
                <option value="BUSY">Busy Force</option>
              </select>
            </div>

            {/* Sort by */}
            <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs dark:border-neutral-800 dark:bg-neutral-900/60">
              <ArrowUpDown className="h-3.5 w-3.5 text-neutral-400" />
              <select
                aria-label="Sort Workers Directory"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="cursor-pointer bg-transparent text-xs font-bold text-neutral-700 outline-none dark:text-neutral-300"
              >
                <option value="JOINED_DESC">Joined: Newest First</option>
                <option value="JOINED_ASC">Joined: Oldest First</option>
                <option value="NAME_ASC">Name: A - Z</option>
                <option value="AVAILABLE_FIRST">Available First</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Directory Table Area */}
      {isLoading ? (
        <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#1C1C1E]">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#0A3C7D] border-t-transparent dark:border-blue-500" />
          <span className="text-xs font-bold text-neutral-500">Loading worker directory...</span>
        </div>
      ) : error ? (
        <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-rose-200 bg-rose-50/10 p-5 dark:border-rose-950/20">
          <AlertTriangle className="h-8 w-8 text-rose-500" />
          <span className="text-xs font-bold text-rose-600">
            Failed to load department workers.
          </span>
          <Button variant="outline" size="xs" onClick={() => refetch()} className="h-7">
            <RefreshCw className="mr-1 h-3 w-3" />
            Retry Connection
          </Button>
        </div>
      ) : workers.length === 0 ? (
        <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/20 p-5 dark:border-neutral-800">
          <Users className="h-8 w-8 text-neutral-400" />
          <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
            No field workers registered in your department yet.
          </span>
          <Button
            size="xs"
            onClick={() => setIsInviteOpen(true)}
            className="mt-2 bg-[#0A3C7D] text-xs font-bold text-white"
          >
            Invite First Worker
          </Button>
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="flex h-44 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/20 p-5 dark:border-neutral-800">
          <Search className="h-6 w-6 text-neutral-400" />
          <span className="text-xs font-bold text-neutral-500">
            No matching workers found for your filter.
          </span>
        </div>
      ) : (
        <Card className="overflow-hidden border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs select-none">
              <thead className="border-b border-neutral-100 bg-neutral-50/50 text-[13px] font-black tracking-wider text-neutral-400 uppercase dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Worker Info</th>
                  <th className="px-4 py-3">Contact Details</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3">Workload Status</th>
                  <th className="px-4 py-3">Account Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredWorkers.map((w) => (
                  <tr
                    key={w.id}
                    className="transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30"
                  >
                    {/* Worker Info */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[14px] font-extrabold text-neutral-900 dark:text-white">
                          {w.name}
                        </span>
                        <div className="flex items-center gap-2 text-[12px] font-semibold text-neutral-500">
                          <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-800">
                            {w.employee_code}
                          </span>
                          <span>•</span>
                          <span>{w.designation}</span>
                        </div>
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td className="px-4 py-3.5 select-text">
                      <div className="flex flex-col gap-1 text-[13px] text-neutral-800 dark:text-neutral-200">
                        {/* Email */}
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(w.email)
                              toast.success(`Copied ${w.email} to clipboard!`)
                            }}
                            title="Click to copy email address"
                            className="group inline-flex cursor-pointer items-center gap-1 text-left font-semibold text-neutral-800 transition-colors select-text hover:text-[#0A3C7D] dark:text-neutral-200 dark:hover:text-blue-400"
                          >
                            <span className="select-text">{w.email}</span>
                            <Copy className="h-3 w-3 shrink-0 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100" />
                          </button>
                        </div>

                        {/* Phone */}
                        {w.phone && (
                          <div className="flex items-center gap-1.5 text-[13px] text-neutral-600 dark:text-neutral-400">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(w.phone!)
                                toast.success(`Copied ${w.phone} to clipboard!`)
                              }}
                              title="Click to copy phone number"
                              className="group inline-flex cursor-pointer items-center gap-1 text-left font-medium text-neutral-700 transition-colors select-text hover:text-[#0A3C7D] dark:text-neutral-300 dark:hover:text-blue-400"
                            >
                              <span className="select-text">{w.phone}</span>
                              <Copy className="h-3 w-3 shrink-0 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100" />
                            </button>
                            {w.phone_extension && (
                              <span className="text-[11px] text-neutral-400 select-text">
                                (Ext: {w.phone_extension})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="px-4 py-3.5 text-xs text-neutral-600 dark:text-neutral-400">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                        <span>{formatDate(w.joined_at)}</span>
                      </div>
                    </td>

                    {/* Workload Status */}
                    <td className="px-4 py-3.5">
                      {w.is_available ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[12px] font-extrabold text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[12px] font-extrabold text-amber-600 dark:bg-amber-950/20 dark:text-amber-400">
                          <XCircle className="h-3 w-3" />
                          Busy / Assigned
                        </span>
                      )}
                    </td>

                    {/* Account Status */}
                    <td className="px-4 py-3.5">
                      {w.is_blocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[12px] font-extrabold text-rose-600 dark:bg-rose-950/20 dark:text-rose-400">
                          <Ban className="h-3 w-3" />
                          Blocked
                        </span>
                      ) : w.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[12px] font-extrabold text-blue-600 dark:bg-blue-950/20 dark:text-blue-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[12px] font-extrabold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                          <Clock className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Row Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {w.is_blocked ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            disabled={actionWorkerId === w.id}
                            onClick={() => handleUnblockWorker(w)}
                            className="h-7 text-[12px] font-black tracking-wider uppercase"
                          >
                            {actionWorkerId === w.id ? 'Updating...' : 'Unblock'}
                          </Button>
                        ) : (
                          <>
                            {w.is_active ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                disabled={actionWorkerId === w.id}
                                onClick={() => handleDeactivateWorker(w)}
                                className="h-7 text-[12px] font-black tracking-wider uppercase"
                              >
                                {actionWorkerId === w.id ? 'Updating...' : 'Deactivate'}
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                disabled={actionWorkerId === w.id}
                                onClick={() => handleActivateWorker(w)}
                                className="h-7 text-[12px] font-black tracking-wider uppercase"
                              >
                                {actionWorkerId === w.id ? 'Updating...' : 'Activate'}
                              </Button>
                            )}

                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              disabled={actionWorkerId === w.id}
                              onClick={() => openBlockModal(w)}
                              className="border-rose-250 h-7 text-[12px] font-black tracking-wider text-rose-600 uppercase hover:bg-rose-50 dark:border-rose-950/20 dark:hover:bg-rose-950/10"
                            >
                              Block
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Invite Worker Modal Dialog */}
      {isInviteOpen && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 duration-200 dark:bg-black/80">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-[#1C1C1E]">
            <div className="dark:border-neutral-850 flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="flex items-center gap-1.5 text-sm font-black tracking-wider text-[#0A3C7D] uppercase dark:text-blue-400">
                <UserPlus className="h-4.5 w-4.5" />
                Invite Department Worker
              </h3>
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="text-neutral-450 cursor-pointer rounded-md outline-none hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[12px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter worker's full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-xs font-semibold outline-none focus:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute top-2.5 left-3 h-4 w-4 text-neutral-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@cscrs.gov"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 pr-3 pl-9.5 text-xs font-semibold outline-none focus:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute top-2.5 left-3 h-4 w-4 text-neutral-400" />
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 pr-3 pl-9.5 text-xs font-semibold outline-none focus:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[12px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                    Employee ID Code
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute top-2.5 left-3 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      required
                      placeholder="EMP-XXXX"
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value)}
                      className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 pr-3 pl-9.5 text-xs font-semibold outline-none focus:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                    Designation
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute top-2.5 left-3 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Field Officer"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 pr-3 pl-9.5 text-xs font-semibold outline-none focus:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200"
                    />
                  </div>
                </div>
              </div>

              <div className="dark:border-neutral-850 mt-4 flex items-center justify-end gap-2 border-t border-neutral-100 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInviteOpen(false)}
                  className="h-8 cursor-pointer dark:border-neutral-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="h-8 bg-[#0A3C7D] text-xs font-black tracking-wider text-white uppercase hover:bg-[#0A3C7D]/95 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {inviteMutation.isPending ? 'Inviting...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block Worker Modal Dialog */}
      {isBlockOpen && selectedWorker && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 duration-200 dark:bg-black/80">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-[#1C1C1E]">
            <div className="dark:border-neutral-850 flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="flex items-center gap-1.5 text-sm font-black tracking-wider text-rose-600 uppercase">
                <AlertTriangle className="h-4.5 w-4.5" />
                Block Worker: {selectedWorker.name} (#{selectedWorker.id})
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsBlockOpen(false)
                  setSelectedWorker(null)
                }}
                className="text-neutral-450 cursor-pointer rounded-md outline-none hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleBlockSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label
                  htmlFor="block-type-select"
                  className="text-[12px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500"
                >
                  Block Category Type
                </label>
                <select
                  id="block-type-select"
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value)}
                  className="h-9 w-full cursor-pointer rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-bold outline-none dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
                >
                  <option value="TRANSFERRED">Transferred</option>
                  <option value="RETIRED">Retired</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="TERMINATED">Terminated</option>
                  <option value="DISMISSED">Dismissed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="block-reason-textarea"
                  className="text-[12px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500"
                >
                  Block Reason Remarks
                </label>
                <textarea
                  id="block-reason-textarea"
                  required
                  placeholder="Enter detailed reason for blocking this worker account..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-rose-500 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
                />
              </div>

              <div className="dark:border-neutral-850 mt-4 flex items-center justify-end gap-2 border-t border-neutral-100 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsBlockOpen(false)
                    setSelectedWorker(null)
                  }}
                  className="h-8 cursor-pointer dark:border-neutral-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={blockMutation.isPending}
                  className="h-8 bg-rose-600 text-xs font-black tracking-wider text-white uppercase hover:bg-rose-500"
                >
                  {blockMutation.isPending ? 'Blocking...' : 'Confirm Block'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
