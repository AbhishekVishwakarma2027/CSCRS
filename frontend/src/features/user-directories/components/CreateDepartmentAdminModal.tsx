import React, { useState } from 'react'
import { X, Building2, User, Mail, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useCreateDepartmentAdminMutation } from '../hooks/use-user-directories'
import { useDepartmentsQuery } from '@/features/departments/hooks/use-departments'

interface CreateDepartmentAdminModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateDepartmentAdminModal({ isOpen, onClose }: CreateDepartmentAdminModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department_id: '',
  })

  const createMutation = useCreateDepartmentAdminMutation()
  const { data: departments = [], isLoading: isLoadingDepts } = useDepartmentsQuery()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.department_id) {
      toast.error('Please fill in all fields.')
      return
    }

    try {
      await createMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        department_id: Number(formData.department_id),
      })
      toast.success('Department Admin created successfully.')
      setFormData({ name: '', email: '', department_id: '' })
      onClose()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to create Department Admin.')
    }
  }

  return (
    <>
      <div
        className="animate-in fade-in fixed inset-0 z-50 bg-neutral-900/60 transition-opacity duration-300 dark:bg-black/80"
        onClick={onClose}
      />
      <div
        role="dialog"
        className="animate-in slide-in-from-bottom-[5%] fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl transition-all duration-300 dark:border dark:border-neutral-800 dark:bg-[#1C1C1E]"
      >
        <div className="dark:border-neutral-850 flex items-center justify-between border-b border-neutral-100 p-4">
          <h2 className="dark:text-blue-450 flex items-center gap-2 text-lg font-black tracking-wider text-[#0A3C7D] uppercase">
            <ShieldAlert className="h-5 w-5" />
            Create Department Admin
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="text-neutral-450 mb-1.5 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
                className="w-full rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-9 text-[13px] font-bold outline-none focus:border-[#0A3C7D] focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
              />
            </div>
          </div>

          <div>
            <label className="text-neutral-450 mb-1.5 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@department.gov"
                className="w-full rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-9 text-[13px] font-bold outline-none focus:border-[#0A3C7D] focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
              />
            </div>
          </div>

          <div>
            <label className="text-neutral-450 mb-1.5 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
              Assign Department
            </label>
            <div className="relative">
              <Building2 className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                disabled={isLoadingDepts}
                className="w-full cursor-pointer appearance-none rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-9 text-[13px] font-bold outline-none focus:border-[#0A3C7D] focus:ring-1 focus:ring-[#0A3C7D] disabled:opacity-50 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
              >
                <option value="">Select a department...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="dark:border-neutral-850 flex items-center justify-end gap-3 border-t border-neutral-100 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-[13px] font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-[#0A3C7D] text-[13px] font-bold text-white hover:bg-[#0A3C7D]/90 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Admin'}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
