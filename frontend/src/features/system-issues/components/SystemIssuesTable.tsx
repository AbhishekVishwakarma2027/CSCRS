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
  Activity,
  Calendar,
  Info,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/utils/format'
import type { SystemIssueListItem } from '../types'

interface SystemIssuesTableProps {
  data: SystemIssueListItem[]
  isLoading: boolean
  error: Error | null
  density: 'comfortable' | 'compact'
  columnVisibility: Record<string, boolean>
  onViewDetails: (issue: SystemIssueListItem) => void
}

export function SystemIssuesTable({
  data,
  isLoading,
  error,
  density,
  columnVisibility,
  onViewDetails,
}: SystemIssuesTableProps) {
  const [activeActionRow, setActiveActionRow] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])

  const handleViewDetails = useCallback(
    (e: React.MouseEvent | undefined, issue: SystemIssueListItem) => {
      if (e) e.stopPropagation()
      onViewDetails(issue)
    },
    [onViewDetails]
  )

  const columns = useMemo<ColumnDef<SystemIssueListItem>[]>(() => {
    const cols: ColumnDef<SystemIssueListItem>[] = [
      {
        accessorKey: 'issue_number',
        header: 'Issue Number',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-neutral-800 dark:text-neutral-300">
            {row.original.issue_number}
          </span>
        ),
      },
      {
        accessorKey: 'title',
        header: ({ column }) => <SortableHeader column={column} title="Title" />,
        cell: ({ row }) => (
          <span
            onClick={(e) => handleViewDetails(e, row.original)}
            className="block cursor-pointer text-[13px] font-extrabold text-[#0A3C7D] select-all hover:underline dark:text-blue-400"
          >
            {row.original.title}
          </span>
        ),
      },
      {
        accessorKey: 'category',
        header: ({ column }) => <SortableHeader column={column} title="Category" />,
        cell: ({ row }) => (
          <span className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300">
            {row.original.category}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <SortableHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const status = row.original.status
          let statusStyles = ''
          if (status === 'OPEN') {
            statusStyles =
              'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-450'
          } else if (status === 'IN_REVIEW') {
            statusStyles =
              'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-450'
          } else if (status === 'RESOLVED') {
            statusStyles =
              'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-450'
          } else {
            statusStyles =
              'border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-450'
          }

          return (
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${statusStyles}`}
            >
              {status}
            </span>
          )
        },
      },
      {
        accessorKey: 'reporter_name',
        header: ({ column }) => <SortableHeader column={column} title="Reporter" />,
        cell: ({ row }) => (
          <span className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300">
            {row.original.reporter_name}
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => <SortableHeader column={column} title="Created Date" />,
        cell: ({ row }) => (
          <span className="dark:text-neutral-450 font-semibold text-neutral-500">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="pr-2 text-right">Actions</div>,
        cell: ({ row }) => {
          const issue = row.original
          const isOpen = activeActionRow === issue.issue_number

          return (
            <div className="relative pr-2 text-right">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveActionRow(isOpen ? null : issue.issue_number)
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
                      <button
                        type="button"
                        onClick={() => {
                          handleViewDetails(undefined, issue)
                          setActiveActionRow(null)
                        }}
                        className="dark:hover:bg-neutral-850 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300"
                      >
                        <Info className="h-3.5 w-3.5 text-blue-500" />
                        View Details
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )
        },
      },
    ]

    return cols
  }, [activeActionRow, handleViewDetails])

  // TanStack Table setup
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

  // Skeletons count based on current layout density
  const skeletonRowsCount = density === 'compact' ? 12 : 8

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <div className="overflow-x-auto select-none">
          <table className="w-full text-xs font-bold">
            <thead className="dark:bg-neutral-850/50 dark:border-neutral-850 text-neutral-450 border-b border-neutral-100 bg-neutral-50 text-left text-[13px] tracking-wider uppercase dark:text-neutral-500">
              <tr>
                {columns.map((c, idx) => (
                  <th key={idx} className="p-3.5">
                    <div className="h-3 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(skeletonRowsCount)].map((_, rIdx) => (
                <tr
                  key={rIdx}
                  className="dark:border-neutral-850/30 border-b border-neutral-100/50"
                >
                  <td className="flex items-center gap-3 p-3.5">
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                    </div>
                  </td>
                  {[...Array(columns.length - 1)].map((_, cIdx) => (
                    <td key={cIdx} className="p-3.5">
                      <div className="h-3 w-14 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200/60 bg-red-50/20 p-8 text-center select-none dark:border-red-900/40 dark:bg-red-950/5">
        <AlertTriangle className="text-red-550 h-8 w-8 shrink-0" />
        <h4 className="text-red-750 text-[13px] font-black tracking-wider uppercase dark:text-red-400">
          System Issues Fetch Failure
        </h4>
        <p className="max-w-md text-[13px] leading-relaxed font-semibold text-red-600/80 dark:text-red-400/80">
          {error.message || 'FastAPI rejected the query. Ensure active administrative credentials.'}
        </p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50/30 p-10 text-center select-none dark:border-neutral-800 dark:bg-neutral-900/10">
        <Activity className="h-9 w-9 text-neutral-400 dark:text-neutral-500" />
        <h4 className="text-neutral-650 dark:text-neutral-450 text-[13px] font-black tracking-widest uppercase">
          No System Issues Found
        </h4>
        <p className="text-neutral-450 dark:text-neutral-550 max-w-xs text-[13px] leading-relaxed font-semibold">
          No system issues fit the active criteria filters.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* A. Desktop Grid table */}
      <div className="hidden overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs md:block dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full text-xs font-bold">
            <thead className="dark:bg-neutral-850/50 dark:border-neutral-850 text-neutral-450 border-b border-neutral-100 bg-neutral-50 text-left text-[13px] tracking-wider uppercase select-none dark:text-neutral-500">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`p-3.5 font-black tracking-widest ${
                        density === 'compact' ? 'px-3.5 py-2' : 'px-3.5 py-3.5'
                      }`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="dark:border-neutral-850/30 border-b border-neutral-100/50 transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`dark:text-neutral-350 align-middle text-neutral-700 ${
                        density === 'compact' ? 'px-3.5 py-1.5' : 'px-3.5 py-3.5'
                      }`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* B. Mobile/Tablet Responsive Cards Reflow */}
      <div className="block space-y-3.5 select-none md:hidden">
        {data.map((issue) => {
          const isOpen = activeActionRow === issue.issue_number
          const status = issue.status

          let statusStyles = ''
          if (status === 'OPEN') {
            statusStyles =
              'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-450'
          } else if (status === 'IN_REVIEW') {
            statusStyles =
              'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-450'
          } else if (status === 'RESOLVED') {
            statusStyles =
              'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-450'
          } else {
            statusStyles =
              'border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-450'
          }

          return (
            <div
              key={issue.issue_number}
              className="dark:border-neutral-850 space-y-3 rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-xs dark:bg-[#1C1C1E]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    onClick={(e) => handleViewDetails(e, issue)}
                    className="cursor-pointer text-sm font-extrabold text-[#0A3C7D] hover:underline dark:text-blue-400"
                  >
                    {issue.title}
                  </span>
                </div>

                <div className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveActionRow(isOpen ? null : issue.issue_number)
                    }}
                    className="size-7 cursor-pointer rounded-md p-0 outline-none hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <MoreVertical className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                  </Button>

                  {isOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setActiveActionRow(null)}
                      />
                      <div className="animate-in fade-in slide-in-from-top-1 absolute right-0 z-40 mt-1 w-40 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg duration-150 dark:border-neutral-800 dark:bg-[#1C1C1E]">
                        <span className="text-neutral-450 dark:border-neutral-850 block border-b border-neutral-100 px-2 py-1 pb-1 text-left text-[11px] font-black tracking-wider uppercase select-none">
                          Operations
                        </span>
                        <div className="mt-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              handleViewDetails(undefined, issue)
                              setActiveActionRow(null)
                            }}
                            className="dark:hover:bg-neutral-850 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-left text-xs font-bold text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300"
                          >
                            <Info className="h-3 w-3 text-blue-500" />
                            View Details
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="dark:border-neutral-850 text-neutral-450 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-2.5 text-[13px] font-bold dark:text-neutral-500">
                <span className="flex items-center gap-1 font-mono text-xs text-neutral-700 dark:text-neutral-300">
                  {issue.issue_number}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(issue.created_at)}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-black tracking-wider uppercase ${statusStyles}`}
                >
                  {status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* Local Subcomponent for Sortable Columns */
interface SortableHeaderProps {
  column: Column<SystemIssueListItem, unknown>
  title: string
}

function SortableHeader({ column, title }: SortableHeaderProps) {
  const isSorted = column.getIsSorted()

  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(isSorted === 'asc')}
      className="dark:hover:text-neutral-350 flex cursor-pointer items-center gap-1 text-[13px] font-black tracking-widest uppercase outline-none hover:text-neutral-700"
    >
      {title}
      {isSorted === 'asc' ? (
        <ArrowUp className="dark:text-blue-505 h-3 w-3 text-[#0A3C7D]" />
      ) : isSorted === 'desc' ? (
        <ArrowDown className="dark:text-blue-505 h-3 w-3 text-[#0A3C7D]" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  )
}
