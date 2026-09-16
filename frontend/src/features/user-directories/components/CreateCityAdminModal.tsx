import React, { useState } from 'react'
import { X, User, Mail, Phone, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useCreateCityAdminMutation } from '../hooks/use-user-directories'

interface CreateCityAdminModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateCityAdminModal({ isOpen, onClose }: CreateCityAdminModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })

  const createMutation = useCreateCityAdminMutation()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Please enter name and email.')
      return
    }

    try {
      await createMutation.mutateAsync({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
      })
      toast.success(
        `City Administrator ${formData.name} created successfully. Activation email sent.`
      )
      setFormData({ name: '', email: '', phone: '' })
      onClose()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to create City Administrator.')
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
            <ShieldCheck className="h-5 w-5" />
            Create City Administrator
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
                placeholder="cityadmin@city.gov"
                className="w-full rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-9 text-[13px] font-bold outline-none focus:border-[#0A3C7D] focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
              />
            </div>
          </div>

          <div>
            <label className="text-neutral-450 mb-1.5 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1234567890"
                className="w-full rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-9 text-[13px] font-bold outline-none focus:border-[#0A3C7D] focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
              />
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
              {createMutation.isPending ? 'Creating...' : 'Create City Admin'}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
