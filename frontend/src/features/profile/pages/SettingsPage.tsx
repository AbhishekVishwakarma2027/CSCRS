import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  Activity,
  RefreshCw,
  Laptop,
  Smartphone,
  Tablet,
  HelpCircle,
  Eye,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { authService } from '@/features/auth/services/auth.service'
import type { SessionResponse } from '@/types/auth.types'
import { formatDateTime } from '@/utils/format'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/routes/paths'
import { ConfirmationDialog } from '@/features/reports/components/ConfirmationDialog'

// Decode helper to extract the sid claim from the raw JWT refreshToken in localStorage
const getSessionIdFromToken = (): string | null => {
  const token = localStorage.getItem('cscrs_refresh_token')
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length < 3 || !parts[1]) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload).sid || null
  } catch {
    return null
  }
}

// Helper to get device icon and clean name for display
const getDeviceDetails = (deviceType: string | null, os: string | null) => {
  const type = (deviceType || '').toLowerCase()
  const platform = (os || '').toLowerCase()

  let IconComponent = Laptop
  let label = 'PC / Laptop'

  if (type === 'mobile') {
    IconComponent = Smartphone
    label = 'Mobile Phone'
    if (platform.includes('ios') || platform.includes('iphone') || platform.includes('ipad')) {
      label = 'iPhone'
    } else if (platform.includes('android')) {
      label = 'Android Phone'
    }
  } else if (type === 'tablet') {
    IconComponent = Tablet
    label = 'Tablet'
    if (platform.includes('ipad') || platform.includes('ios')) {
      label = 'iPad'
    }
  } else if (type === 'pc') {
    IconComponent = Laptop
    if (platform.includes('mac') || platform.includes('osx') || platform.includes('darwin')) {
      label = 'MacBook / iMac'
    } else if (platform.includes('windows')) {
      label = 'Windows PC'
    } else if (platform.includes('linux')) {
      label = 'Linux PC'
    }
  } else {
    IconComponent = HelpCircle
    label = 'Unknown Device'
  }

  return { IconComponent, label }
}

