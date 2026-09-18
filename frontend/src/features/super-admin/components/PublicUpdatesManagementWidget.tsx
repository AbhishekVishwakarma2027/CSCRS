import { useState, useMemo } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Calendar,
  Newspaper,
  X,
  Search,
  ExternalLink,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileImage,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/features/reports/components/ConfirmationDialog'
import type { PublicUpdate } from '@/features/public/services/public.service'
import type { CreateUpdatePayload } from '../services/public-updates-admin.service'
import {
  useAdminPublicUpdatesQuery,
  useCreatePublicUpdateMutation,
  useUpdatePublicUpdateMutation,
  useTogglePublishPublicUpdateMutation,
  useDeletePublicUpdateMutation,
} from '../hooks/use-public-updates-admin'

export function PublicUpdatesManagementWidget() {
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Filter / Search states
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL')

  // Modals & Drawers state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingUpdate, setEditingUpdate] = useState<PublicUpdate | null>(null)
  const [previewUpdate, setPreviewUpdate] = useState<PublicUpdate | null>(null)
  const [deletingTarget, setDeletingTarget] = useState<PublicUpdate | null>(null)

  // Form states
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Press')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [readTimeMinutes, setReadTimeMinutes] = useState<string>('')
  const [isPublished, setIsPublished] = useState(false)

  // React Query Hooks
  const { data, isLoading, isError, refetch } = useAdminPublicUpdatesQuery(page, pageSize)
  const createMutation = useCreatePublicUpdateMutation()
  const updateMutation = useUpdatePublicUpdateMutation()
  const togglePublishMutation = useTogglePublishPublicUpdateMutation()
  const deleteMutation = useDeletePublicUpdateMutation()
  // Client-side filtering over fetched page items
  const filteredUpdates = useMemo(() => {
    const rawUpdates = data?.items || []
    return rawUpdates.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PUBLISHED' && item.is_published) ||
        (statusFilter === 'DRAFT' && !item.is_published)

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [data?.items, searchTerm, categoryFilter, statusFilter])

  const resetForm = () => {
    setTitle('')
    setCategory('Press')
    setDescription('')
    setContent('')
    setThumbnailUrl('')
    setReadTimeMinutes('')
    setIsPublished(false)
    setEditingUpdate(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setIsFormModalOpen(true)
  }

  const handleOpenEdit = (update: PublicUpdate) => {
    setEditingUpdate(update)
    setTitle(update.title)
    setCategory(update.category)
    setDescription(update.description || '')
    setContent(update.content)
    setThumbnailUrl(update.thumbnail_url || '')
    setReadTimeMinutes(update.read_time_minutes ? String(update.read_time_minutes) : '')
    setIsPublished(update.is_published)
    setIsFormModalOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const res = await uploadThumbnailMutation.mutateAsync(file)
      setThumbnailUrl(res.thumbnail_url)
      toast.success('Thumbnail image uploaded successfully.')
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail
      toast.error(errorMsg || 'Failed to upload thumbnail image.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      toast.error('Article title and content are required.')
      return
    }

    const parsedReadTime = readTimeMinutes ? parseInt(readTimeMinutes, 10) : undefined

    try {
      if (editingUpdate) {
        await updateMutation.mutateAsync({
          updateId: editingUpdate.id,
          payload: {
            title: title.trim(),
            category,
            description: description.trim() || undefined,
            content: content.trim(),
            thumbnail_url: thumbnailUrl || undefined,
            read_time_minutes: parsedReadTime,
          },
        })
        toast.success('Public update article modified successfully.')
      } else {
        const payload: CreateUpdatePayload = {
          title: title.trim(),
          category,
          description: description.trim() || undefined,
          content: content.trim(),
          thumbnail_url: thumbnailUrl || undefined,
          read_time_minutes: parsedReadTime,
          is_published: isPublished,
        }
        await createMutation.mutateAsync(payload)
        toast.success('Public update created successfully.')
      }
      setIsFormModalOpen(false)
      resetForm()
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail
      toast.error(errorMsg || 'Failed to save update article.')
    }
  }

  const handleTogglePublish = async (update: PublicUpdate) => {
    try {
      await togglePublishMutation.mutateAsync({
        updateId: update.id,
        isPublished: !update.is_published,
      })
      toast.success(
        !update.is_published
          ? 'Article published to landing page.'
          : 'Article unpublished/returned to draft.'
      )
    } catch {
      toast.error('Failed to update publication status.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingTarget) return
    try {
      await deleteMutation.mutateAsync(deletingTarget.id)
      toast.success('Article deleted successfully.')
      setDeletingTarget(null)
    } catch {
      toast.error('Failed to delete update article.')
    }
  }

  return (
    <div className="space-y-6 select-none">
      {/* ─── MODULE HEADER & PRIMARY ACTION ─────────────────────────── */}
      <div className="flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
        <div>
          <h3 className="text-neutral-850 flex items-center gap-2 text-lg font-black tracking-tight dark:text-white">
            <Newspaper className="h-5 w-5 text-[#0A3C7D] dark:text-blue-400" />
            Public News & Press Management
          </h3>
          <p className="mt-0.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Publish official municipal announcements, platform SOP guidelines, and press updates to
            the public portal.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreate}
          className="flex h-9 shrink-0 items-center gap-2 bg-[#0A3C7D] px-4 text-xs font-black tracking-wider text-white uppercase shadow-xs hover:bg-[#0A3C7D]/90 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Article</span>
        </Button>
      </div>

      {/* ─── FILTER & CONTROL BANNER ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-xs sm:grid-cols-12 dark:border-neutral-800 dark:bg-[#1C1C1E]">
        {/* Search */}
        <div className="relative sm:col-span-6">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by title, slug, or summary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 pr-3 pl-9 text-xs font-semibold text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-[#0A3C7D] dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200"
          />
        </div>

        {/* Category Filter */}
        <div className="sm:col-span-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-3 text-xs font-bold text-neutral-700 outline-none focus:border-[#0A3C7D] dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200"
          >
            <option value="ALL">All Categories</option>
            <option value="Press">Press</option>
            <option value="Announcements">Announcements</option>
            <option value="System SLA">System SLA</option>
            <option value="SOP Update">SOP Update</option>
            <option value="Public Notice">Public Notice</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'PUBLISHED' | 'DRAFT')}
            className="h-9 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-3 text-xs font-bold text-neutral-700 outline-none focus:border-[#0A3C7D] dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published Only</option>
            <option value="DRAFT">Drafts Only</option>
          </select>
        </div>
      </div>

      {/* ─── DATA TABLE & CARD LIST ─────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
        {isLoading ? (
          <div className="flex h-52 flex-col items-center justify-center gap-2">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#0A3C7D] border-t-transparent dark:border-blue-500" />
            <span className="text-xs font-bold text-neutral-500">Loading public updates...</span>
          </div>
        ) : isError ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 p-6 text-center">
            <Newspaper className="h-8 w-8 text-rose-500" />
            <span className="text-xs font-bold text-rose-600">Failed to load public updates.</span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => refetch()}
              className="h-7"
            >
              Retry Connection
            </Button>
          </div>
        ) : filteredUpdates.length === 0 ? (
          <div className="flex h-52 flex-col items-center justify-center gap-2 p-6 text-center">
            <Newspaper className="h-10 w-10 text-neutral-300 dark:text-neutral-600" />
            <p className="text-xs font-extrabold text-neutral-700 dark:text-neutral-300">
              No public update articles match your criteria
            </p>
            <p className="text-[11px] font-medium text-neutral-400">
              Try adjusting your search query or create a new public update article.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left text-xs font-bold text-neutral-700 dark:text-neutral-300">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/70 text-[10px] font-black tracking-wider text-neutral-400 uppercase dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-500">
                    <th className="px-5 py-3.5">Article Details</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5 text-center">Read Time</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="dark:divide-neutral-850 divide-y divide-neutral-100">
                  {filteredUpdates.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-neutral-50/40 dark:hover:bg-neutral-900/20"
                    >
                      {/* Title & Thumbnail */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {item.thumbnail_url ? (
                            <img
                              src={item.thumbnail_url}
                              alt={item.title}
                              className="h-11 w-11 shrink-0 rounded-lg border border-neutral-200 object-cover dark:border-neutral-800"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                              <FileImage className="h-5 w-5 text-neutral-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="line-clamp-1 text-xs font-extrabold text-neutral-900 dark:text-white">
                              {item.title}
                            </h4>
                            <p className="mt-0.5 max-w-sm truncate text-[11px] font-semibold text-neutral-400">
                              {item.description || item.content}
                            </p>
                            <p className="mt-0.5 font-mono text-[10px] text-[#0A3C7D] dark:text-blue-400">
                              /{item.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className="inline-block rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-black text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                          {item.category}
                        </span>
                      </td>

                      {/* Read Time */}
                      <td className="px-4 py-3.5 text-center font-extrabold text-neutral-600 dark:text-neutral-400">
                        {item.read_time_minutes} min
                      </td>

                      {/* Published Status */}
                      <td className="px-4 py-3.5 text-center">
                        {item.is_published ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[9px] font-black tracking-wider text-emerald-700 uppercase dark:border-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-400">
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[9px] font-black tracking-wider text-amber-700 uppercase dark:border-amber-950 dark:bg-amber-950/20 dark:text-amber-400">
                            Draft
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                          <span>
                            {new Date(item.published_at || item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Preview Button */}
                          <button
                            type="button"
                            onClick={() => setPreviewUpdate(item)}
                            title="Preview Article"
                            className="cursor-pointer rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Toggle Publish Button */}
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(item)}
                            disabled={togglePublishMutation.isPending}
                            title={
                              item.is_published ? 'Unpublish to Draft' : 'Publish to Public Site'
                            }
                            className="cursor-pointer rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-white"
                          >
                            {item.is_published ? (
                              <EyeOff className="h-4 w-4 text-amber-600" />
                            ) : (
                              <Eye className="h-4 w-4 text-emerald-600" />
                            )}
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Article"
                            className="cursor-pointer rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-white"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeletingTarget(item)}
                            title="Delete Article"
                            className="cursor-pointer rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View (< 768px, e.g. 407px) Card Reflow */}
            <div className="space-y-3 p-3 md:hidden">
              {filteredUpdates.map((item) => (
                <div
                  key={item.id}
                  className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50/50 p-3.5 dark:border-neutral-800 dark:bg-neutral-900/30"
                >
                  <div className="flex items-start gap-3">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="h-14 w-14 shrink-0 rounded-lg border border-neutral-200 object-cover dark:border-neutral-800"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                        <FileImage className="h-6 w-6 text-neutral-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded bg-neutral-200/60 px-1.5 py-0.5 text-[9px] font-black text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                          {item.category}
                        </span>
                        {item.is_published ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                            Published
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                            Draft
                          </span>
                        )}
                      </div>
                      <h4 className="mt-1 text-xs leading-snug font-black break-words text-neutral-900 dark:text-white">
                        {item.title}
                      </h4>
                      <p className="mt-0.5 truncate font-mono text-[10px] text-[#0A3C7D] dark:text-blue-400">
                        /{item.slug}
                      </p>
                    </div>
                  </div>

                  {item.description && (
                    <p className="line-clamp-2 text-[11px] font-semibold text-neutral-500">
                      {item.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between border-t border-neutral-200/80 pt-2 text-[10px] font-bold text-neutral-400 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                      <span>{item.read_time_minutes} min read</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-neutral-400" />
                        {new Date(item.published_at || item.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewUpdate(item)}
                        className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(item)}
                        disabled={togglePublishMutation.isPending}
                        className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        title={item.is_published ? 'Unpublish' : 'Publish'}
                      >
                        {item.is_published ? (
                          <EyeOff className="h-4 w-4 text-amber-600" />
                        ) : (
                          <Eye className="h-4 w-4 text-emerald-600" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTarget(item)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── PAGINATION BAR ────────────────────────────────────────── */}
        {data && data.total_pages > 1 && (
          <div className="flex flex-wrap items-center justify-between border-t border-neutral-100 bg-neutral-50/50 px-4 py-3 text-xs font-semibold text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40">
            <span>
              Showing Page <strong className="text-neutral-800 dark:text-white">{data.page}</strong>{' '}
              of <strong className="text-neutral-800 dark:text-white">{data.total_pages}</strong> (
              {data.total_items} total updates)
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 text-xs font-bold"
              >
                <ChevronLeft className="mr-0.5 h-3.5 w-3.5" /> Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                className="h-7 text-xs font-bold"
              >
                Next <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── CREATE / EDIT MODAL DIALOG ───────────────────────────── */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-900/60 p-4 backdrop-blur-xs dark:bg-black/80">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-[#1C1C1E]">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-neutral-800">
              <div>
                <h4 className="text-base font-black text-neutral-900 dark:text-white">
                  {editingUpdate ? 'Edit News Update Article' : 'Create Public News & Press Update'}
                </h4>
                <p className="text-[11px] font-semibold text-neutral-400">
                  {editingUpdate
                    ? `Updating article #${editingUpdate.id}`
                    : 'Fill in news details to publish on landing page.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs font-bold">
              {/* Title */}
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300">
                  Article Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sanitation Department Resolution SLAs Upgraded"
                  className="mt-1 h-9 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-3.5 text-xs font-semibold text-neutral-800 outline-none focus:border-[#0A3C7D] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
                  required
                />
              </div>

              {/* Category & Thumbnail */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-3.5 text-xs font-bold text-neutral-800 outline-none focus:border-[#0A3C7D] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
                  >
                    <option value="Press">Press</option>
                    <option value="Announcements">Announcements</option>
                    <option value="System SLA">System SLA</option>
                    <option value="SOP Update">SOP Update</option>
                    <option value="Public Notice">Public Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300">
                    Thumbnail Image
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="thumbnail-upload-input"
                    />
                    <label
                      htmlFor="thumbnail-upload-input"
                      className="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 font-extrabold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {uploadThumbnailMutation.isPending ? 'Uploading...' : 'Upload Image'}
                    </label>

                    {thumbnailUrl && (
                      <div className="flex min-w-0 items-center gap-1.5">
                        <img
                          src={thumbnailUrl}
                          alt="Thumbnail preview"
                          className="h-8 w-8 rounded border border-neutral-200 object-cover"
                        />
                        <span className="truncate text-[10px] font-black text-emerald-600">
                          ✓ Uploaded
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300">
                  Brief Subtitle / Card Summary
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short 1-2 sentence preview summary shown on public landing cards..."
                  className="mt-1 h-9 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-3.5 text-xs font-semibold text-neutral-800 outline-none focus:border-[#0A3C7D] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300">
                  Full Article Content *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  placeholder="Write the full article content text here..."
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 p-3.5 text-xs font-semibold text-neutral-800 outline-none focus:border-[#0A3C7D] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
                  required
                />
              </div>

              {/* Read Time (Optional) & Publish Checkbox */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-neutral-700 dark:text-neutral-300">
                    Custom Read Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={readTimeMinutes}
                    onChange={(e) => setReadTimeMinutes(e.target.value)}
                    placeholder="Auto-calculated if left empty"
                    className="mt-1 h-9 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 px-3.5 text-xs font-semibold text-neutral-800 outline-none focus:border-[#0A3C7D] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
                  />
                </div>

                {!editingUpdate && (
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="publish-now-check"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 text-[#0A3C7D]"
                    />
                    <label
                      htmlFor="publish-now-check"
                      className="cursor-pointer text-xs font-bold text-neutral-800 dark:text-neutral-200"
                    >
                      Publish immediately to public landing page
                    </label>
                  </div>
                )}
              </div>

              {/* Form Footer Buttons */}
              <div className="flex justify-end gap-2.5 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setIsFormModalOpen(false)}
                  className="h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="h-8 bg-[#0A3C7D] text-xs font-black tracking-wider text-white uppercase hover:bg-[#0A3C7D]/90 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingUpdate
                      ? 'Save Changes'
                      : 'Create Article'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ARTICLE PREVIEW MODAL ───────────────────────────────────── */}
      {previewUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-900/60 p-4 backdrop-blur-xs dark:bg-black/80">
          <div className="my-8 w-full max-w-3xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-[#1C1C1E]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-black text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  Preview Mode
                </span>
                <span className="font-mono text-xs text-neutral-400">/{previewUpdate.slug}</span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/updates/${previewUpdate.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-bold text-[#0A3C7D] hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-blue-400"
                >
                  <span>Open Public Page</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setPreviewUpdate(null)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Article Content Preview Body */}
            <div className="max-h-[75vh] space-y-6 overflow-y-auto p-6 sm:p-8">
              {previewUpdate.thumbnail_url && (
                <div className="relative h-56 w-full overflow-hidden rounded-xl border border-neutral-200 sm:h-72 dark:border-neutral-800">
                  <img
                    src={previewUpdate.thumbnail_url}
                    alt={previewUpdate.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-neutral-500">
                  <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 font-bold text-[#0A3C7D] dark:border-neutral-800 dark:bg-neutral-900 dark:text-blue-400">
                    {previewUpdate.category}
                  </span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                    <span>
                      {new Date(
                        previewUpdate.published_at || previewUpdate.created_at
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-neutral-400" />
                    <span>{previewUpdate.read_time_minutes} min read</span>
                  </div>
                </div>

                <h2 className="text-xl font-black text-neutral-900 sm:text-2xl dark:text-white">
                  {previewUpdate.title}
                </h2>

                {previewUpdate.description && (
                  <p className="text-sm font-semibold text-neutral-600 italic dark:text-neutral-400">
                    {previewUpdate.description}
                  </p>
                )}

                <div className="space-y-3 border-t border-neutral-100 pt-4 text-xs leading-relaxed text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">
                  {previewUpdate.content.split('\n\n').map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONFIRMATION DIALOG FOR DELETE ─────────────────────────── */}
      <ConfirmationDialog
        isOpen={deletingTarget !== null}
        title="Delete Public Update Article"
        description={`Are you sure you want to delete "${deletingTarget?.title}"? This will remove the news update article permanently from the public landing page and archives.`}
        confirmLabel="Delete Article"
        cancelLabel="Cancel"
        isDanger={true}
        isSubmitting={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingTarget(null)}
      />
    </div>
  )
}
