import React, { useMemo, useState, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table'
import type { ColumnDef, SortingState, Column } from '@tanstack/react-table'
import {
  MoreVertical,
  XCircle,
  RotateCcw,
  UserCheck,
  AlertCircle,
  FileText,
  Copy,
  Info,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/utils/format'
import { toast } from 'sonner'
import type { ReportListItem } from '../types'
import { UserRole } from '@/types/auth.types'

// WCAG AA Compliant High Contrast Badges (aligned with dashboard palette)
const PRIORITY_BADGES: Record<string, string> = {
  Low: 'bg-[#6B7280]/10 text-[#475569] border-[#6B7280]/20 dark:bg-neutral-800/50 dark:text-neutral-400 dark:border-neutral-700/40',
  Medium:
    'bg-[#3B82F6]/10 text-[#1D4ED8] border-[#3B82F6]/20 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
  High: 'bg-[#F59E0B]/10 text-[#B45309] border-[#F59E0B]/20 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30',
  Critical:
    'bg-[#DC2626]/10 text-[#991B1B] border-[#DC2626]/20 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
}

const STATUS_BADGES: Record<string, string> = {
  Pending:
    'bg-[#EF4444]/10 text-[#B91C1C] border-[#EF4444]/20 dark:bg-red-950/20 dark:text-red-450 dark:border-red-900/30',
  Assigned:
    'bg-[#F59E0B]/10 text-[#B45309] border-[#F59E0B]/20 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30',
  'In Progress':
    'bg-[#3B82F6]/10 text-[#1D4ED8] border-[#3B82F6]/20 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
  Resolved:
    'bg-[#22C55E]/10 text-[#15803D] border-[#22C55E]/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
  Verified:
    'bg-[#22C55E]/10 text-[#15803D] border-[#22C55E]/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
  Closed:
    'bg-[#6B7280]/10 text-[#475569] border-[#6B7280]/20 dark:bg-neutral-800/30 dark:text-neutral-400 dark:border-neutral-700/40',
  Rejected:
    'bg-[#6B7280]/10 text-[#475569] border-[#6B7280]/20 dark:bg-neutral-800/30 dark:text-neutral-400 dark:border-neutral-700/40',
  Cancelled:
    'bg-[#DC2626]/10 text-[#991B1B] border-[#DC2626]/20 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
  Reopened:
    'bg-[#6366F1]/10 text-[#4338CA] border-[#6366F1]/20 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30',
}

interface ReportsTableProps {
  data: ReportListItem[]
  isLoading: boolean
  error: Error | null
  userRole: string
  density: 'comfortable' | 'compact'
  columnVisibility: Record<string, boolean>
  departmentsMap: Record<number, string>
  onRefetch: () => void

  // Workflow Handlers
  onViewDetails: (report: ReportListItem) => void
  onAssign: (reportId: number) => void
  onCancel: (reportId: number) => void
  onReopen: (reportId: number) => void
}

export function ReportsTable({
  data,
  isLoading,
  error,
  userRole,
  density,
  columnVisibility,
  departmentsMap,
  onRefetch,
  onViewDetails,
  onAssign,
  onCancel,
  onReopen,
}: ReportsTableProps) {
  const [activeActionRow, setActiveActionRow] = useState<number | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])

  const isDeptAdmin = userRole === UserRole.DEPARTMENT_ADMIN

  const handleCopyId = useCallback((e: React.MouseEvent | undefined, reportNumber: string) => {
    if (e) e.stopPropagation()
    navigator.clipboard.writeText(reportNumber)
    toast.success(`Reference ID ${reportNumber} copied to clipboard!`)
  }, [])

  const handleViewDetails = useCallback(
    (e: React.MouseEvent | undefined, report: ReportListItem) => {
      if (e) e.stopPropagation()
      onViewDetails(report)
    },
    [onViewDetails]
  )

  const handleDepartmentClick = useCallback((e: React.MouseEvent, deptName: string) => {
    e.stopPropagation()
    toast.info(`Department Details page for "${deptName}" will be integrated in a later phase.`)
  }, [])

  const columns = useMemo<ColumnDef<ReportListItem>[]>(() => {
    const cols: ColumnDef<ReportListItem>[] = [
      {
        accessorKey: 'report_number',
        header: 'Reference',
        cell: ({ row }) => (
          <div className="group/ref flex items-center gap-1.5">
            <span
              onClick={(e) => handleViewDetails(e, row.original)}
              className="cursor-pointer font-extrabold text-[#0A3C7D] select-all hover:underline dark:text-blue-400"
            >
              {row.original.report_number}
            </span>
            <button
              type="button"
              onClick={(e) => handleCopyId(e, row.original.report_number)}
              className="text-neutral-450 shrink-0 cursor-pointer rounded p-0.5 opacity-0 transition-all outline-none group-hover/ref:opacity-100 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              title="Copy Reference ID"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        ),
      },
      {
        accessorKey: 'issue_type',
        header: 'Issue Category',
        cell: ({ row }) => (
          <span className="dark:text-neutral-250 font-semibold text-neutral-800 capitalize">
            {row.original.issue_type.toLowerCase()}
          </span>
        ),
      },
    ]

    // Only show Department column if user is City Admin or Super Admin
    if (!isDeptAdmin) {
      cols.push({
        id: 'department',
        accessorFn: (row) => {
          const deptId = row.department_id
          return deptId ? departmentsMap[deptId] || '' : ''
        },
        header: 'Department',
        cell: ({ row }) => {
          const deptId = row.original.department_id
          const name = deptId ? departmentsMap[deptId] : 'Unassigned'
          return (
            <span
              onClick={(e) => name && handleDepartmentClick(e, name)}
              className="inline-block max-w-[150px] cursor-pointer truncate font-medium text-neutral-500 hover:text-[#0A3C7D] hover:underline dark:text-neutral-400 dark:hover:text-blue-400"
            >
              {name || 'Loading...'}
            </span>
          )
        },
      })
    }

    // Add rest of default fields
    cols.push(
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) => {
          const val = row.original.priority
          return (
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                PRIORITY_BADGES[val] || 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {val}
            </span>
          )
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Created Date',
        cell: ({ row }) => (
          <span className="font-medium text-neutral-500 dark:text-neutral-400">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const val = row.original.status
          return (
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                STATUS_BADGES[val] || 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {val}
            </span>
          )
        },
      }
    )

    // Action menu cell (Strictly checked against RBAC permissions boundaries)
    cols.push({
      id: 'actions',
      header: () => <div className="pr-2 text-right">Actions</div>,
      cell: ({ row }) => {
        const report = row.original
        const status = report.status
        const isOpen = activeActionRow === report.id

        // Role-based actions
        const isAssignable = isDeptAdmin && status === 'Pending'
        const isCancellable = isDeptAdmin && ['Pending', 'Assigned', 'In Progress'].includes(status)
        const isReopenable = isDeptAdmin && status === 'Cancelled'

        return (
          <div className="relative pr-2 text-right">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation()
                setActiveActionRow(isOpen ? null : report.id)
              }}
              className="dark:hover:bg-neutral-850 inline-flex size-7 cursor-pointer items-center justify-center rounded-md p-0 outline-none hover:bg-neutral-100"
            >
              <MoreVertical className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
            </Button>

            {isOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setActiveActionRow(null)} />
                <div className="animate-in fade-in slide-in-from-top-1 absolute right-0 z-40 mt-1 w-44 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg duration-150 dark:border-neutral-800 dark:bg-[#1C1C1E]">
                  <span className="dark:text-neutral-550 dark:border-neutral-850 block border-b border-neutral-100 px-2 py-1 pb-1 text-left text-[11px] font-black tracking-wider text-neutral-400 uppercase select-none">
                    Operations
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {/* View Details available for all roles */}
                    <button
                      type="button"
                      onClick={() => {
                        handleViewDetails(undefined, report)
                        setActiveActionRow(null)
                      }}
                      className="dark:hover:bg-neutral-850 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300"
                    >
                      <Info className="h-3.5 w-3.5 text-blue-500" />
                      View Details
                    </button>

                    {isAssignable && (
                      <button
                        type="button"
                        onClick={() => {
                          onAssign(report.id)
                          setActiveActionRow(null)
                        }}
                        className="dark:hover:bg-neutral-850 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300"
                      >
                        <UserCheck className="text-blue-550 h-3.5 w-3.5" />
                        Auto Assign
                      </button>
                    )}
                    {isCancellable && (
                      <button
                        type="button"
                        onClick={() => {
                          onCancel(report.id)
                          setActiveActionRow(null)
                        }}
                        className="text-red-650 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <XCircle className="h-3.5 w-3.5 text-rose-500" />
                        Cancel Issue
                      </button>
                    )}
                    {isReopenable && (
                      <button
                        type="button"
                        onClick={() => {
                          onReopen(report.id)
                          setActiveActionRow(null)
                        }}
                        className="dark:hover:bg-neutral-850 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-emerald-500" />
                        Reopen Issue
                      </button>
                    )}

                    {/* Copy ID available for all roles */}
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyId(undefined, report.report_number)
                        setActiveActionRow(null)
                      }}
                      className="dark:hover:bg-neutral-850 dark:border-neutral-850 mt-1 flex w-full cursor-pointer items-center gap-2 rounded-lg border-t border-neutral-100 px-2.5 py-1.5 pt-1.5 text-left text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300"
                    >
                      <Copy className="text-neutral-450 h-3.5 w-3.5 dark:text-neutral-500" />
                      Copy Report ID
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )
      },
    })

    return cols
  }, [
    isDeptAdmin,
    departmentsMap,
    activeActionRow,
    handleViewDetails,
    handleCopyId,
    handleDepartmentClick,
    onAssign,
    onCancel,
    onReopen,
  ])

  // TanStack Table Instance
  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility,
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // 1. Loading Skeletons
  if (isLoading) {
    return (
      <div className="w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="dark:border-neutral-850 border-b border-neutral-100 bg-neutral-50/30 dark:bg-neutral-900/10">
                {[...Array(isDeptAdmin ? 5 : 6)].map((_, idx) => (
                  <th key={idx} className="px-4 py-3.5">
                    <div className="dark:bg-neutral-850 h-3 w-16 animate-pulse rounded bg-neutral-200" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="dark:divide-neutral-850 divide-y divide-neutral-100">
              {[...Array(density === 'compact' ? 8 : 5)].map((_, rIdx) => (
                <tr key={rIdx}>
                  {[...Array(isDeptAdmin ? 5 : 6)].map((_, cIdx) => (
                    <td key={cIdx} className={density === 'compact' ? 'px-4 py-2' : 'px-4 py-4'}>
                      <div
                        className={`bg-neutral-150 animate-pulse rounded dark:bg-neutral-800 ${
                          cIdx === 0 ? 'h-3.5 w-20' : 'h-3 w-28'
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // 2. Error State Card
  if (error) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <AlertCircle className="h-7 w-7 shrink-0 text-rose-500" />
        <h4 className="dark:text-neutral-250 text-[13px] font-bold text-neutral-800">
          Failed to load reports ledger
        </h4>
        <p className="text-neutral-450 max-w-sm text-[13px] leading-relaxed font-medium dark:text-neutral-500">
          The server returned an error: {error.message || 'Unknown network error'}. Please verify
          connection and retry.
        </p>
        <Button
          type="button"
          onClick={onRefetch}
          className="bg-primary mt-2 cursor-pointer text-xs font-black text-white shadow-xs"
        >
          Retry Load
        </Button>
      </div>
    )
  }

  // 3. Empty State Card
  if (data.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <div className="dark:bg-neutral-850 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50 text-neutral-400 dark:text-neutral-500">
          <FileText className="h-6 w-6" />
        </div>
        <h4 className="text-[13px] font-black tracking-widest text-neutral-600 uppercase dark:text-neutral-400">
          No active reports
        </h4>
        <p className="text-neutral-450 max-w-[280px] text-[13px] leading-relaxed font-semibold dark:text-neutral-500">
          There are no reports recorded matching your select filter criteria in the ledger.
        </p>
      </div>
    )
  }

  // Helper to render sorting indicators
  const renderSortIndicator = (column: Column<ReportListItem, unknown>) => {
    if (!column.getCanSort()) return null
    const isSorted = column.getIsSorted()
    if (isSorted === 'asc')
      return <ArrowUp className="dark:text-blue-450 ml-1 inline h-3.5 w-3.5 text-[#0A3C7D]" />
    if (isSorted === 'desc')
      return <ArrowDown className="dark:text-blue-450 ml-1 inline h-3.5 w-3.5 text-[#0A3C7D]" />
    return (
      <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 opacity-30 transition-opacity group-hover:opacity-100" />
    )
  }

  // 4. Desktop-First Table View & Mobile Cards view
  return (
    <div className="w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs transition-shadow hover:shadow-sm dark:border-neutral-800 dark:bg-[#1C1C1E]">
      {/* HTML Table Layout - hidden on Mobile (< 768px) */}
      <div className="hidden scrollbar-thin overflow-x-auto md:block">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="dark:border-neutral-850 text-neutral-450 border-b border-neutral-100 bg-neutral-50/30 text-[13px] font-black tracking-wider uppercase select-none dark:bg-[#1E1E20] dark:text-neutral-400"
              >
                {headerGroup.headers.map((header) => {
                  const isSortable = header.column.getCanSort()
                  return (
                    <th
                      key={header.id}
                      onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
                      className={`group font-black select-none ${
                        isSortable
                          ? 'dark:hover:bg-neutral-850 cursor-pointer hover:bg-neutral-100/50'
                          : ''
                      } ${density === 'compact' ? 'px-4 py-2' : 'px-4 py-3.5'}`}
                    >
                      <div className="flex items-center">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {renderSortIndicator(header.column)}
                      </div>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="dark:divide-neutral-850 dark:text-neutral-350 divide-y divide-neutral-100 text-[13px] font-bold text-neutral-700">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="transition-colors hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={density === 'compact' ? 'px-4 py-1.5' : 'px-4 py-3.5'}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards Layout - visible only on Mobile/Tablet (< 768px) */}
      <div className="dark:divide-neutral-850 divide-y divide-neutral-100 md:hidden">
        {table.getRowModel().rows.map((row) => {
          const report = row.original
          const valPriority = report.priority
          const valStatus = report.status
          const deptName = report.department_id
            ? departmentsMap[report.department_id]
            : 'Unassigned'
          const isOpen = activeActionRow === report.id

          const isAssignable = isDeptAdmin && valStatus === 'Pending'
          const isCancellable =
            isDeptAdmin && ['Pending', 'Assigned', 'In Progress'].includes(valStatus)
          const isReopenable = isDeptAdmin && valStatus === 'Cancelled'

          return (
            <div
              key={report.id}
              className="space-y-3.5 p-4 transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20"
            >
              {/* Card Header: Reference and Action */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    onClick={(e) => handleViewDetails(e, report)}
                    className="cursor-pointer text-sm font-extrabold text-[#0A3C7D] hover:underline dark:text-blue-400"
                  >
                    {report.report_number}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleCopyId(e, report.report_number)}
                    className="text-neutral-450 dark:hover:bg-neutral-855 shrink-0 cursor-pointer rounded p-1 outline-none hover:bg-neutral-100"
                    title="Copy Reference ID"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>

                <div className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveActionRow(isOpen ? null : report.id)
                    }}
                    className="size-7 cursor-pointer rounded-md p-0 outline-none hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <MoreVertical className="text-neutral-550 h-4 w-4 dark:text-neutral-400" />
                  </Button>
                  {isOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setActiveActionRow(null)}
                      />
                      <div className="animate-in fade-in slide-in-from-top-1 absolute right-0 z-40 mt-1 w-40 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg duration-150 dark:border-neutral-800 dark:bg-[#1C1C1E]">
                        <span className="dark:text-neutral-550 dark:border-neutral-850 block border-b border-neutral-100 px-2 py-1 pb-1 text-left text-[11px] font-black tracking-wider text-neutral-400 uppercase select-none">
                          Operations
                        </span>
                        <div className="mt-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              handleViewDetails(undefined, report)
                              setActiveActionRow(null)
                            }}
                            className="dark:hover:bg-neutral-850 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-left text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300"
                          >
                            <Info className="h-3 w-3 text-blue-500" />
                            View Details
                          </button>
                          {isAssignable && (
                            <button
                              type="button"
                              onClick={() => {
                                onAssign(report.id)
                                setActiveActionRow(null)
                              }}
                              className="dark:hover:bg-neutral-850 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-left text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300"
                            >
                              <UserCheck className="text-blue-550 h-3 w-3" />
                              Auto Assign
                            </button>
                          )}
                          {isCancellable && (
                            <button
                              type="button"
                              onClick={() => {
                                onCancel(report.id)
                                setActiveActionRow(null)
                              }}
                              className="text-red-650 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-left text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                              <XCircle className="h-3 w-3 text-rose-500" />
                              Cancel Issue
                            </button>
                          )}
                          {isReopenable && (
                            <button
                              type="button"
                              onClick={() => {
                                onReopen(report.id)
                                setActiveActionRow(null)
                              }}
                              className="dark:hover:bg-neutral-850 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-left text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300"
                            >
                              <RotateCcw className="h-3 w-3 text-emerald-500" />
                              Reopen Issue
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              handleCopyId(undefined, report.report_number)
                              setActiveActionRow(null)
                            }}
                            className="dark:hover:bg-neutral-850 dark:border-neutral-850 mt-1 flex w-full cursor-pointer items-center gap-2 rounded-lg border-t border-neutral-100 px-2 py-1 pt-1.5 text-left text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300"
                          >
                            <Copy className="text-neutral-450 h-3 w-3 dark:text-neutral-500" />
                            Copy ID
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Card Meta Content Grid */}
              <div className="grid grid-cols-2 gap-y-2.5 text-xs">
                <div>
                  <span className="text-neutral-450 block text-[13px] font-black uppercase dark:text-neutral-500">
                    Category
                  </span>
                  <span className="dark:text-neutral-250 font-semibold text-neutral-800 capitalize">
                    {report.issue_type.toLowerCase()}
                  </span>
                </div>
                {!isDeptAdmin && (
                  <div>
                    <span className="text-neutral-450 block text-[13px] font-black uppercase dark:text-neutral-500">
                      Department
                    </span>
                    <span
                      onClick={(e) => deptName && handleDepartmentClick(e, deptName)}
                      className="dark:hover:text-blue-450 cursor-pointer font-semibold text-neutral-500 hover:text-[#0A3C7D] hover:underline dark:text-neutral-400"
                    >
                      {deptName || 'Unassigned'}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-neutral-450 block text-[10px] font-black uppercase dark:text-neutral-500">
                    Created Date
                  </span>
                  <span className="font-semibold text-neutral-500 dark:text-neutral-400">
                    {formatDate(report.created_at)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-450 block text-[10px] font-black uppercase dark:text-neutral-500">
                    Priority
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                      PRIORITY_BADGES[valPriority] || 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {valPriority}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-450 block text-[10px] font-black uppercase dark:text-neutral-500">
                    Status
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                      STATUS_BADGES[valStatus] || 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {valStatus}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
