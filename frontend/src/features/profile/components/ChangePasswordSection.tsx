import React, { useState } from 'react'
import { Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useChangePasswordMutation } from '../hooks/use-profile'

export interface ChangePasswordSectionProps {
  isEditing: boolean
}

export function ChangePasswordSection({ isEditing }: ChangePasswordSectionProps) {
  const mutation = useChangePasswordMutation()
  const [isExpanded, setIsExpanded] = useState(false)

  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })

  React.useEffect(() => {
    if (!isEditing) {
      setIsExpanded(false)
      setFormData({ old_password: '', new_password: '', confirm_password: '' })
    }
  }, [isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.old_password || !formData.new_password || !formData.confirm_password) {
      toast.error('Please fill in all password fields.')
      return
    }

    if (formData.new_password !== formData.confirm_password) {
      toast.error('New passwords do not match.')
      return
    }

    try {
      await mutation.mutateAsync(formData)
      toast.success('Password changed successfully.')
      setFormData({ old_password: '', new_password: '', confirm_password: '' })
      setIsExpanded(false)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to change password.')
    }
  }

  return (
    <div className="dark:border-neutral-850 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-6 dark:bg-[#1E1E20]">
      <h3 className="dark:border-neutral-850 flex items-center gap-1.5 border-b border-neutral-200/40 pb-4 text-[18px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
        <Key className="h-4 w-4 shrink-0 text-[#0A3C7D] dark:text-blue-500" />
        Security
      </h3>

      {!isExpanded ? (
        <div className="mt-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsExpanded(true)}
            className="h-8 border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Change Password
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="animate-in fade-in slide-in-from-top-2 mt-5 space-y-4 duration-300"
        >
          <div>
            <label className="text-neutral-450 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
              Current Password
            </label>
            <input
              id="current-password"
              type="password"
              value={formData.old_password}
              onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
              className="mt-1.5 block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-bold outline-none focus:ring-2 focus:ring-[#0A3C7D]/20 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
            />
          </div>

          <div>
            <label className="text-neutral-450 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
              New Password
            </label>
            <input
              type="password"
              value={formData.new_password}
              onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
              className="mt-1.5 block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-bold outline-none focus:ring-2 focus:ring-[#0A3C7D]/20 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
            />
          </div>

          <div>
            <label className="text-neutral-450 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
              Confirm New Password
            </label>
            <input
              type="password"
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              className="mt-1.5 block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-bold outline-none focus:ring-2 focus:ring-[#0A3C7D]/20 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsExpanded(false)
                setFormData({ old_password: '', new_password: '', confirm_password: '' })
              }}
              className="h-8 px-4 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="h-8 bg-[#0A3C7D] px-4 text-xs font-bold text-white hover:bg-[#0A3C7D]/90 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {mutation.isPending ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
