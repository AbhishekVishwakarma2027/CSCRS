import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Upload, Calendar, Newspaper, X } from 'lucide-react'
import {
  publicUpdatesAdminService,
  type CreateUpdatePayload,
} from '../services/public-updates-admin.service'
import type { PublicUpdate } from '@/features/public/services/public.service'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function PublicUpdatesManagementWidget() {
  const [updates, setUpdates] = useState<PublicUpdate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingUpdate, setEditingUpdate] = useState<PublicUpdate | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Form states
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Press')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const loadUpdates = () => {
    setIsLoading(true)
    publicUpdatesAdminService
      .getAdminUpdates(1, 50)
      .then((res) => {
        setUpdates(res.items)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }

  useEffect(() => {
    loadUpdates()
  }, [])

  const resetForm = () => {
    setTitle('')
    setCategory('Press')
    setDescription('')
    setContent('')
    setThumbnailUrl('')
    setIsPublished(false)
    setEditingUpdate(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setIsCreateModalOpen(true)
  }

  const handleOpenEdit = (update: PublicUpdate) => {
    setEditingUpdate(update)
    setTitle(update.title)
    setCategory(update.category)
    setDescription(update.description || '')
    setContent(update.content)
    setThumbnailUrl(update.thumbnail_url || '')
    setIsPublished(update.is_published)
    setIsCreateModalOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const res = await publicUpdatesAdminService.uploadThumbnail(file)
      setThumbnailUrl(res.thumbnail_url)
      toast.success('Thumbnail uploaded successfully.')
    } catch {
      toast.error('Failed to upload thumbnail image.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingUpdate) {
        await publicUpdatesAdminService.updateUpdate(editingUpdate.id, {
          title,
          category,
          description,
          content,
          thumbnail_url: thumbnailUrl || undefined,
        })
        toast.success('Update article modified successfully.')
      } else {
        const payload: CreateUpdatePayload = {
          title,
          category,
          description,
          content,
          thumbnail_url: thumbnailUrl || undefined,
          is_published: isPublished,
        }
        await publicUpdatesAdminService.createUpdate(payload)
        toast.success('Public update created successfully.')
      }
      setIsCreateModalOpen(false)
      resetForm()
      loadUpdates()
    } catch {
      toast.error('Failed to save update article.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTogglePublish = async (update: PublicUpdate) => {
    try {
      await publicUpdatesAdminService.togglePublish(update.id, !update.is_published)
      toast.success(
        !update.is_published ? 'Article published publicly.' : 'Article set to draft/unpublished.'
      )
      loadUpdates()
    } catch {
      toast.error('Failed to update publish status.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this public update article?')) return
    setDeletingId(id)
    try {
      await publicUpdatesAdminService.deleteUpdate(id)
      toast.success('Article deleted successfully.')
      loadUpdates()
    } catch {
      toast.error('Failed to delete article.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-neutral-800">Public Updates / News & Press</h3>
          <p className="text-xs text-neutral-500">
            Manage public platform announcements, SOP updates, and press releases.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-primary hover:bg-primary-dark inline-flex items-center space-x-2 text-xs font-bold text-white"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Update</span>
        </Button>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-neutral-400">Loading public updates...</div>
        ) : updates.length === 0 ? (
          <div className="p-12 text-center">
            <Newspaper className="mx-auto h-10 w-10 text-neutral-300" />
            <p className="mt-2 text-sm font-bold text-neutral-700">No public updates created yet</p>
            <p className="text-xs text-neutral-400">
              Click "Create New Update" to publish news articles to the public landing page.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-neutral-150 border-b bg-neutral-50 text-[10px] font-extrabold tracking-wider text-neutral-500 uppercase">
              <tr>
                <th className="px-6 py-4">Title & Category</th>
                <th className="px-6 py-4">Read Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-neutral-150 divide-y font-medium text-neutral-700">
              {updates.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50/50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-neutral-900">{item.title}</div>
                    <div className="mt-0.5 flex items-center space-x-2 text-[10px] text-neutral-400">
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-semibold text-neutral-600">
                        {item.category}
                      </span>
                      <span>•</span>
                      <span>/{item.slug}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{item.read_time_minutes} min read</td>
                  <td className="px-6 py-4">
                    {item.is_published ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700">
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold text-amber-700">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-neutral-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      <span>
                        {new Date(item.published_at || item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleTogglePublish(item)}
                        title={item.is_published ? 'Unpublish' : 'Publish'}
                        className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                      >
                        {item.is_published ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4 text-emerald-600" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Article"
                        className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        title="Delete Article"
                        className="rounded-lg p-1.5 text-neutral-500 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal Overlay */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="border-neutral-150 flex items-center justify-between border-b pb-3">
              <h4 className="text-lg font-black text-neutral-900">
                {editingUpdate ? 'Edit News Update' : 'Create Public News Update'}
              </h4>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700">Article Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Resolution SLAs Updated for Sanitation Department"
                  className="focus:border-primary mt-1 w-full rounded-xl border border-neutral-300 px-3.5 py-2 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="focus:border-primary mt-1 w-full rounded-xl border border-neutral-300 px-3.5 py-2 focus:outline-none"
                  >
                    <option value="Press">Press</option>
                    <option value="Announcements">Announcements</option>
                    <option value="System SLA">System SLA</option>
                    <option value="SOP Update">SOP Update</option>
                    <option value="Public Notice">Public Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700">Thumbnail Image</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="thumbnail-upload-input"
                    />
                    <label
                      htmlFor="thumbnail-upload-input"
                      className="cursor-pointer rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 font-semibold text-neutral-600 hover:bg-neutral-100"
                    >
                      <Upload className="mr-1 inline h-3.5 w-3.5" />
                      {uploadingImage ? 'Uploading...' : 'Choose File'}
                    </label>
                    {thumbnailUrl && (
                      <span className="truncate text-[11px] font-bold text-emerald-600">
                        Uploaded ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700">
                  Brief Description / Subtitle
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short summary preview shown on landing page cards..."
                  className="focus:border-primary mt-1 w-full rounded-xl border border-neutral-300 px-3.5 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700">Full Article Content *</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  placeholder="Full article content text..."
                  className="focus:border-primary mt-1 w-full rounded-xl border border-neutral-300 p-3.5 focus:outline-none"
                  required
                />
              </div>

              {!editingUpdate && (
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="publish-now-check"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="text-primary h-4 w-4 rounded border-neutral-300"
                  />
                  <label htmlFor="publish-now-check" className="font-bold text-neutral-700">
                    Publish immediately to public landing page
                  </label>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary-dark text-xs font-bold text-white"
                >
                  {isSubmitting ? 'Saving...' : editingUpdate ? 'Save Changes' : 'Create Article'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