export default function SettingsPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<SessionResponse[]>([])
  const [hasFetched, setHasFetched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentSessionId = getSessionIdFromToken()

  const fetchSessions = async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const data = await authService.getSessions()

      // Deduplicate/merge sessions that share identical browser/OS/IP signature to show only unique physical devices
      const map = new Map<string, SessionResponse>()
      data.forEach((session) => {
        const key = `${session.device_type || ''}-${session.browser || ''}-${session.operating_system || ''}-${session.ip_address || ''}`
        const existing = map.get(key)

        // Prioritize keeping the current active session token ("This device") if there are duplicates (multiple tabs)
        if (!existing || session.session_id === currentSessionId) {
          map.set(key, session)
        }
      })

      // Set unique sessions list sorted by last used / created
      setSessions(Array.from(map.values()))
      setHasFetched(true)
    } catch {
      setIsError(true)
      toast.error('Failed to load active sessions.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoutAll = async () => {
    setIsSubmitting(true)
    try {
      await authService.logoutAll()
      toast.success('Logged out from all sessions successfully.')
      // Perform local cleanup (clears local token cache and user context)
      await logout()
      navigate(PATHS.LOGIN)
    } catch {
      toast.error('Failed to revoke all sessions.')
    } finally {
      setIsSubmitting(false)
      setIsModalOpen(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10 text-left select-none">
      {/* Header */}
      <div className="dark:border-neutral-850 flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-neutral-800 dark:text-white">
            <Shield className="h-5 w-5" />
            Security & Settings
          </h1>
          <p className="text-neutral-450 mt-1 text-[13px] font-semibold dark:text-neutral-500">
            Monitor active web client sessions, view browser metadata, and manage device access.
          </p>
        </div>
      </div>

      {/* Main Section */}
      <div className="dark:border-neutral-850 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-6 dark:bg-[#1E1E20]">
        <div className="dark:border-neutral-850 flex items-center justify-between border-b border-neutral-200/40 pb-4">
          <h3 className="flex items-center gap-1.5 text-[18px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
            <Activity className="h-4 w-4 shrink-0 text-[#0A3C7D] dark:text-blue-500" />
            Active Login Sessions
          </h3>
          {hasFetched && sessions.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => void fetchSessions()}
                disabled={isLoading}
                className="h-8 w-8 p-0"
                title="Refresh sessions"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setIsModalOpen(true)}
                className="border-rose-250 h-8 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/20"
              >
                Log Out All Devices
              </Button>
            </div>
          )}
        </div>

        {/* Sessions Area */}
        <div className="mt-5">
          {!hasFetched && !isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
              <p className="max-w-md text-[13px] font-semibold text-neutral-500 dark:text-neutral-400">
                For security and privacy, device sessions are not loaded automatically. Click below
                to retrieve the list of active sessions logged into your account.
              </p>
              <Button
                type="button"
                onClick={() => void fetchSessions()}
                className="flex h-9 items-center gap-1.5 bg-[#0A3C7D] px-4 text-xs font-bold text-white hover:bg-[#0A3C7D]/90 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <Eye className="h-4 w-4" />
                View Active Sessions
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-neutral-400">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0A3C7D] border-t-transparent" />
                <span className="text-[13px] font-bold">Querying session records...</span>
              </div>
            </div>
          ) : isError ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-center text-rose-600">
              <span className="text-[13px] font-bold">Failed to load active sessions.</span>
              <Button
                variant="outline"
                size="xs"
                onClick={() => void fetchSessions()}
                className="mt-2 text-xs font-bold"
              >
                Retry
              </Button>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-center text-neutral-500">
              <span className="text-[13px] font-bold">No active sessions found.</span>
            </div>
          ) : (
            <div className="animate-in fade-in space-y-4 duration-300">
              {sessions.map((session) => {
                const isCurrent = session.session_id === currentSessionId
                const { IconComponent, label: deviceLabel } = getDeviceDetails(
                  session.device_type,
                  session.operating_system
                )
                return (
                  <div
                    key={session.session_id}
                    className={`flex items-start justify-between rounded-lg border p-4 transition-all ${
                      isCurrent
                        ? 'border-emerald-250 bg-emerald-50/10 dark:border-emerald-900/30'
                        : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#1C1C1E]'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="dark:bg-neutral-850 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                        <IconComponent className="text-neutral-550 h-5 w-5 dark:text-neutral-400" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-extrabold text-neutral-800 dark:text-neutral-200">
                            {deviceLabel} ({session.browser || 'Unknown Browser'})
                          </span>
                          {isCurrent && (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black tracking-wider text-emerald-700 uppercase dark:bg-emerald-950/40 dark:text-emerald-400">
                              This device
                            </span>
                          )}
                        </div>
                        <div className="space-y-0.5 text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
                          <p>
                            IP Address:{' '}
                            <span className="font-bold text-neutral-700 dark:text-neutral-300">
                              {session.ip_address || 'Unknown'}
                            </span>
                          </p>
                          <p>
                            Created:{' '}
                            <span className="font-bold text-neutral-700 dark:text-neutral-300">
                              {formatDateTime(session.created_at)}
                            </span>
                          </p>
                          {session.last_used_at && (
                            <p>
                              Last Activity:{' '}
                              <span className="font-bold text-neutral-700 dark:text-neutral-300">
                                {formatDateTime(session.last_used_at)}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100/60 px-2 py-0.5 text-[9px] font-black tracking-wider text-emerald-700 uppercase dark:border-emerald-900/30 dark:bg-emerald-950/20">
                        Active
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isModalOpen}
        title="Log Out All Devices"
        description="Are you sure you want to log out from all devices? This will invalidate all active sessions, including your current login session, and require you to sign back in."
        confirmLabel="Log Out All"
        cancelLabel="Keep Sessions"
        isDanger={true}
        isSubmitting={isSubmitting}
        onConfirm={() => void handleLogoutAll()}
        onCancel={() => setIsModalOpen(false)}
      />
    </div>
  )
}
