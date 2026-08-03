import React, { useEffect, useRef } from 'react'
import { X, Building2, User, Mail, Phone, Clock, Activity, AlertCircle } from 'lucide-react'
import { formatDate } from '@/utils/format'
import type { DepartmentUI } from '../types'
import { useDepartmentDetailQuery } from '../hooks/use-departments'

interface DepartmentDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  department: DepartmentUI | null
}

export function DepartmentDetailsDrawer({
  isOpen,
  onClose,
  department,
}: DepartmentDetailsDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  // Close drawer on escape keypress
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Focus trap inside drawer
  useEffect(() => {
    if (!isOpen) return
    const drawerEl = drawerRef.current
    if (!drawerEl) return

    const focusableEls = drawerEl.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusableEls.length === 0) return

    const firstEl = focusableEls[0] as HTMLElement
    const lastEl = focusableEls[focusableEls.length - 1] as HTMLElement

    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          lastEl.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastEl) {
          firstEl.focus()
          e.preventDefault()
        }
      }
    }

    firstEl.focus()
    window.addEventListener('keydown', handleTab)
    return () => window.removeEventListener('keydown', handleTab)
  }, [isOpen])

  // Call detail API hook (enabled when drawer is open)
  const departmentId = department?.id || 0
  const { data: detailData, isLoading } = useDepartmentDetailQuery(
    departmentId,
    isOpen && !!departmentId
  )

  if (!isOpen || !department) return null

  // Resolve current active general department properties
  const activeDept = detailData ? detailData : department

  return (
    <>
      {/* Backdrop */}
      <div
        className="animate-in fade-in fixed inset-0 z-50 bg-neutral-900/60 transition-opacity duration-300 dark:bg-black/80"
        onClick={onClose}
      />

      {/* Slide-over Pane */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dept-drawer-title"
        className="animate-in slide-in-from-right-full fixed inset-y-0 right-0 z-50 flex w-full transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out md:max-w-2xl lg:max-w-2xl dark:bg-[#1C1C1E]"
      >
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-neutral-200 p-4 select-none dark:border-neutral-800">
          <div className="flex items-center gap-3">
            {/* Deterministic Avatar Tag */}
            <div
              className={`flex size-10 items-center justify-center rounded-xl text-sm font-black tracking-wider shadow-sm select-none ${department.colorClass}`}
            >
              {department.initials}
            </div>
            <div>
              <h2
                id="dept-drawer-title"
                className="dark:text-blue-450 text-xl font-black tracking-widest text-[#0A3C7D] uppercase"
              >
                Department Overview
              </h2>
              <span className="text-neutral-450 mt-0.5 block text-[13px] font-semibold dark:text-neutral-500">
                Register ID: #{department.id}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-450 dark:hover:bg-neutral-850 flex size-8 cursor-pointer items-center justify-center rounded-lg border border-transparent transition-colors outline-none hover:bg-neutral-100 hover:text-neutral-700 focus:border-[#0A3C7D] dark:focus:border-blue-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Viewport */}
        <div className="dark:text-neutral-355 flex-1 scrollbar-thin space-y-6 overflow-y-auto p-5 text-[13px] font-bold text-neutral-700">
          {/* SECTION 1: GENERAL INFORMATION */}
          <div className="dark:border-neutral-850 space-y-4 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:bg-[#1E1E20]">
            <h3 className="dark:border-neutral-850 flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[18px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
              <Building2 className="h-4 w-4 shrink-0 text-blue-500" />
              General Information
            </h3>

            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-3 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                  <div>
                    <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase dark:text-neutral-500">
                      Department Name
                    </span>
                    <span className="mt-1 block font-extrabold text-neutral-800 dark:text-neutral-200">
                      {activeDept.name}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase dark:text-neutral-500">
                      Status
                    </span>
                    <span
                      className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                        activeDept.is_active
                          ? 'dark:text-emerald-450 border-emerald-200 bg-emerald-100/60 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20'
                          : 'border-neutral-200 bg-neutral-100 text-neutral-600 dark:border-neutral-700/40 dark:bg-neutral-800/40 dark:text-neutral-400'
                      }`}
                    >
                      {activeDept.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase dark:text-neutral-500">
                      System Code
                    </span>
                    <span className="mt-1 block font-mono text-neutral-800 dark:text-neutral-200">
                      {department.code}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase dark:text-neutral-500">
                      Created Date
                    </span>
                    <span className="mt-1 block font-semibold text-neutral-500 dark:text-neutral-400">
                      {formatDate(activeDept.created_at)}
                    </span>
                  </div>
                </div>

                <div className="dark:border-neutral-850 border-t border-neutral-100 pt-2">
                  <span className="text-neutral-450 block text-[9px] font-black tracking-wider uppercase dark:text-neutral-500">
                    Work Description
                  </span>
                  <p className="mt-1 leading-relaxed font-semibold text-neutral-600 dark:text-neutral-400">
                    {activeDept.description || 'No detailed work description provided.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* CONTACT INFO (PLACEHOLDERS) */}
          <div className="dark:border-neutral-850 space-y-3.5 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:bg-[#1E1E20]">
            <h3 className="dark:border-neutral-850 flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[18px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
              <User className="h-4 w-4 shrink-0 text-blue-500" />
              Administrative Contact Registry
            </h3>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
              <div>
                <span className="text-neutral-450 block text-[9px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Department Head
                </span>
                <span className="dark:text-neutral-550 mt-1 block flex items-center gap-1 font-semibold text-neutral-500 italic">
                  <User className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  Not Assigned
                </span>
              </div>

              <div>
                <span className="text-neutral-450 block text-[9px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Contact Email
                </span>
                <span className="dark:text-neutral-550 mt-1 block flex items-center gap-1 font-semibold text-neutral-500 italic">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  No Registry Email
                </span>
              </div>

              <div>
                <span className="text-neutral-450 block text-[9px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Contact Number
                </span>
                <span className="dark:text-neutral-550 mt-1 block flex items-center gap-1 font-semibold text-neutral-500 italic">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  No phone registered
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: OPERATIONAL STATISTICS (Renders required cards with placeholders) */}
          <div className="dark:border-neutral-850 space-y-4 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:bg-[#1E1E20]">
            <h3 className="dark:border-neutral-850 flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[18px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
              <Activity className="h-4 w-4 shrink-0 text-blue-500" />
              Operational Statistics
            </h3>

            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
              {/* Card 1: Workers Count */}
              <div className="rounded-lg border border-neutral-200 bg-white p-2.5 dark:border-neutral-800 dark:bg-[#1A1A1C]">
                <span className="text-neutral-450 block text-[11px] font-black uppercase dark:text-neutral-500">
                  Total Workers
                </span>
                <span className="dark:text-neutral-550 mt-1 block font-mono text-xs text-neutral-400 italic">
                  N/A
                </span>
              </div>

              {/* Card 2: Active Workers */}
              <div className="rounded-lg border border-neutral-200 bg-white p-2.5 dark:border-neutral-800 dark:bg-[#1A1A1C]">
                <span className="text-neutral-450 block text-[11px] font-black uppercase dark:text-neutral-500">
                  Active Workers
                </span>
                <span className="dark:text-neutral-555 mt-1 block font-mono text-xs text-neutral-400 italic">
                  N/A
                </span>
              </div>

              {/* Card 3: Inactive Workers */}
              <div className="rounded-lg border border-neutral-200 bg-white p-2.5 dark:border-neutral-800 dark:bg-[#1A1A1C]">
                <span className="text-neutral-450 block text-[11px] font-black uppercase dark:text-neutral-500">
                  Inactive Workers
                </span>
                <span className="dark:text-neutral-555 mt-1 block font-mono text-xs text-neutral-400 italic">
                  N/A
                </span>
              </div>

              {/* Card 4: Average Resolution Time */}
              <div className="rounded-lg border border-neutral-200 bg-white p-2.5 dark:border-neutral-800 dark:bg-[#1A1A1C]">
                <span className="text-neutral-450 block text-[11px] font-black uppercase dark:text-neutral-500">
                  Avg Resolution Time
                </span>
                <span className="dark:text-neutral-555 mt-1 block font-mono text-xs text-neutral-400 italic">
                  N/A
                </span>
              </div>

              {/* Card 5: Pending Reports */}
              <div className="rounded-lg border border-neutral-200 bg-white p-2.5 dark:border-neutral-800 dark:bg-[#1A1A1C]">
                <span className="text-neutral-450 block text-[11px] font-black uppercase dark:text-neutral-500">
                  Pending Reports
                </span>
                <span className="dark:text-neutral-555 mt-1 block font-mono text-xs text-neutral-400 italic">
                  N/A
                </span>
              </div>

              {/* Card 6: Assigned Reports */}
              <div className="rounded-lg border border-neutral-200 bg-white p-2.5 dark:border-neutral-800 dark:bg-[#1A1A1C]">
                <span className="text-neutral-450 block text-[11px] font-black uppercase dark:text-neutral-500">
                  Assigned Reports
                </span>
                <span className="dark:text-neutral-555 mt-1 block font-mono text-xs text-neutral-400 italic">
                  N/A
                </span>
              </div>

              {/* Card 7: In Progress Reports */}
              <div className="rounded-lg border border-neutral-200 bg-white p-2.5 dark:border-neutral-800 dark:bg-[#1A1A1C]">
                <span className="text-neutral-450 block text-[11px] font-black uppercase dark:text-neutral-500">
                  In Progress
                </span>
                <span className="dark:text-neutral-555 mt-1 block font-mono text-xs text-neutral-400 italic">
                  N/A
                </span>
              </div>

              {/* Card 8: Resolved Reports */}
              <div className="rounded-lg border border-neutral-200 bg-white p-2.5 dark:border-neutral-800 dark:bg-[#1A1A1C]">
                <span className="text-neutral-450 block text-[11px] font-black uppercase dark:text-neutral-500">
                  Resolved Reports
                </span>
                <span className="dark:text-neutral-555 mt-1 block font-mono text-xs text-neutral-400 italic">
                  N/A
                </span>
              </div>
            </div>

            <div className="dark:bg-neutral-850 mt-2 flex items-start gap-2.5 rounded-lg border border-neutral-200/40 bg-neutral-100 p-3 select-none dark:border-neutral-800">
              <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#0A3C7D] dark:text-blue-400" />
              <p className="text-[13px] leading-relaxed font-semibold text-neutral-500 dark:text-neutral-400">
                Operational metrics are restricted under current administrative APIs. When backend
                update hooks are released, these widgets will populate without requiring UI layout
                refactoring.
              </p>
            </div>
          </div>

          {/* SECTION 3: RECENT ACTIVITY */}
          <div className="dark:border-neutral-850 space-y-4 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:bg-[#1E1E20]">
            <h3 className="dark:border-neutral-850 flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[18px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
              <Activity className="h-4 w-4 shrink-0 text-blue-500" />
              Recent Operational Events
            </h3>

            <div className="space-y-3.5 text-left select-none">
              <div className="border-neutral-150 dark:border-neutral-850 space-y-1 rounded-lg border bg-white p-3 dark:bg-[#1C1C1E]">
                <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-neutral-800 dark:text-neutral-200">
                  <Clock className="h-4 w-4 text-neutral-500" />
                  Average Operational Load Time
                </h4>
                <p className="text-neutral-450 dark:text-neutral-550 text-[13px] font-semibold italic">
                  Average system processing queues telemetry offline.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
