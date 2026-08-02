import React, { useState } from 'react'
import { X, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/features/reports/components/ConfirmationDialog'
import { useCreateDepartmentMutation } from '../hooks/use-departments'
import { toast } from 'sonner'

interface CreateDepartmentModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateDepartmentModal({ isOpen, onClose }: CreateDepartmentModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const createMutation = useCreateDepartmentMutation()

  if (!isOpen) return null

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 2) {
      toast.error('Department name must be at least 2 characters.')
      return
    }
    setIsConfirmOpen(true)
  }

  const handleConfirmSubmit = async () => {
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      toast.success(`Department "${name}" created successfully!`)
      setIsConfirmOpen(false)
      setName('')
      setDescription('')
      onClose()
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } }
      toast.error(apiError.response?.data?.detail || 'Failed to create department.')
    }
  }

  return (
    <>
      <div className="animate-in fade-in fixed inset-0 z-40 flex items-center justify-center bg-neutral-900/60 p-4 duration-200 dark:bg-black/80">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-dept-title"
          className="dark:text-neutral-350 w-full max-w-md space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 text-xs font-bold text-neutral-700 shadow-2xl dark:border-neutral-800 dark:bg-[#1C1C1E]"
        >
          <div className="dark:border-neutral-850 flex items-center justify-between border-b border-neutral-100 pb-2">
            <h3
              id="create-dept-title"
              className="dark:text-blue-450 flex items-center gap-1.5 text-sm font-black tracking-wider text-[#0A3C7D] uppercase"
            >
              <Building2 className="h-4.5 w-4.5" />
              Register New Department
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-450 dark:hover:text-neutral-350 cursor-pointer rounded-md outline-none hover:text-neutral-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="dept-name"
                className="text-neutral-450 text-[11px] font-black uppercase dark:text-neutral-500"
              >
                Department Name (Min 2 characters)
              </label>
              <input
                id="dept-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Roads & Highways"
                required
                className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 font-sans text-xs font-bold outline-none focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#1C1C1E]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="dept-description"
                className="text-neutral-450 text-[11px] font-black uppercase dark:text-neutral-500"
              >
                Description / Scope of Work (Optional)
              </label>
              <textarea
                id="dept-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter summary of civic complaints and operations managed by this department..."
                rows={4}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 font-sans text-xs font-bold outline-none focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#1C1C1E]"
              />
            </div>

            <div className="dark:border-neutral-850 flex items-center justify-end gap-2 border-t border-neutral-100 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-8 cursor-pointer dark:border-neutral-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={name.trim().length < 2}
                className="h-8 cursor-pointer bg-[#0A3C7D] text-white hover:bg-[#0A3C7D]/90"
              >
                Create
              </Button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title="Confirm Department Creation"
        description={`Are you sure you want to register "${name}" as a new municipal department?`}
        confirmLabel="Yes, Register"
        cancelLabel="Go Back"
        isDanger={false}
        isSubmitting={createMutation.isPending}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  )
}
