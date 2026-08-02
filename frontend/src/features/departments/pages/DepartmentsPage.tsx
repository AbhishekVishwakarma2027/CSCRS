import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Plus,
  SlidersHorizontal,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { UserRole } from '@/types/auth.types'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/features/reports/components/ConfirmationDialog'

import { DepartmentsTable } from '../components/DepartmentsTable'
import { DepartmentDetailsDrawer } from '../components/DepartmentDetailsDrawer'
import { CreateDepartmentModal } from '../components/CreateDepartmentModal'
import {
  useDepartmentsQuery,
  useActivateDepartmentMutation,
  useDeactivateDepartmentMutation,
} from '../hooks/use-departments'
import { mapDepartmentApiToUi } from '../types'
import type { DepartmentUI } from '../types'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active Only' },
  { value: 'inactive', label: 'Inactive Only' },
]

const ALL_COLUMNS = [
  { id: 'name', label: 'Department Name' },
  { id: 'code', label: 'System Code' },
  { id: 'is_active', label: 'Status' },
  { id: 'created_at', label: 'Created Date' },
]

export default function DepartmentsPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN

  const [searchParams, setSearchParams] = useSearchParams()

  // ─── 1. URL Parameter Sync ───────────────────────────────────────────────
  const pageParam = Number(searchParams.get('page')) || 1
  const searchParam = searchParams.get('q') || ''
  const statusParam = searchParams.get('status') || 'all'

  // Input states (with debounce sync)
  const [searchInputValue, setSearchInputValue] = useState(searchParam)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Sync input value if URL parameter changes externally
  useEffect(() => {
    setSearchInputValue(searchParam)
  }, [searchParam])

  // Sync debounced search input to URL parameters
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (searchInputValue.trim()) {
          next.set('q', searchInputValue.trim())
        } else {
          next.delete('q')
        }
        next.set('page', '1') // Reset page index on search query change
        return next
      })
    }, 350)

    return () => clearTimeout(handler)
  }, [searchInputValue, setSearchParams])

  // Helper helper to modify other filter values
  const setFilterParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value && value !== 'all') {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      next.set('page', '1')
      return next
    })
  }

  // Keyboard shortcut Ctrl+K / ⌘K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ─── 2. Layout Preferences (localStorage) ──────────────────────────────
  const [density, setDensity] = useState<'comfortable' | 'compact'>(() => {
    return (
      (localStorage.getItem('cscrs_dept_density') as 'comfortable' | 'compact') || 'comfortable'
    )
  })

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cscrs_dept_columns')
      return saved ? JSON.parse(saved) : ALL_COLUMNS.map((c) => c.id)
    } catch {
      return ALL_COLUMNS.map((c) => c.id)
    }
  })

  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false)

  // Save layout settings
  useEffect(() => {
    localStorage.setItem('cscrs_dept_density', density)
  }, [density])

  useEffect(() => {
    localStorage.setItem('cscrs_dept_columns', JSON.stringify(visibleColumns))
  }, [visibleColumns])

  const columnVisibilityRecord = useMemo(() => {
    return ALL_COLUMNS.reduce<Record<string, boolean>>((acc, col) => {
      acc[col.id] = visibleColumns.includes(col.id)
      return acc
    }, {})
  }, [visibleColumns])

  const handleToggleColumn = (colId: string) => {
    setVisibleColumns((prev) => {
      if (prev.includes(colId)) {
        if (prev.length <= 1) return prev // Keep at least one column visible
        return prev.filter((id) => id !== colId)
      }
      return [...prev, colId]
    })
  }

  // ─── 3. Query Fetches ─────────────────────────────────────────────────────
  const { data: rawDepts = [], isLoading, error, refetch, isRefetching } = useDepartmentsQuery()

  const activateMutation = useActivateDepartmentMutation()
  const deactivateMutation = useDeactivateDepartmentMutation()

  // ─── 4. Client Side Filters & Pagination ───────────────────────────────
  const mappedDepts = useMemo(() => {
    return rawDepts.map(mapDepartmentApiToUi)
  }, [rawDepts])

  const filteredDepts = useMemo(() => {
    return mappedDepts.filter((dept) => {
      // Search matches name or code
      const queryClean = searchParam.toLowerCase().trim()
      if (queryClean) {
        const nameMatch = dept.name.toLowerCase().includes(queryClean)
        const codeMatch = dept.code.toLowerCase().includes(queryClean)
        if (!nameMatch && !codeMatch) return false
      }

      // Status match
      if (statusParam === 'active' && !dept.is_active) return false
      if (statusParam === 'inactive' && dept.is_active) return false

      return true
    })
  }, [mappedDepts, searchParam, statusParam])

  // Sorting
  const sortedDepts = useMemo(() => {
    // Rely on table internal sorting for headers, but this acts as default sorting (Active first, then alphabetical)
    return [...filteredDepts].sort((a, b) => {
      if (a.is_active !== b.is_active) {
        return a.is_active ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  }, [filteredDepts])

  // Pagination metrics
  const pageSize = 10
  const totalItems = sortedDepts.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1

  const paginatedDepts = useMemo(() => {
    const start = (pageParam - 1) * pageSize
    const end = start + pageSize
    return sortedDepts.slice(start, end)
  }, [sortedDepts, pageParam])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', String(newPage))
        return next
      })
    }
  }

  // ─── 5. UI Drawers & Confirmations State ──────────────────────────────
  const [selectedDeptForDetails, setSelectedDeptForDetails] = useState<DepartmentUI | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Activation states
  const [activeActivateId, setActiveActivateId] = useState<number | null>(null)
  const [activeActivateName, setActiveActivateName] = useState('')
  const [isActivateConfirmOpen, setIsActivateConfirmOpen] = useState(false)

  // Deactivation states
  const [activeDeactivateId, setActiveDeactivateId] = useState<number | null>(null)
  const [activeDeactivateName, setActiveDeactivateName] = useState('')
  const [isDeactivateConfirmOpen, setIsDeactivateConfirmOpen] = useState(false)

  const handleTriggerActivate = (id: number, name: string) => {
    setActiveActivateId(id)
    setActiveActivateName(name)
    setIsActivateConfirmOpen(true)
  }

  const handleTriggerDeactivate = (id: number, name: string) => {
    setActiveDeactivateId(id)
    setActiveDeactivateName(name)
    setIsDeactivateConfirmOpen(true)
  }

  const executeActivate = async () => {
    if (!activeActivateId) return
    try {
      await activateMutation.mutateAsync(activeActivateId)
      toast.success(`Department "${activeActivateName}" activated successfully.`)
      setIsActivateConfirmOpen(false)
      setActiveActivateId(null)
      refetch()
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } }
      toast.error(apiError.response?.data?.detail || 'Activation failed.')
    }
  }

  const executeDeactivate = async () => {
    if (!activeDeactivateId) return
    try {
      await deactivateMutation.mutateAsync(activeDeactivateId)
      toast.success(`Department "${activeDeactivateName}" deactivated successfully.`)
      setIsDeactivateConfirmOpen(false)
      setActiveDeactivateId(null)
      refetch()
    } catch (err) {
      const apiError = err as { response?: { data?: { detail?: string } } }
      toast.error(apiError.response?.data?.detail || 'Deactivation failed.')
    }
  }

  return (
    <div className="space-y-5 pb-10 text-left">
      {/* 1. Header Banner */}
      <div className="dark:border-neutral-850 flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="dark:text-blue-450 flex items-center gap-1.5 text-sm font-black tracking-widest text-[#0A3C7D] uppercase">
            <Building2 className="h-5 w-5" />
            Municipal Departments
          </h2>
          <p className="text-neutral-450 mt-1 text-xs font-semibold dark:text-neutral-500">
            Configure system routing sectors, activate/deactivate departments, and overview metrics.
          </p>
        </div>

        {isSuperAdmin && (
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex h-9 cursor-pointer items-center gap-1.5 self-start bg-[#0A3C7D] text-xs font-bold text-white hover:bg-[#0A3C7D]/95 sm:self-auto"
          >
            <Plus className="h-4 w-4 shrink-0" />
            Add Department
          </Button>
        )}
      </div>

      {/* 2. Search Toolbar (Matches TableFilterHeader layout exactly) */}
      <div className="dark:border-neutral-850 flex flex-col justify-between gap-3 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-3 shadow-xs md:flex-row md:items-center dark:bg-[#1E1E20]">
        {/* Search & Filters */}
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search text input */}
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
              placeholder="Search departments... (Ctrl+K)"
              className="h-8.5 w-full rounded-lg border border-neutral-200 bg-white pr-12 pl-3.5 text-xs font-bold outline-none focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#1C1C1E]"
            />
            {searchInputValue && (
              <button
                type="button"
                onClick={() => setSearchInputValue('')}
                className="dark:hover:text-neutral-350 absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-[10px] text-neutral-400 outline-none hover:text-neutral-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status filter selection */}
          <select
            value={statusParam}
            onChange={(e) => setFilterParam('status', e.target.value)}
            className="h-8.5 cursor-pointer rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-[#0A3C7D] dark:border-neutral-800 dark:bg-[#1C1C1E]"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Dense / Columns preferences */}
        <div className="flex items-center justify-end gap-2.5">
          {/* Density toggle */}
          <div className="dark:border-neutral-750 flex items-center rounded-lg border border-neutral-200/40 bg-neutral-100 p-0.5 dark:bg-neutral-800/80">
            <button
              type="button"
              onClick={() => setDensity('comfortable')}
              className={`cursor-pointer rounded-md px-2 py-1 text-[10px] font-black uppercase transition-all outline-none ${
                density === 'comfortable'
                  ? 'bg-white text-neutral-800 shadow-xs dark:bg-[#1C1C1E] dark:text-neutral-200'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              Comfortable
            </button>
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`cursor-pointer rounded-md px-2 py-1 text-[10px] font-black uppercase transition-all outline-none ${
                density === 'compact'
                  ? 'bg-white text-neutral-800 shadow-xs dark:bg-[#1C1C1E] dark:text-neutral-200'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              Compact
            </button>
          </div>

          {/* Column selector */}
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setIsColumnPickerOpen(!isColumnPickerOpen)}
              className="flex h-8.5 cursor-pointer items-center gap-1.5 px-2.5 text-xs font-bold dark:border-neutral-800"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Columns
            </Button>

            {isColumnPickerOpen && (
              <>
                <div className="fixed inset-0 z-35" onClick={() => setIsColumnPickerOpen(false)} />
                <div className="animate-in fade-in slide-in-from-top-1 absolute right-0 z-40 mt-1 w-44 space-y-1.5 rounded-xl border border-neutral-200 bg-white p-2.5 shadow-lg duration-150 dark:border-neutral-800 dark:bg-[#1C1C1E]">
                  <span className="dark:text-neutral-550 dark:border-neutral-850 mb-1.5 block border-b border-neutral-100 pb-1.5 text-left text-[8px] font-black tracking-wider text-neutral-400 uppercase select-none">
                    Visible Columns
                  </span>
                  {ALL_COLUMNS.map((col) => {
                    const isVisible = visibleColumns.includes(col.id)
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => handleToggleColumn(col.id)}
                        className="dark:hover:bg-neutral-850 flex w-full cursor-pointer items-center justify-between rounded-md px-1.5 py-1 text-left text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300"
                      >
                        {col.label}
                        {isVisible && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Refresh button */}
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => refetch()}
            className="flex h-8.5 w-8.5 cursor-pointer items-center justify-center p-0 dark:border-neutral-800"
            title="Refresh Registry"
          >
            <RotateCcw
              className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin text-blue-500' : ''}`}
            />
          </Button>
        </div>
      </div>

      {/* 3. Departments Data Grid Grid */}
      <DepartmentsTable
        data={paginatedDepts}
        isLoading={isLoading}
        error={error}
        density={density}
        columnVisibility={columnVisibilityRecord}
        onViewDetails={setSelectedDeptForDetails}
        onActivate={handleTriggerActivate}
        onDeactivate={handleTriggerDeactivate}
      />

      {/* 4. Pagination Controls Footer (Consistent with Reports page footer) */}
      {!isLoading && !error && totalItems > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 shadow-xs select-none dark:border-neutral-800 dark:bg-[#1C1C1E]">
          <span className="text-neutral-455 dark:text-neutral-505 text-[11px] font-bold">
            Showing {totalItems > 0 ? (pageParam - 1) * pageSize + 1 : 0}–
            {Math.min(pageParam * pageSize, totalItems)} of {totalItems} items
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={pageParam <= 1}
              onClick={() => handlePageChange(pageParam - 1)}
              className="h-7 cursor-pointer px-2 text-xs font-bold dark:border-neutral-800"
            >
              <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {/* Direct Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <Button
                key={num}
                type="button"
                variant={pageParam === num ? 'default' : 'outline'}
                size="xs"
                onClick={() => handlePageChange(num)}
                className={`h-7 w-7 cursor-pointer p-0 text-xs font-extrabold dark:border-neutral-800 ${
                  pageParam === num
                    ? 'bg-[#0A3C7D] text-white hover:bg-[#0A3C7D]/90 dark:bg-blue-600 dark:hover:bg-blue-500'
                    : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400'
                }`}
              >
                {num}
              </Button>
            ))}

            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={pageParam >= totalPages}
              onClick={() => handlePageChange(pageParam + 1)}
              className="h-7 cursor-pointer px-2 text-xs font-bold dark:border-neutral-800"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── CREATION MODAL & OVERLAYS ────────────────────────────────────────── */}
      <CreateDepartmentModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      <DepartmentDetailsDrawer
        isOpen={!!selectedDeptForDetails}
        onClose={() => setSelectedDeptForDetails(null)}
        department={selectedDeptForDetails}
      />

      <ConfirmationDialog
        isOpen={isActivateConfirmOpen}
        title="Double Confirm Activation"
        description={`Are you sure you want to activate department "${activeActivateName}"? This will allow city reports to be assigned to this department.`}
        confirmLabel="Yes, Activate"
        cancelLabel="Go Back"
        isDanger={false}
        isSubmitting={activateMutation.isPending}
        onConfirm={executeActivate}
        onCancel={() => setIsActivateConfirmOpen(false)}
      />

      <ConfirmationDialog
        isOpen={isDeactivateConfirmOpen}
        title="Double Confirm Deactivation"
        description={`Are you sure you want to deactivate department "${activeDeactivateName}"? This will suspend operational reports routing and field worker assignments for this sector.`}
        confirmLabel="Yes, Deactivate"
        cancelLabel="Go Back"
        isDanger={true}
        isSubmitting={deactivateMutation.isPending}
        onConfirm={executeDeactivate}
        onCancel={() => setIsDeactivateConfirmOpen(false)}
      />
    </div>
  )
}
