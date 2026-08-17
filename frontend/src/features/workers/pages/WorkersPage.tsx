import React, { useState } from 'react'
import {
  Contact,
  AlertTriangle,
  UserPlus,
  X,
  Mail,
  Phone,
  ShieldCheck,
  Briefcase,
  Sliders,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  useInviteWorkerMutation,
  useActivateWorkerMutation,
  useDeactivateWorkerMutation,
  useBlockWorkerMutation,
  useUnblockWorkerMutation,
} from '../hooks/use-workers'

export default function WorkersPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [employeeCode, setEmployeeCode] = useState('')
  const [designation, setDesignation] = useState('')

  // Manual actions state
  const [targetWorkerId, setTargetWorkerId] = useState('')
  const [isBlockOpen, setIsBlockOpen] = useState(false)
  const [blockType, setBlockType] = useState('TRANSFERRED')
  const [blockReason, setBlockReason] = useState('')

  // Mutations
  const inviteMutation = useInviteWorkerMutation()
  const activateMutation = useActivateWorkerMutation()
  const deactivateMutation = useDeactivateWorkerMutation()
  const blockMutation = useBlockWorkerMutation()
  const unblockMutation = useUnblockWorkerMutation()

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

  const handleActivate = async () => {
    const id = Number(targetWorkerId)
    if (isNaN(id) || id <= 0) {
      toast.error('Please enter a valid Worker ID.')
      return
    }
    try {
      await activateMutation.mutateAsync(id)
      toast.success(`Worker #${id} account activated successfully!`)
    } catch (err) {
      console.error(err)
      const apiError = err as { response?: { data?: { detail?: string } } }
      toast.error(apiError.response?.data?.detail || 'Failed to activate worker.')
    }
  }

  const handleDeactivate = async () => {
    const id = Number(targetWorkerId)
    if (isNaN(id) || id <= 0) {
      toast.error('Please enter a valid Worker ID.')
      return
    }
    try {
      await deactivateMutation.mutateAsync(id)
      toast.success(`Worker #${id} account deactivated successfully.`)
    } catch (err) {
      console.error(err)
      const apiError = err as { response?: { data?: { detail?: string } } }
      toast.error(apiError.response?.data?.detail || 'Failed to deactivate worker.')
    }
  }

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = Number(targetWorkerId)
    if (isNaN(id) || id <= 0) {
      toast.error('Please enter a valid Worker ID.')
      return
    }
    if (!blockReason.trim()) {
      toast.error('Please enter a block reason.')
      return
    }
    try {
      await blockMutation.mutateAsync({
        workerId: id,
        blockType,
        reason: blockReason,
      })
      toast.success(`Worker #${id} has been blocked.`)
      setIsBlockOpen(false)
      setBlockReason('')
    } catch (err) {
      console.error(err)
      const apiError = err as { response?: { data?: { detail?: string } } }
      toast.error(apiError.response?.data?.detail || 'Failed to block worker.')
    }
  }

  const handleUnblock = async () => {
    const id = Number(targetWorkerId)
    if (isNaN(id) || id <= 0) {
      toast.error('Please enter a valid Worker ID.')
      return
    }
    try {
      await unblockMutation.mutateAsync(id)
      toast.success(`Worker #${id} has been unblocked.`)
    } catch (err) {
      console.error(err)
      const apiError = err as { response?: { data?: { detail?: string } } }
      toast.error(apiError.response?.data?.detail || 'Failed to unblock worker.')
    }
  }

  const isActionsDisabled = !targetWorkerId || isNaN(Number(targetWorkerId))

  return (
    <div className="space-y-6 pb-10 text-left select-none">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
        <div className="flex shrink-0 flex-col gap-1.5">
          <h1 className="text-neutral-850 text-2xl font-black tracking-tight dark:text-white">
            Field Force Directory
          </h1>
          <p className="text-[13px] leading-relaxed font-semibold text-neutral-500 dark:text-neutral-400">
            Invite, block/unblock, and audit operational field workers registered in your municipal
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

      {/* Backend Listing Offline Alert */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-950/20 dark:bg-amber-950/5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
        <div className="space-y-1">
          <h4 className="text-xs font-black tracking-wider text-amber-700 uppercase dark:text-amber-400">
            Worker Directory Offline (API Capability Gap)
          </h4>
          <p className="text-[12px] leading-relaxed font-semibold text-neutral-600 dark:text-neutral-400">
            The worker list/directory search is currently offline because the backend lacks a
            general workers listing endpoint. However, you can still register new field force
            officers by clicking the <strong>Invite Field Worker</strong> action.
          </p>
        </div>
      </div>

      {/* Manual Status Actions by ID */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#1C1C1E]">
          <h3 className="text-neutral-450 mb-4 flex items-center gap-1.5 text-xs font-black tracking-wider uppercase dark:text-neutral-500">
            <Sliders className="h-4 w-4 text-[#0A3C7D] dark:text-blue-400" />
            Worker Administrative Controls
          </h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="worker-id-control"
                className="text-[10px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500"
              >
                Worker ID
              </label>
              <input
                id="worker-id-control"
                type="number"
                min="1"
                placeholder="Enter Worker ID (e.g. 5)"
                value={targetWorkerId}
                onChange={(e) => setTargetWorkerId(e.target.value)}
                className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-xs font-semibold outline-none focus:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isActionsDisabled || activateMutation.isPending}
                onClick={handleActivate}
                className="dark:border-neutral-850 h-8 text-[11px] font-black tracking-wider uppercase"
              >
                {activateMutation.isPending ? 'Activating...' : 'Activate'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isActionsDisabled || deactivateMutation.isPending}
                onClick={handleDeactivate}
                className="dark:border-neutral-850 h-8 text-[11px] font-black tracking-wider uppercase"
              >
                {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isActionsDisabled || unblockMutation.isPending}
                onClick={handleUnblock}
                className="dark:border-neutral-850 h-8 text-[11px] font-black tracking-wider uppercase"
              >
                {unblockMutation.isPending ? 'Unblocking...' : 'Unblock'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isActionsDisabled}
                onClick={() => setIsBlockOpen(true)}
                className="border-rose-250 h-8 text-[11px] font-black tracking-wider text-rose-600 uppercase hover:bg-rose-50 dark:border-rose-950/20 dark:hover:bg-rose-950/10"
              >
                Block
              </Button>
            </div>
          </div>
        </Card>

        {/* Directory Listing Status */}
        <div className="flex flex-col justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/20 p-5 dark:border-neutral-800">
          <Contact className="text-neutral-450 dark:text-neutral-550 mx-auto h-8 w-8" />
          <span className="text-neutral-550 mt-2 text-center text-xs font-bold dark:text-neutral-400">
            Directory Profile Listing Restricted
          </span>
          <p className="mt-1 text-center text-[11px] font-medium text-neutral-400">
            Workers are auto-scheduled in background assignment workloads once they activate their
            invitation links.
          </p>
        </div>
      </div>

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
                <label className="text-[10px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
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
                <label className="text-[10px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
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
                <label className="text-[10px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
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
                  <label className="text-[10px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
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
                  <label className="text-[10px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
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
      {isBlockOpen && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 duration-200 dark:bg-black/80">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl dark:border-neutral-800 dark:bg-[#1C1C1E]">
            <div className="dark:border-neutral-850 flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="flex items-center gap-1.5 text-sm font-black tracking-wider text-rose-600 uppercase">
                <AlertTriangle className="h-4.5 w-4.5" />
                Block Worker #{targetWorkerId}
              </h3>
              <button
                type="button"
                onClick={() => setIsBlockOpen(false)}
                className="text-neutral-450 cursor-pointer rounded-md outline-none hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleBlockSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label
                  htmlFor="block-type-select"
                  className="text-[10px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500"
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
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="block-reason-textarea"
                  className="text-[10px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500"
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
                  onClick={() => setIsBlockOpen(false)}
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
