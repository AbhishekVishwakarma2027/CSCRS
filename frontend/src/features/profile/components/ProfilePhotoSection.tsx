import React, { useRef } from 'react'
import { Image as ImageIcon, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useUploadProfilePhotoMutation, useDeleteProfilePhotoMutation } from '../hooks/use-profile'
import type { ProfileResponse } from '../types'
import { getMediaUrl } from '@/utils/format'

interface ProfilePhotoSectionProps {
  profile: ProfileResponse
}

export function ProfilePhotoSection({ profile }: ProfilePhotoSectionProps) {
  const uploadMutation = useUploadProfilePhotoMutation()
  const deleteMutation = useDeleteProfilePhotoMutation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB.')
      return
    }

    try {
      await uploadMutation.mutateAsync(file)
      toast.success('Profile photo uploaded successfully.')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to upload photo.')
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync()
      toast.success('Profile photo deleted.')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to delete photo.')
    }
  }

  return (
    <div className="dark:border-neutral-850 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-6 dark:bg-[#1E1E20]">
      <h3 className="dark:border-neutral-850 flex items-center gap-1.5 border-b border-neutral-200/40 pb-4 text-[18px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
        <ImageIcon className="h-4 w-4 shrink-0 text-[#0A3C7D] dark:text-blue-500" />
        Profile Photo
      </h3>

      <div className="mt-5 flex flex-col items-center gap-4">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          {profile.profile_image ? (
            <img
              src={getMediaUrl(profile.profile_image)}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl font-black text-neutral-500 dark:text-neutral-400">
              {profile.name?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <Button
            variant="outline"
            size="xs"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="flex h-8 items-center gap-1.5 px-3 text-xs font-bold"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>

          {profile.profile_image && (
            <Button
              variant="outline"
              size="xs"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex h-8 items-center gap-1.5 border-rose-200 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
