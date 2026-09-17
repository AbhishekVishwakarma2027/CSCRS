import React, { useEffect, useRef } from 'react'
import { X, Shield, User, FileText, Calendar, Hash } from 'lucide-react'
import type { AuditLogItem } from '../types'
import { formatDate } from '@/utils/format'

interface AuditLogDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  log: AuditLogItem | null
}

export function AuditLogDetailsDrawer({ isOpen, onClose, log }: AuditLogDetailsDrawerProps) {
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

  if (!isOpen || !log) return null

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
        aria-labelledby="audit-log-drawer-title"
        className="animate-in slide-in-from-right-full fixed inset-y-0 right-0 z-50 flex w-full transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out md:max-w-2xl lg:max-w-2xl dark:bg-[#1C1C1E]"
      >
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-neutral-200 p-4 select-none dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="audit-log-drawer-title"
                className="text-xl font-black tracking-widest text-[#0A3C7D] uppercase dark:text-blue-400"
              >
                System Action Audit Details
              </h2>
              <span className="mt-0.5 block text-[13px] font-semibold text-neutral-500 dark:text-neutral-400">
                Audit Record ID: #{log.id}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-transparent text-neutral-400 transition-colors outline-none hover:bg-neutral-100 hover:text-neutral-700 focus:border-[#0A3C7D] dark:hover:bg-neutral-800 dark:focus:border-blue-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Viewport */}
        <div className="flex-1 scrollbar-thin space-y-6 overflow-y-auto p-5 text-[13px] font-bold text-neutral-700 dark:text-neutral-300">
          {/* SECTION 1: AUDIT INFORMATION */}
          <div className="space-y-4 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-[#1E1E20]">
            <h3 className="flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[14px] font-black tracking-wider text-neutral-400 uppercase dark:border-neutral-800 dark:text-neutral-500">
              <Shield className="h-4 w-4 shrink-0 text-blue-500" />
              Audit Information
            </h3>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
              <div>
                <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                  Audit ID
                </span>
                <span className="mt-1 flex items-center gap-1 font-mono text-sm font-extrabold text-neutral-800 dark:text-neutral-200">
                  <Hash className="h-3.5 w-3.5 text-neutral-400" />#{log.id}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                  Timestamp
                </span>
                <span className="mt-1 flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-300">
                  <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                  {log.created_at ? formatDate(log.created_at) : 'Not available'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                  Action Executed
                </span>
                <span className="mt-1 inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-black tracking-wide text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  {log.action}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                  Target Report ID
                </span>
                <span className="mt-1 block font-mono text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  {log.report_id ? `#${log.report_id}` : 'Not available'}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: ACTOR INFORMATION */}
          <div className="space-y-4 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-[#1E1E20]">
            <h3 className="flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[14px] font-black tracking-wider text-neutral-400 uppercase dark:border-neutral-800 dark:text-neutral-500">
              <User className="h-4 w-4 shrink-0 text-blue-500" />
              Actor / User Identity
            </h3>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
              <div>
                <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                  Initiating User
                </span>
                <span className="mt-1 flex items-center gap-1.5 font-bold text-neutral-800 dark:text-neutral-200">
                  <User className="h-3.5 w-3.5 text-blue-500" />
                  {log.user_id ? `User ID #${log.user_id}` : 'System / Automated Event'}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: ACTION DETAILS */}
          <div className="space-y-3 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-[#1E1E20]">
            <h3 className="flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[14px] font-black tracking-wider text-neutral-400 uppercase dark:border-neutral-800 dark:text-neutral-500">
              <FileText className="h-4 w-4 shrink-0 text-blue-500" />
              Full Action Content & Metadata
            </h3>

            <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#18181A]">
              <span className="block text-[10px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                Action Message / Raw Payload
              </span>
              <p className="mt-2 leading-relaxed font-semibold break-words whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
                {log.details || 'Not available'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
