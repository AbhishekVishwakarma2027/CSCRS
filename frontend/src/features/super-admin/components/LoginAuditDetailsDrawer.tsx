import React, { useEffect, useRef } from 'react'
import {
  X,
  Lock,
  User,
  Globe,
  Laptop,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Calendar,
  Hash,
  AlertTriangle,
} from 'lucide-react'
import type { LoginAuditItem } from '../types'
import { formatDate } from '@/utils/format'

interface LoginAuditDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  audit: LoginAuditItem | null
}

export function LoginAuditDetailsDrawer({ isOpen, onClose, audit }: LoginAuditDetailsDrawerProps) {
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

  if (!isOpen || !audit) return null

  // Compute location display string if city/state/country exist
  const locationParts = [audit.city, audit.state, audit.country].filter(Boolean)
  const locationString = locationParts.length > 0 ? locationParts.join(', ') : null

  // Compute browser display string
  const browserString = [audit.browser, audit.browser_version].filter(Boolean).join(' ') || null

  // Compute OS display string
  const osString = [audit.operating_system, audit.os_version].filter(Boolean).join(' ') || null

  // Compute device/platform display string
  const deviceString = [audit.device_type, audit.platform].filter(Boolean).join(' / ') || null

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
        aria-labelledby="login-audit-drawer-title"
        className="animate-in slide-in-from-right-full fixed inset-y-0 right-0 z-50 flex w-full transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out md:max-w-2xl lg:max-w-2xl dark:bg-[#1C1C1E]"
      >
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-neutral-200 p-4 select-none dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="login-audit-drawer-title"
                className="text-xl font-black tracking-widest text-[#0A3C7D] uppercase dark:text-indigo-400"
              >
                Login Security Audit Details
              </h2>
              <span className="mt-0.5 block text-[13px] font-semibold text-neutral-500 dark:text-neutral-400">
                Security Record ID: #{audit.id}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-transparent text-neutral-400 transition-colors outline-none hover:bg-neutral-100 hover:text-neutral-700 focus:border-[#0A3C7D] dark:hover:bg-neutral-800 dark:focus:border-indigo-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Viewport */}
        <div className="flex-1 scrollbar-thin space-y-6 overflow-y-auto p-5 text-[13px] font-bold text-neutral-700 dark:text-neutral-300">
          {/* SECTION 1: RESULT & SECURITY DETAILS */}
          <div className="space-y-4 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-[#1E1E20]">
            <h3 className="flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[14px] font-black tracking-wider text-neutral-400 uppercase dark:border-neutral-800 dark:text-neutral-500">
              <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-500" />
              Result & Security Verification
            </h3>

            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                <div>
                  <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                    Authentication Status
                  </span>
                  <div className="mt-1">
                    {audit.login_success ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Successful Authentication
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-black tracking-wide text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                        <XCircle className="h-3.5 w-3.5" />
                        Failed Login Attempt
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                    Login Source
                  </span>
                  <span className="mt-1 block font-bold text-neutral-800 dark:text-neutral-200">
                    {audit.login_source || 'Not available'}
                  </span>
                </div>
              </div>

              {/* Failure Reason Banner */}
              {!audit.login_success && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 dark:border-rose-900/40 dark:bg-rose-950/20">
                  <div className="flex items-center gap-1.5 text-xs font-black text-rose-700 uppercase dark:text-rose-400">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>Security Alert / Failure Reason</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed font-bold break-words whitespace-pre-wrap text-rose-800 dark:text-rose-200">
                    {audit.failure_reason || 'Invalid email or password credentials provided.'}
                  </p>
                </div>
              )}

              {/* Session / Token Details if present */}
              {(audit.session_id || audit.jwt_id) && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-neutral-200/40 pt-2 dark:border-neutral-800">
                  {audit.session_id && (
                    <div className="col-span-2 sm:col-span-1">
                      <span className="block text-[10px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                        Session Identifier
                      </span>
                      <span className="mt-0.5 block font-mono text-xs font-bold break-all text-neutral-700 dark:text-neutral-300">
                        {audit.session_id}
                      </span>
                    </div>
                  )}
                  {audit.jwt_id && (
                    <div className="col-span-2 sm:col-span-1">
                      <span className="block text-[10px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                        JWT Token JTI
                      </span>
                      <span className="mt-0.5 block font-mono text-xs font-bold break-all text-neutral-700 dark:text-neutral-300">
                        {audit.jwt_id}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: USER / ACCOUNT IDENTITY */}
          <div className="space-y-4 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-[#1E1E20]">
            <h3 className="flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[14px] font-black tracking-wider text-neutral-400 uppercase dark:border-neutral-800 dark:text-neutral-500">
              <User className="h-4 w-4 shrink-0 text-indigo-500" />
              User & Account Identity
            </h3>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
              <div className="col-span-2 sm:col-span-1">
                <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                  Email Address
                </span>
                <span className="mt-1 block font-bold break-words text-neutral-900 dark:text-white">
                  {audit.email || 'Not available'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                  Account Identity
                </span>
                <span className="mt-1 flex items-center gap-1 font-bold text-neutral-800 dark:text-neutral-200">
                  <User className="h-3.5 w-3.5 text-indigo-500" />
                  {audit.user_id ? `User ID #${audit.user_id}` : 'Anonymous / Unregistered User'}
                </span>
              </div>

              {audit.role && (
                <div>
                  <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                    Account Role
                  </span>
                  <span className="mt-1 inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-black text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                    {audit.role}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: LOGIN EVENT TIMINGS */}
          <div className="space-y-4 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-[#1E1E20]">
            <h3 className="flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[14px] font-black tracking-wider text-neutral-400 uppercase dark:border-neutral-800 dark:text-neutral-500">
              <Calendar className="h-4 w-4 shrink-0 text-indigo-500" />
              Event Timeline & Audit Metadata
            </h3>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
              <div>
                <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                  Audit Record ID
                </span>
                <span className="mt-1 flex items-center gap-1 font-mono text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  <Hash className="h-3.5 w-3.5 text-neutral-400" />#{audit.id}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                  Login Timestamp
                </span>
                <span className="mt-1 flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-300">
                  <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                  {audit.login_at ? formatDate(audit.login_at) : 'Not available'}
                </span>
              </div>

              {audit.logout_at && (
                <div>
                  <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                    Logout Timestamp
                  </span>
                  <span className="mt-1 flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-300">
                    <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                    {formatDate(audit.logout_at)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: NETWORK & LOCATION */}
          <div className="space-y-4 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-[#1E1E20]">
            <h3 className="flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[14px] font-black tracking-wider text-neutral-400 uppercase dark:border-neutral-800 dark:text-neutral-500">
              <Globe className="h-4 w-4 shrink-0 text-indigo-500" />
              Network & Routing Information
            </h3>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
              <div>
                <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                  Client IP Address
                </span>
                <span className="mt-1 block font-mono text-sm font-bold text-neutral-900 dark:text-white">
                  {audit.ip_address || 'Not available'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                  Geo Location
                </span>
                <span className="mt-1 block font-semibold text-neutral-800 dark:text-neutral-200">
                  {locationString || 'Not available'}
                </span>
              </div>

              {audit.http_method && (
                <div>
                  <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                    HTTP Method
                  </span>
                  <span className="mt-1 inline-flex items-center rounded bg-neutral-200 px-2 py-0.5 font-mono text-xs font-bold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                    {audit.http_method}
                  </span>
                </div>
              )}

              {audit.request_path && (
                <div>
                  <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                    Request Path
                  </span>
                  <span className="mt-1 block font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    {audit.request_path}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5: CLIENT & DEVICE INFORMATION */}
          <div className="space-y-4 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-[#1E1E20]">
            <h3 className="flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[14px] font-black tracking-wider text-neutral-400 uppercase dark:border-neutral-800 dark:text-neutral-500">
              <Laptop className="h-4 w-4 shrink-0 text-indigo-500" />
              Client Environment & User Agent
            </h3>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
              <div>
                <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                  Browser
                </span>
                <span className="mt-1 block font-bold text-neutral-800 dark:text-neutral-200">
                  {browserString || 'Not available'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                  Operating System
                </span>
                <span className="mt-1 block font-bold text-neutral-800 dark:text-neutral-200">
                  {osString || 'Not available'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                  Device / Platform
                </span>
                <span className="mt-1 block font-bold text-neutral-800 dark:text-neutral-200">
                  {deviceString || 'Not available'}
                </span>
              </div>
            </div>

            {/* Complete User Agent Box */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-100/70 p-3.5 dark:border-neutral-800 dark:bg-[#18181A]">
              <span className="block text-[10px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
                Full User-Agent String
              </span>
              <p className="mt-1.5 font-mono text-[12px] leading-relaxed font-medium break-words whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
                {audit.user_agent || 'Not available'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
