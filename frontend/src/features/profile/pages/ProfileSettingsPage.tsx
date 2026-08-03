import React, { useState, useEffect } from 'react'
import { User, Mail, Phone, Shield, ShieldCheck, Briefcase } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useMyProfileQuery, useUpdateProfileMutation } from '../hooks/use-profile'
import { Button } from '@/components/ui/button'
import { RoleBadge } from '@/components/layout/RoleBadge'
import { formatDate } from '@/utils/format'
import { toast } from 'sonner'

export default function ProfileSettingsPage() {
  useAuth()
  const { data: profile, isLoading, error } = useMyProfileQuery()
  const updateProfileMutation = useUpdateProfileMutation()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  })

  // Sync form data when profile is loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
      })
    }
  }, [profile])

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        name: formData.name,
        phone: formData.phone || undefined,
      })
      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e.response?.data?.detail || 'Failed to update profile')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-neutral-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0A3C7D] border-t-transparent" />
          <span className="text-[13px] font-bold">Loading profile...</span>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-red-200/60 bg-red-50/20 p-8 text-center dark:border-red-900/40 dark:bg-red-950/5">
        <Shield className="h-8 w-8 text-red-500" />
        <h4 className="text-[13px] font-black tracking-wider text-red-700 uppercase dark:text-red-400">
          Failed to load profile
        </h4>
        <p className="text-[13px] font-semibold text-red-600/80 dark:text-red-400/80">
          {error?.message || 'Unable to retrieve your user profile.'}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10 text-left">
      {/* Header */}
      <div className="dark:border-neutral-850 flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="dark:text-blue-450 flex items-center gap-1.5 text-2xl font-black tracking-widest text-[#0A3C7D] uppercase">
            <User className="h-5 w-5" />
            My Profile & Settings
          </h2>
          <p className="text-neutral-450 mt-1 text-[13px] font-semibold dark:text-neutral-500">
            Manage your personal information, contact details, and account security.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        {/* Left Column - Main Details */}
        <div className="space-y-6">
          {/* General Information Card */}
          <div className="dark:border-neutral-850 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-6 dark:bg-[#1E1E20]">
            <div className="dark:border-neutral-850 flex items-center justify-between border-b border-neutral-200/40 pb-4">
              <h3 className="flex items-center gap-1.5 text-[18px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                <User className="h-4 w-4 shrink-0 text-[#0A3C7D] dark:text-blue-500" />
                Personal Information
              </h3>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setIsEditing(true)}
                  className="h-8 px-3 text-xs font-bold"
                >
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        name: profile.name || '',
                        phone: profile.phone || '',
                      })
                    }}
                    className="h-8 px-3 text-xs font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="xs"
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                    className="h-8 bg-[#0A3C7D] px-3 text-xs font-bold text-white hover:bg-[#0A3C7D]/90 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-5 space-y-4">
              {/* Name */}
              <div>
                <label className="text-neutral-450 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1.5 block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-bold outline-none focus:ring-2 focus:ring-[#0A3C7D]/20 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
                  />
                ) : (
                  <p className="mt-1 text-[15px] font-extrabold text-neutral-800 dark:text-neutral-200">
                    {profile.name}
                  </p>
                )}
              </div>

              {/* Email (Read Only) */}
              <div>
                <label className="text-neutral-450 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Email Address (Verified)
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex h-9 w-full items-center rounded-lg border border-neutral-200 bg-neutral-100/50 px-3 text-[13px] font-bold text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
                    <Mail className="mr-2 h-4 w-4" />
                    {profile.email}
                  </div>
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-neutral-450 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="mt-1.5 block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-bold outline-none focus:ring-2 focus:ring-[#0A3C7D]/20 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
                  />
                ) : (
                  <div className="mt-1.5 flex items-center gap-2 text-[13px] font-bold text-neutral-700 dark:text-neutral-300">
                    <Phone className="h-4 w-4 text-neutral-400" />
                    {profile.phone || 'No phone number provided'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Status & Meta */}
        <div className="space-y-6">
          {/* Work Status Card */}
          <div className="dark:border-neutral-850 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-6 dark:bg-[#1E1E20]">
            <h3 className="dark:border-neutral-850 flex items-center gap-1.5 border-b border-neutral-200/40 pb-4 text-[18px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
              <Briefcase className="h-4 w-4 shrink-0 text-[#0A3C7D] dark:text-blue-500" />
              Employment Status
            </h3>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-neutral-450 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
                  System Role
                </label>
                <div className="mt-1.5">
                  <RoleBadge role={profile.role} />
                </div>
              </div>

              {profile.designation && (
                <div>
                  <label className="text-neutral-450 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
                    Designation
                  </label>
                  <p className="mt-1 text-[13px] font-bold text-neutral-800 dark:text-neutral-200">
                    {profile.designation}
                  </p>
                </div>
              )}

              {profile.employee_code && (
                <div>
                  <label className="text-neutral-450 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
                    Employee Code
                  </label>
                  <p className="mt-1 font-mono text-[13px] font-bold text-neutral-800 dark:text-neutral-200">
                    {profile.employee_code}
                  </p>
                </div>
              )}

              <div>
                <label className="text-neutral-450 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Account Status
                </label>
                <span
                  className={`mt-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                    profile.is_active
                      ? 'dark:text-emerald-450 border-emerald-200 bg-emerald-100/60 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20'
                      : 'border-neutral-200 bg-neutral-100 text-neutral-600 dark:border-neutral-700/40 dark:bg-neutral-800/40 dark:text-neutral-400'
                  }`}
                >
                  {profile.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {profile.joined_at && (
                <div>
                  <label className="text-neutral-450 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
                    Joined Date
                  </label>
                  <p className="mt-1 text-[13px] font-bold text-neutral-700 dark:text-neutral-300">
                    {formatDate(profile.joined_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
