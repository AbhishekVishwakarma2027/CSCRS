import React, { useState, useEffect, useRef } from 'react'
import { Search, Eye, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ISSUE_CATEGORIES = [
  'Garbage',
  'Road Damage',
  'Manhole',
  'Waterlogging',
  'Damage Electric Pole',
  'Damage Street Light',
]

const REPORT_STATUSES = [
  'Pending',
  'Assigned',
  'In Progress',
  'Resolved',
  'Verified',
  'Closed',
  'Cancelled',
  'Rejected',
]

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

interface TableFilterHeaderProps {
  // Filters & State
  searchValue: string
  onSearchChange: (value: string) => void
  statusValue: string
  onStatusChange: (value: string) => void
  priorityValue: string
  onPriorityChange: (value: string) => void
  categoryValue: string
  onCategoryChange: (value: string) => void

  // Layout preference
  density: 'comfortable' | 'compact'
  onDensityChange: (value: 'comfortable' | 'compact') => void

  // Column Visibility
  allColumns: Array<{ id: string; label: string }>
  visibleColumns: string[]
  onToggleColumn: (colId: string) => void

  // Refresh
  isRefetching: boolean
  onRefresh: () => void
}

export function TableFilterHeader({
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  priorityValue,
  onPriorityChange,
  categoryValue,
  onCategoryChange,
  density,
  onDensityChange,
  allColumns,
  visibleColumns,
  onToggleColumn,
  isRefetching,
  onRefresh,
}: TableFilterHeaderProps) {
  const [isColMenuOpen, setIsColMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle click outside to close visibility menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsColMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Captures Ctrl+K / Cmd+K to focus search input
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-xs transition-shadow md:flex-row md:items-center dark:border-neutral-800 dark:bg-[#1C1C1E]">
      {/* Left side: Search & Filter selects */}
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        {/* Debounced Search Input */}
        <div className="relative max-w-xs flex-1">
          <Search className="text-neutral-450 absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 dark:text-neutral-500" />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search reports... (⌘K)"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8.5 w-full rounded-lg border border-neutral-200 bg-neutral-50/50 pl-9 text-[13px] font-bold transition-colors outline-none focus:border-[#0A3C7D] dark:border-neutral-800 dark:bg-[#1C1C1E] dark:focus:border-blue-500"
          />
        </div>

        {/* Filters Panel Button & Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Select */}
          <select
            value={statusValue}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-8.5 cursor-pointer rounded-lg border border-neutral-200 bg-white px-2.5 text-[13px] font-bold text-neutral-700 transition-colors outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-300"
            aria-label="Filter by Report Status"
          >
            <option value="">All Statuses</option>
            {REPORT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          {/* Priority Select */}
          <select
            value={priorityValue}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="h-8.5 cursor-pointer rounded-lg border border-neutral-200 bg-white px-2.5 text-[13px] font-bold text-neutral-700 transition-colors outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-300"
            aria-label="Filter by Priority"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>

          {/* Category Select */}
          <select
            value={categoryValue}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="h-8.5 cursor-pointer rounded-lg border border-neutral-200 bg-white px-2.5 text-[13px] font-bold text-neutral-700 transition-colors outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-300"
            aria-label="Filter by Category"
          >
            <option value="">All Categories</option>
            {ISSUE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right side: Density, Visibility Menu, Refresh Button */}
      <div className="dark:border-neutral-850 flex shrink-0 items-center justify-end gap-2 border-t border-neutral-100 pt-3 md:border-t-0 md:pt-0">
        {/* Density Toggle Group */}
        <div className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50/50 p-0.5 dark:border-neutral-800 dark:bg-[#1C1C1E]">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onDensityChange('comfortable')}
            className={`h-7.5 cursor-pointer rounded-md px-2 text-[11px] font-black tracking-wider uppercase transition-colors ${
              density === 'comfortable'
                ? 'bg-white text-[#0A3C7D] shadow-xs dark:bg-neutral-800 dark:text-blue-400'
                : 'text-neutral-450 hover:text-neutral-700 dark:text-neutral-400'
            }`}
          >
            Comfortable
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onDensityChange('compact')}
            className={`h-7.5 cursor-pointer rounded-md px-2 text-[11px] font-black tracking-wider uppercase transition-colors ${
              density === 'compact'
                ? 'bg-white text-[#0A3C7D] shadow-xs dark:bg-neutral-800 dark:text-blue-400'
                : 'text-neutral-450 hover:text-neutral-700 dark:text-neutral-400'
            }`}
          >
            Compact
          </Button>
        </div>

        {/* Column Visibility Selector Dropdown */}
        <div className="relative" ref={menuRef}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsColMenuOpen(!isColMenuOpen)}
            className="flex h-8.5 cursor-pointer items-center gap-1.5 font-bold outline-none dark:border-neutral-800"
            aria-expanded={isColMenuOpen}
            aria-label="Toggle Visible Columns"
          >
            <Eye className="text-neutral-550 h-4 w-4 dark:text-neutral-400" />
            <span className="hidden sm:inline">Columns</span>
          </Button>

          {isColMenuOpen && (
            <div className="animate-in fade-in slide-in-from-top-1 absolute right-0 z-40 mt-1.5 w-44 rounded-xl border border-neutral-200 bg-white p-2.5 shadow-lg duration-150 dark:border-neutral-800 dark:bg-[#1C1C1E]">
              <span className="text-neutral-450 dark:border-neutral-850 block border-b border-neutral-100 pb-2 text-[11px] font-black tracking-wider uppercase select-none dark:text-neutral-400">
                Visible Columns
              </span>
              <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
                {allColumns.map((col) => (
                  <label
                    key={col.id}
                    className="dark:hover:bg-neutral-850 flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-[13px] font-bold text-neutral-700 select-none hover:bg-neutral-50 dark:text-neutral-300"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col.id)}
                      onChange={() => onToggleColumn(col.id)}
                      className="h-3.5 w-3.5 cursor-pointer rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-700"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefetching}
          className="flex size-8.5 cursor-pointer items-center justify-center rounded-lg border border-neutral-200 bg-white p-0 outline-none hover:bg-neutral-50/70 disabled:pointer-events-none dark:border-neutral-800 dark:bg-[#1C1C1E]"
          aria-label="Refresh Dataset"
        >
          <RefreshCw
            className={`text-neutral-550 h-3.5 w-3.5 dark:text-neutral-400 ${
              isRefetching ? 'animate-spin text-blue-500' : ''
            }`}
          />
        </Button>
      </div>
    </div>
  )
}
