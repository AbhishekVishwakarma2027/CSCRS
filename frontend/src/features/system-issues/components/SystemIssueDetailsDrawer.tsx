import React, { useEffect, useRef } from 'react'
import { X, Activity, User, Mail, Phone, Calendar, Image as ImageIcon } from 'lucide-react'
import { formatDate } from '@/utils/format'
import type { SystemIssueListItem, MySystemIssueItem } from '../types'
import { useSystemIssueDetailQuery } from '../hooks/use-system-issues'

interface SystemIssueDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  issue: SystemIssueListItem | MySystemIssueItem | null
}

export function SystemIssueDetailsDrawer({
  isOpen,
  onClose,
  issue,
}: SystemIssueDetailsDrawerProps) {
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
  const issueNumber = issue?.issue_number || null
  const { data: detailData, isLoading } = useSystemIssueDetailQuery(issueNumber)

  if (!isOpen || !issue) return null

  const activeIssue = detailData || null

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
        aria-labelledby="issue-drawer-title"
        className="animate-in slide-in-from-right-full fixed inset-y-0 right-0 z-50 flex w-full transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out md:max-w-2xl lg:max-w-2xl dark:bg-[#1C1C1E]"
      >
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-neutral-200 p-4 select-none dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="issue-drawer-title"
                className="dark:text-blue-450 text-xl font-black tracking-widest text-[#0A3C7D] uppercase"
              >
                System Issue Details
              </h2>
              <span className="text-neutral-450 mt-0.5 block text-[13px] font-semibold dark:text-neutral-500">
                Issue No: {issue.issue_number}
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
              <Activity className="h-4 w-4 shrink-0 text-blue-500" />
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
                  <div className="col-span-2">
                    <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase dark:text-neutral-500">
                      Title
                    </span>
                    <span className="mt-1 block font-extrabold text-neutral-800 dark:text-neutral-200">
                      {activeIssue?.title || issue.title}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase dark:text-neutral-500">
                      Status
                    </span>
                    <span
                      className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                        (activeIssue?.status || issue.status) === 'RESOLVED'
                          ? 'dark:text-emerald-450 border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20'
                          : (activeIssue?.status || issue.status) === 'IN_REVIEW'
                            ? 'dark:text-blue-450 border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/20'
                            : (activeIssue?.status || issue.status) === 'OPEN'
                              ? 'dark:text-amber-450 border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20'
                              : 'dark:text-rose-450 border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20'
                      }`}
                    >
                      {activeIssue?.status || issue.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase dark:text-neutral-500">
                      Category
                    </span>
                    <span className="mt-1 block font-semibold text-neutral-800 dark:text-neutral-200">
                      {activeIssue?.category || issue.category}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase dark:text-neutral-500">
                      Created Date
                    </span>
                    <span className="mt-1 flex items-center gap-1 font-semibold text-neutral-500 dark:text-neutral-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(activeIssue?.created_at || issue.created_at)}
                    </span>
                  </div>

                  {activeIssue?.related_report_number && (
                    <div>
                      <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase dark:text-neutral-500">
                        Related Report
                      </span>
                      <span className="mt-1 block font-mono text-neutral-800 dark:text-neutral-200">
                        {activeIssue.related_report_number}
                      </span>
                    </div>
                  )}
                </div>

                <div className="dark:border-neutral-850 border-t border-neutral-100 pt-3">
                  <span className="text-neutral-450 block text-[9px] font-black tracking-wider uppercase dark:text-neutral-500">
                    Description
                  </span>
                  <p className="mt-1 leading-relaxed font-semibold whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">
                    {activeIssue?.description || 'Loading detailed description...'}
                  </p>
                </div>

                {activeIssue?.remarks && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/20">
                    <span className="block text-[10px] font-black tracking-wider text-blue-700 uppercase dark:text-blue-400">
                      Admin Remarks / Resolution Notes
                    </span>
                    <p className="mt-1 text-[13px] font-bold text-neutral-800 dark:text-neutral-200">
                      {activeIssue.remarks}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* REPORTER INFO */}
          {activeIssue && (
            <div className="dark:border-neutral-850 space-y-3.5 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:bg-[#1E1E20]">
              <h3 className="dark:border-neutral-850 flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[18px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                <User className="h-4 w-4 shrink-0 text-blue-500" />
                Reporter Details
              </h3>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                <div>
                  <span className="text-neutral-450 block text-[9px] font-black tracking-wider uppercase dark:text-neutral-500">
                    Name
                  </span>
                  <span className="mt-1 flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-300">
                    <User className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    {activeIssue.reporter_name}
                  </span>
                </div>

                <div>
                  <span className="text-neutral-450 block text-[9px] font-black tracking-wider uppercase dark:text-neutral-500">
                    Email
                  </span>
                  <span className="mt-1 flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-300">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    {activeIssue.reporter_email}
                  </span>
                </div>

                {activeIssue.reporter_phone && (
                  <div>
                    <span className="text-neutral-450 block text-[9px] font-black tracking-wider uppercase dark:text-neutral-500">
                      Phone
                    </span>
                    <span className="mt-1 flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-300">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                      {activeIssue.reporter_phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ATTACHMENTS */}
          {activeIssue?.attachments && activeIssue.attachments.length > 0 && (
            <div className="dark:border-neutral-850 space-y-3.5 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:bg-[#1E1E20]">
              <h3 className="dark:border-neutral-850 flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[18px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                <ImageIcon className="h-4 w-4 shrink-0 text-blue-500" />
                Attachments
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {activeIssue.attachments.map((attachment, idx) => (
                  <a
                    key={idx}
                    href={attachment.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-[#1A1A1C] dark:hover:bg-neutral-800/80"
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="truncate text-[13px] font-bold text-[#0A3C7D] dark:text-blue-400">
                        {attachment.original_filename}
                      </p>
                      <p className="text-[11px] font-semibold text-neutral-500">
                        {(attachment.file_size / 1024 / 1024).toFixed(2)} MB •{' '}
                        {attachment.mime_type}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
