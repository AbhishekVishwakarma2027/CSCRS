import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Calendar,
  MapPin,
  User,
  Cpu,
  History,
  UserCheck,
  Image as ImageIcon,
  AlertCircle,
  Info,
  MoveUp,
  MoveDown,
  MoveLeft,
  MoveRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/utils/format'
import { APP_CONFIG } from '@/config/app.config'
import type { ReportListItem } from '../types'
import { useReportDetailsQuery, useReportTimelineQuery } from '../hooks/use-reports'
import { useAuth } from '@/hooks/use-auth'
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

interface ReportDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  report: ReportListItem | null
  departmentsMap: Record<number, string>
}

export function ReportDetailsDrawer({
  isOpen,
  onClose,
  report,
  departmentsMap,
}: ReportDetailsDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  // Zoom / Pan image states
  const [imgZoom, setImgZoom] = useState(1)
  const [imgPanX, setImgPanX] = useState(0)
  const [imgPanY, setImgPanY] = useState(0)
  const [imgIsFullscreen, setImgIsFullscreen] = useState(false)
  const [activeImageTab, setActiveImageTab] = useState<'original' | 'annotated'>('original')

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

  // Reset image status on report change
  useEffect(() => {
    setImgZoom(1)
    setImgPanX(0)
    setImgPanY(0)
    setImgIsFullscreen(false)
    setActiveImageTab('original')
  }, [report])

  const { user } = useAuth()
  const isDeptAdmin = user?.role === UserRole.DEPARTMENT_ADMIN

  // Initialize TanStack Queries (only enabled when drawer is open and not department admin)
  const reportNumber = report?.report_number || ''
  const reportId = report?.id || 0

  const {
    data: details,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useReportDetailsQuery(reportNumber, isOpen && !!reportNumber && !isDeptAdmin)

  const {
    data: timelineData,
    isLoading: isTimelineLoading,
    error: timelineError,
  } = useReportTimelineQuery(reportId, isOpen && !!reportId && !isDeptAdmin)

  if (!isOpen || !report) return null

  // Image helpers
  const originalImageUrl = report.id
    ? `${APP_CONFIG.apiBaseUrl}/api/v1/reports/${report.id}/image`
    : undefined

  // Coordinates formatting
  const hasCoordinates =
    (!isDeptAdmin &&
      details &&
      details.latitude !== undefined &&
      details.longitude !== undefined) ||
    false
  const latitude = details?.latitude || 0
  const longitude = details?.longitude || 0
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`

  // Zoom/Pan actions handlers
  const handleZoomIn = () => setImgZoom((z) => Math.min(z + 0.5, 3.5))
  const handleZoomOut = () => {
    setImgZoom((z) => {
      const next = Math.max(z - 0.5, 1)
      if (next === 1) {
        setImgPanX(0)
        setImgPanY(0)
      }
      return next
    })
  }
  const handlePan = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (imgZoom === 1) return
    const step = 40
    if (direction === 'up') setImgPanY((y) => y - step)
    if (direction === 'down') setImgPanY((y) => y + step)
    if (direction === 'left') setImgPanX((x) => x - step)
    if (direction === 'right') setImgPanX((x) => x + step)
  }
  const handleResetImage = () => {
    setImgZoom(1)
    setImgPanX(0)
    setImgPanY(0)
  }

  // Determine auth timeline restriction
  const isTimelineRestricted =
    isDeptAdmin ||
    (timelineError &&
      (timelineError as { response?: { status?: number } }).response?.status === 403)

  return (
    <>
      {/* 1. Backdrop Overlay */}
      <div
        className="animate-in fade-in fixed inset-0 z-50 bg-neutral-900/60 transition-opacity duration-300 dark:bg-black/80"
        onClick={onClose}
      />

      {/* 2. Slide-over Drawer Pane */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="animate-in slide-in-from-right-full fixed inset-y-0 right-0 z-50 flex w-full transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out md:max-w-2xl lg:max-w-2xl dark:bg-[#1C1C1E]"
      >
        {/* Header Widget */}
        <div className="flex items-center justify-between border-b border-neutral-200 p-4 select-none dark:border-neutral-800">
          <div>
            <h2
              id="drawer-title"
              className="dark:text-blue-450 text-xl font-black tracking-widest text-[#0A3C7D] uppercase"
            >
              Audit File details
            </h2>
            <span className="text-neutral-450 mt-0.5 block text-[13px] font-semibold dark:text-neutral-500">
              Reference: {report.report_number}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-450 dark:hover:bg-neutral-850 flex size-8 cursor-pointer items-center justify-center rounded-lg border border-transparent transition-colors outline-none hover:bg-neutral-100 hover:text-neutral-700 focus:border-[#0A3C7D] dark:focus:border-blue-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Viewport scrollable */}
        <div className="dark:text-neutral-350 flex-1 scrollbar-thin space-y-6 overflow-y-auto p-5 text-[13px] font-bold text-neutral-700">
          {/* SECTION A: REPORT SUMMARY (Standard properties from listing row) */}
          <div className="dark:border-neutral-850 space-y-4 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:bg-[#1E1E20]">
            <h3 className="dark:border-neutral-850 flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[18px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
              <AlertCircle className="h-4 w-4 shrink-0 text-blue-500" />
              Overview Summary
            </h3>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
              <div>
                <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Status
                </span>
                <span
                  className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                    STATUS_BADGES[report.status] || 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {report.status}
                </span>
              </div>

              <div>
                <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Priority
                </span>
                <span
                  className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                    PRIORITY_BADGES[report.priority] || 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {report.priority}
                </span>
              </div>

              <div>
                <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Category
                </span>
                <span className="text-neutral-850 mt-1 block font-bold capitalize dark:text-neutral-200">
                  {report.issue_type.toLowerCase()}
                </span>
              </div>

              <div>
                <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Department
                </span>
                <span className="mt-1 block font-bold text-neutral-800 dark:text-neutral-300">
                  {report.department_id ? departmentsMap[report.department_id] : 'Unassigned'}
                </span>
              </div>

              <div>
                <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Created Date
                </span>
                <span className="mt-1 block font-semibold text-neutral-500 dark:text-neutral-400">
                  {formatDate(report.created_at)}
                </span>
              </div>

              <div>
                <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Source
                </span>
                <span className="mt-1 block font-semibold text-neutral-500 dark:text-neutral-400">
                  Citizen Portal (Mobile)
                </span>
              </div>
            </div>
          </div>

          {/* SECTION B: CITIZEN INFORMATION */}
          <div className="dark:border-neutral-850 space-y-3 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:bg-[#1E1E20]">
            <h3 className="dark:border-neutral-850 flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[18px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
              <User className="h-4 w-4 shrink-0 text-blue-500" />
              Citizen Submitter Information
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-neutral-450 block text-[9px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Citizen Identifier
                </span>
                <span className="mt-1 block font-bold text-neutral-800 dark:text-neutral-300">
                  #{report.citizen_id}
                </span>
              </div>
              <div>
                <span className="text-neutral-450 block text-[9px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Access Control Privacy
                </span>
                <span className="mt-1 block font-medium text-neutral-500 dark:text-neutral-400">
                  Fully Redacted (RBAC standard)
                </span>
              </div>
            </div>
          </div>

          {/* SECTION C: DESCRIPTION */}
          <div className="dark:border-neutral-850 space-y-3 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:bg-[#1E1E20]">
            <h3 className="dark:border-neutral-850 flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[18px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
              <ImageIcon className="h-4 w-4 shrink-0 text-blue-500" />
              Report Description
            </h3>
            {isDetailsLoading ? (
              <div className="dark:bg-neutral-850 h-6 w-full animate-pulse rounded bg-neutral-200" />
            ) : isDeptAdmin || detailsError ? (
              <p className="text-neutral-450 dark:text-neutral-550 font-semibold italic">
                Description telemetry restricted under active admin credentials (403 Forbidden).
              </p>
            ) : details?.address ? (
              <p className="leading-relaxed font-bold text-neutral-800 dark:text-neutral-200">
                {details.address}
              </p>
            ) : (
              <p className="text-neutral-450 font-medium italic dark:text-neutral-500">
                No description remarks uploaded by the reporting citizen.
              </p>
            )}
          </div>

          {/* SECTION D: LOCATION */}
          <div className="dark:border-neutral-850 space-y-4.5 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:bg-[#1E1E20]">
            <h3 className="dark:border-neutral-850 flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[18px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
              <MapPin className="h-4 w-4 shrink-0 text-blue-500" />
              Coordinates & Mapping details
            </h3>

            {isDetailsLoading ? (
              <div className="space-y-2">
                <div className="dark:bg-neutral-850 h-3 w-40 animate-pulse rounded bg-neutral-200" />
                <div className="dark:bg-neutral-850 h-3 w-32 animate-pulse rounded bg-neutral-200" />
              </div>
            ) : isDeptAdmin || detailsError ? (
              <div className="space-y-3">
                <p className="text-neutral-450 dark:text-neutral-555 leading-relaxed font-semibold italic">
                  Geolocations are restricted under admin credentials. No iframe maps embedded.
                </p>
                <div className="dark:bg-neutral-850 flex items-start gap-2 rounded-lg border border-neutral-200/40 bg-neutral-100 p-3 dark:border-neutral-800">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0A3C7D] dark:text-blue-400" />
                  <p className="text-[13px] leading-relaxed font-semibold text-neutral-500 dark:text-neutral-400">
                    FastAPI enforces strict user checks. Coordinates can be verified if the report
                    enters Manual Review validation.
                  </p>
                </div>
              </div>
            ) : hasCoordinates ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs font-bold text-neutral-600 dark:text-neutral-400">
                  <div>
                    <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase">
                      Latitude
                    </span>
                    <span className="mt-0.5 block font-mono text-neutral-800 dark:text-neutral-200">
                      {latitude}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase">
                      Longitude
                    </span>
                    <span className="mt-0.5 block font-mono text-neutral-800 dark:text-neutral-200">
                      {longitude}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => window.open(googleMapsUrl, '_blank')}
                  className="flex h-8.5 w-full cursor-pointer items-center justify-center gap-1.5 text-neutral-700 dark:border-neutral-800 dark:text-neutral-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in Google Maps
                </Button>
              </div>
            ) : (
              <p className="text-neutral-450 font-semibold italic dark:text-neutral-500">
                No GPS details recorded.
              </p>
            )}
          </div>

          {/* SECTION E: IMAGES WITH ZOOM & PAN */}
          <div className="dark:border-neutral-850 space-y-4 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:bg-[#1E1E20]">
            <h3 className="dark:border-neutral-850 flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[18px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
              <ImageIcon className="h-4 w-4 shrink-0 text-blue-500" />
              Attached Proof Image
            </h3>

            {isDetailsLoading ? (
              <div className="dark:bg-neutral-850 aspect-video animate-pulse rounded-lg bg-neutral-200" />
            ) : isDeptAdmin || detailsError ? (
              <div className="dark:bg-neutral-850/40 flex aspect-video flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-100/50 p-4 text-center dark:border-neutral-800">
                <AlertCircle className="h-6 w-6 text-neutral-400 dark:text-neutral-500" />
                <h5 className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                  Image Authorization Restricted
                </h5>
                <p className="text-neutral-450 max-w-xs text-[11px] leading-relaxed font-semibold dark:text-neutral-500">
                  Image files are citizen-restricted for this report. Image access is granted only
                  during operational workflow manual review states.
                </p>
              </div>
            ) : originalImageUrl ? (
              <div className="space-y-3">
                {/* Image Navigation Tab */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={activeImageTab === 'original' ? 'default' : 'outline'}
                    size="xs"
                    onClick={() => {
                      setActiveImageTab('original')
                      handleResetImage()
                    }}
                    className={`h-7 cursor-pointer text-[10px] font-bold ${
                      activeImageTab === 'original'
                        ? 'bg-[#0A3C7D] hover:bg-[#0A3C7D]/95'
                        : 'dark:border-neutral-800'
                    }`}
                  >
                    Original Photo
                  </Button>
                  <Button
                    type="button"
                    variant={activeImageTab === 'annotated' ? 'default' : 'outline'}
                    size="xs"
                    onClick={() => {
                      setActiveImageTab('annotated')
                      handleResetImage()
                    }}
                    className={`h-7 cursor-pointer text-[10px] font-bold ${
                      activeImageTab === 'annotated'
                        ? 'bg-[#0A3C7D] hover:bg-[#0A3C7D]/95'
                        : 'dark:border-neutral-800'
                    }`}
                  >
                    Annotated Preview
                  </Button>
                </div>

                {/* Viewport Frame */}
                <div
                  className={`relative flex items-center justify-center overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 transition-all duration-300 ${
                    imgIsFullscreen
                      ? 'fixed inset-0 z-[100] m-0 h-full w-full'
                      : 'aspect-video w-full'
                  }`}
                >
                  <img
                    src={originalImageUrl}
                    alt={`${activeImageTab} report proof`}
                    style={{
                      transform: `scale(${imgZoom}) translate(${imgPanX}px, ${imgPanY}px)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                    className="pointer-events-none max-h-full max-w-full object-contain select-none"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src =
                        'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%2260%22 height%3D%2260%22 viewBox%3D%220 0 24 24%22 fill%3D%22none%22 stroke%3D%22%23F43F5E%22 stroke-width%3D%221.5%22 stroke-linecap%3D%22round%22 stroke-linejoin%3D%22round%22%3E%3Cpath d%3D%22m21 16-4-4-4 4%22%2F%3E%3Cpath d%3D%22m17 2-3 3%22%2F%3E%3Cpath d%3D%22m2 22 20-20%22%2F%3E%3Cpath d%3D%22M22 16V9c0-1.1-.9-2-2-2h-3%22%2F%3E%3Cpath d%3D%22M7 7H4c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2%22%2F%3E%3C%2Fsvg%3E'
                    }}
                  />

                  {/* Controller Widget Overlay */}
                  <div className="absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-xl border border-neutral-800/80 bg-black/75 px-2 py-1.5 text-white">
                    <button
                      type="button"
                      onClick={handleZoomIn}
                      className="cursor-pointer rounded p-1 transition-colors hover:bg-neutral-800"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleZoomOut}
                      className="cursor-pointer rounded p-1 transition-colors hover:bg-neutral-800"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </button>

                    <div className="mx-1 h-4 w-px bg-neutral-800" />

                    <button
                      type="button"
                      onClick={() => handlePan('left')}
                      disabled={imgZoom === 1}
                      className="cursor-pointer rounded p-1 transition-colors hover:bg-neutral-800 disabled:opacity-30"
                      title="Pan Left"
                    >
                      <MoveLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePan('right')}
                      disabled={imgZoom === 1}
                      className="cursor-pointer rounded p-1 transition-colors hover:bg-neutral-800 disabled:opacity-30"
                      title="Pan Right"
                    >
                      <MoveRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePan('up')}
                      disabled={imgZoom === 1}
                      className="cursor-pointer rounded p-1 transition-colors hover:bg-neutral-800 disabled:opacity-30"
                      title="Pan Up"
                    >
                      <MoveUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePan('down')}
                      disabled={imgZoom === 1}
                      className="cursor-pointer rounded p-1 transition-colors hover:bg-neutral-800 disabled:opacity-30"
                      title="Pan Down"
                    >
                      <MoveDown className="h-3.5 w-3.5" />
                    </button>

                    <div className="mx-1 h-4 w-px bg-neutral-800" />

                    <button
                      type="button"
                      onClick={handleResetImage}
                      className="cursor-pointer rounded border border-neutral-800 px-1.5 py-0.5 text-[11px] font-black transition-colors hover:bg-neutral-800"
                    >
                      RESET
                    </button>

                    <button
                      type="button"
                      onClick={() => setImgIsFullscreen(!imgIsFullscreen)}
                      className="cursor-pointer rounded p-1 transition-colors hover:bg-neutral-800"
                      title={imgIsFullscreen ? 'Minimize' : 'Maximize'}
                    >
                      {imgIsFullscreen ? (
                        <Minimize2 className="h-3.5 w-3.5" />
                      ) : (
                        <Maximize2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-neutral-450 font-semibold italic dark:text-neutral-500">
                No images available.
              </p>
            )}
          </div>

          {/* SECTION F: AI VERIFICATION */}
          <div className="dark:border-neutral-850 space-y-3 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:bg-[#1E1E20]">
            <h3 className="dark:border-neutral-850 flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[18px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
              <Cpu className="h-4 w-4 shrink-0 text-blue-500" />
              Automated AI Telemetry
            </h3>

            {isDetailsLoading ? (
              <div className="dark:bg-neutral-850 h-6 w-full animate-pulse rounded bg-neutral-200" />
            ) : isDeptAdmin || detailsError ? (
              <p className="text-neutral-450 dark:text-neutral-555 font-semibold italic">
                AI detection confidence matrices restricted under admin credentials.
              </p>
            ) : details ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                <div>
                  <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase">
                    YOLO Detection Category
                  </span>
                  <span className="mt-1 block font-bold text-neutral-800 capitalize dark:text-neutral-200">
                    {details.issue_type.toLowerCase()}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase">
                    AI Confidence Score
                  </span>
                  <span className="mt-1 block font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {(details.ai_confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase">
                    Calculated Risk Score
                  </span>
                  <span className="mt-1 block font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {details.risk_score.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase">
                    Verification Verdict
                  </span>
                  <span
                    className={`mt-1 inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                      details.verification_passed
                        ? 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'dark:text-rose-450 border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20'
                    }`}
                  >
                    {details.verification_decision}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-neutral-450 font-semibold italic dark:text-neutral-500">
                No AI verification data available.
              </p>
            )}
          </div>

          {/* SECTION G: ASSIGNMENT INFORMATION */}
          <div className="dark:border-neutral-850 space-y-3 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:bg-[#1E1E20]">
            <h3 className="dark:border-neutral-850 flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[18px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
              <UserCheck className="h-4 w-4 shrink-0 text-blue-500" />
              Operational Assignment Log
            </h3>

            <div className="grid grid-cols-2 gap-y-3">
              <div>
                <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase">
                  Assigned Worker
                </span>
                <span className="mt-1 block font-semibold text-neutral-500 dark:text-neutral-400">
                  {report.status === 'Pending' ? 'None (Unassigned)' : 'Auto-scheduled Worker'}
                </span>
              </div>
              <div>
                <span className="text-neutral-450 block text-[13px] font-black tracking-wider uppercase">
                  Operation Status
                </span>
                <span className="mt-1 block font-mono font-semibold text-neutral-500 uppercase dark:text-neutral-400">
                  {report.status}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION H: CHRONOLOGICAL TIMELINE */}
          <div className="dark:border-neutral-850 space-y-4 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-4 dark:bg-[#1E1E20]">
            <h3 className="dark:border-neutral-850 flex items-center gap-1.5 border-b border-neutral-200/40 pb-2 text-[18px] font-black tracking-wider text-neutral-400 uppercase dark:text-neutral-500">
              <History className="h-4 w-4 shrink-0 text-blue-500" />
              Chronological Audit Trail
            </h3>

            {isTimelineLoading ? (
              <div className="space-y-4 border-l border-neutral-200 pl-4 dark:border-neutral-800">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="relative animate-pulse space-y-1">
                    <div className="dark:bg-neutral-850 absolute -left-[21px] h-2.5 w-2.5 rounded-full bg-neutral-200" />
                    <div className="dark:bg-neutral-850 h-3.5 w-32 rounded bg-neutral-200" />
                    <div className="bg-neutral-150 h-3 w-48 rounded dark:bg-neutral-800" />
                  </div>
                ))}
              </div>
            ) : isTimelineRestricted ? (
              <div className="dark:bg-neutral-850 flex items-start gap-2.5 rounded-lg border border-neutral-200/40 bg-neutral-100 p-3 dark:border-neutral-800">
                <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#0A3C7D] dark:text-blue-400" />
                <p className="text-[13px] leading-relaxed font-semibold text-neutral-500 dark:text-neutral-400">
                  Timeline logs are restricted for administrative role tokens. Access is
                  citizen-only via ownership token validation.
                </p>
              </div>
            ) : timelineData?.timeline && timelineData.timeline.length > 0 ? (
              <div className="relative space-y-5.5 border-l border-neutral-200 pl-4.5 select-none dark:border-neutral-800">
                {timelineData.timeline.map((event, idx) => (
                  <div key={idx} className="group relative text-left">
                    {/* Bullet Indicator */}
                    <div className="absolute top-1 -left-[23px] h-2.5 w-2.5 rounded-full border border-white bg-[#0A3C7D] transition-transform group-hover:scale-125 dark:border-[#1E1E20] dark:bg-blue-600" />

                    <h4 className="text-[13px] font-extrabold text-neutral-800 dark:text-neutral-200">
                      {event.title}
                    </h4>
                    <p className="mt-0.5 text-[13px] leading-relaxed font-semibold text-neutral-500 dark:text-neutral-400">
                      {event.description}
                    </p>
                    <span className="dark:text-neutral-550 mt-1.5 block flex items-center gap-1 font-mono text-[11px] font-black tracking-wider text-neutral-400 uppercase">
                      <Calendar className="h-3 w-3" />
                      {formatDate(event.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-450 font-semibold italic dark:text-neutral-500">
                No active audit timeline logs recorded.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
