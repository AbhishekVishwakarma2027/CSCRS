import React, { useState, useMemo } from 'react'
import {
  MessageSquare,
  FileSpreadsheet,
  Download,
  AlertCircle,
  TrendingUp,
  Star,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useFeedbackSummaryQuery } from '../hooks/use-feedback'
import { feedbackService } from '../services/feedback.service'
import { FeedbackDistribution } from '../components/FeedbackDistribution'

export default function FeedbackPage() {
  const { data: summary, isLoading, error, refetch } = useFeedbackSummaryQuery()

  // State to manage file exports
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv' | null>(null)
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [exportErrorMessage, setExportErrorMessage] = useState('')

  const hasFeedback = useMemo(() => {
    return summary ? summary.total_feedback > 0 : false
  }, [summary])

  const satisfactionRate = useMemo(() => {
    if (!summary || summary.total_feedback === 0) return '—'
    const positiveCount =
      summary.rating_distribution.five_star + summary.rating_distribution.four_star
    return `${((positiveCount / summary.total_feedback) * 100).toFixed(1)}%`
  }, [summary])

  const handleExport = async (format: 'xlsx' | 'csv') => {
    setExportFormat(format)
    setExportStatus('loading')
    setExportErrorMessage('')

    try {
      const blob = await feedbackService.exportFeedback(format)

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `citizen_feedback_export_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setExportStatus('success')
      toast.success(`Feedback data exported in ${format.toUpperCase()} format successfully!`)

      setTimeout(() => {
        setExportStatus('idle')
        setExportFormat(null)
      }, 3000)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      setExportStatus('error')
      const msg = 'fastAPI connection error. Ensure active token credentials.'
      setExportErrorMessage(msg)
      toast.error(`Export failed: ${msg}`)
    }
  }

  return (
    <div className="space-y-6 pb-10 text-left select-none">
      {/* 1. Header Banner */}
      <div className="dark:border-neutral-850 flex items-center justify-between border-b border-neutral-100 pb-4">
        <div>
          <h2 className="dark:text-blue-450 flex items-center gap-2 text-[24px] font-bold tracking-wide text-[#0A3C7D] uppercase">
            <MessageSquare className="h-8 w-8" />
            Citizen Feedback Registry
          </h2>
          <p className="dark:text-neutral-455 mt-1.5 text-[13px] leading-relaxed font-semibold text-neutral-500 sm:text-[18px]">
            Overview aggregate ratings statistics, download detailed comments log, and audit service
            metrics.
          </p>
        </div>
      </div>

      {/* 2. Loading / Connection Error States */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
              />
            ))}
          </div>
          <div className="h-44 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200/60 bg-red-50/20 p-8 text-center dark:border-red-900/40 dark:bg-red-950/5">
          <AlertCircle className="text-red-550 h-8 w-8 shrink-0" />
          <h4 className="text-red-750 text-xs font-black tracking-wider uppercase sm:text-sm dark:text-red-400">
            Connection Error
          </h4>
          <p className="max-w-md text-xs leading-relaxed font-semibold text-red-600/80 dark:text-red-400/80">
            {error.message ||
              'FastAPI dashboard summary query failed. Try refreshing or logging in again.'}
          </p>
          <Button type="button" onClick={() => refetch()} className="h-8.5 text-xs">
            Retry Connection
          </Button>
        </div>
      ) : (
        <>
          {/* 3. Taller, Centered KPI Summary Cards (2 columns on tablet, 3 columns on desktop, 1 column on mobile) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {/* Card 1: Total Feedback */}
            <div className="border-neutral-250/60 flex h-24 items-center gap-4.5 rounded-xl border bg-white px-5 py-6 shadow-xs transition-all duration-200 hover:shadow-sm dark:border-neutral-800 dark:bg-[#1C1C1E]">
              <div className="shrink-0 rounded-xl bg-blue-50/60 p-3 text-[#0A3C7D] dark:bg-blue-950/20 dark:text-blue-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1 text-left font-bold">
                <span className="block text-[13px] leading-none font-semibold tracking-wider text-neutral-600 uppercase sm:text-[16px] dark:text-neutral-400">
                  Total Feedbacks
                </span>
                <div className="my-1 block font-mono text-[34px] leading-none font-black tracking-tight text-neutral-800 sm:text-[36px] dark:text-neutral-200">
                  {summary?.total_feedback ?? 0}
                </div>
                <span className="dark:text-neutral-550 block text-[12px] leading-none font-medium text-neutral-400">
                  Real-time query sync
                </span>
              </div>
            </div>

            {/* Card 2: Average Rating */}
            <div className="border-neutral-250/60 flex h-24 items-center gap-4.5 rounded-xl border bg-white px-5 py-6 shadow-xs transition-all duration-200 hover:shadow-sm dark:border-neutral-800 dark:bg-[#1C1C1E]">
              <div className="shrink-0 rounded-xl bg-amber-50/60 p-3 text-amber-500 dark:bg-amber-950/20 dark:text-amber-400">
                <Star className="h-5 w-5 fill-amber-500" />
              </div>
              <div className="flex-1 space-y-1 text-left font-bold">
                <span className="block text-[13px] leading-none font-semibold tracking-wider text-neutral-600 uppercase sm:text-[16px] dark:text-neutral-400">
                  Average Score
                </span>
                <div className="my-1 block font-mono text-[34px] leading-none font-black tracking-tight text-neutral-800 sm:text-[36px] dark:text-neutral-200">
                  {hasFeedback ? `${summary?.average_rating.toFixed(2)}` : '0.00'}
                </div>
                <span className="dark:text-neutral-550 block text-[12px] leading-none font-medium text-neutral-400">
                  Aggregate score
                </span>
              </div>
            </div>

            {/* Card 3: Satisfaction Rate (with N/A check) */}
            <div className="border-neutral-250/60 col-span-1 flex h-24 items-center gap-4.5 rounded-xl border bg-white px-5 py-6 shadow-xs transition-all duration-200 hover:shadow-sm sm:col-span-2 md:col-span-1 dark:border-neutral-800 dark:bg-[#1C1C1E]">
              <div className="dark:text-emerald-455 shrink-0 rounded-xl bg-emerald-50/60 p-3 text-emerald-600 dark:bg-emerald-950/20">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1 text-left font-bold">
                <span className="block text-[13px] leading-none font-semibold tracking-wider text-neutral-600 uppercase sm:text-[16px] dark:text-neutral-400">
                  User Satisfaction Rate
                </span>
                <div className="my-1 block font-mono text-[34px] leading-none font-black tracking-tight text-neutral-800 sm:text-[36px] dark:text-neutral-200">
                  {satisfactionRate}
                </div>
                <span className="dark:text-neutral-550 block text-[12px] leading-none font-medium text-neutral-400">
                  {hasFeedback ? '4 & 5 Star ratings ratio' : 'No feedback available'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Telemetry Distribution Block */}
          {summary && <FeedbackDistribution data={summary} />}

          {/* 5. Compact Export Operations Panel */}
          <div className="border-neutral-255/60 dark:border-neutral-850 mx-auto w-full max-w-xl space-y-5 rounded-2xl border bg-neutral-50/50 px-6.5 py-12 text-center shadow-xs dark:bg-[#1E1E20]">
            <div className="space-y-1.5">
              <h3 className="dark:text-neutral-150 text-xl leading-normal font-bold tracking-widest text-neutral-800 uppercase">
                Export Feedback Records
              </h3>
              <p className="dark:text-neutral-455 mx-auto max-w-md text-[13px] leading-relaxed font-semibold text-neutral-500">
                Download complete citizen feedback records (including ratings, liked texts,
                suggestions, and creation timestamps) to review detailed user comments directly.
              </p>
            </div>

            {/* Action buttons (Row with px-6 on desktop, Stack on mobile) */}
            <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center gap-8 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={exportStatus === 'loading'}
                onClick={() => handleExport('csv')}
                aria-label="Export feedback as CSV"
                aria-busy={exportStatus === 'loading' && exportFormat === 'csv'}
                className="dark:text-neutral-350 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 px-4 text-xs font-black tracking-wider text-neutral-700 uppercase focus-visible:ring-2 sm:w-auto dark:border-neutral-800"
              >
                {exportStatus === 'loading' && exportFormat === 'csv' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Download CSV
              </Button>

              <Button
                type="button"
                disabled={exportStatus === 'loading'}
                onClick={() => handleExport('xlsx')}
                aria-label="Export feedback as Excel"
                aria-busy={exportStatus === 'loading' && exportFormat === 'xlsx'}
                className="flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 bg-[#0A3C7D] px-4 text-xs font-black tracking-wider text-white uppercase hover:bg-[#0A3C7D]/95 focus-visible:ring-2 sm:w-auto"
              >
                {exportStatus === 'loading' && exportFormat === 'xlsx' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                )}
                Export Excel
              </Button>
            </div>

            {/* Formats indicators */}
            <div className="dark:text-neutral-450 text-xs font-bold tracking-wider text-neutral-500 uppercase">
              Supported formats:{' '}
              <span className="dark:text-neutral-350 font-extrabold text-neutral-700">• CSV</span>{' '}
              <span className="dark:text-neutral-350 font-extrabold text-neutral-700">• XLSX</span>
            </div>

            {/* Status alerts */}
            {exportStatus === 'loading' && (
              <span className="block animate-pulse text-[9px] font-extrabold tracking-wider text-blue-500 uppercase">
                Compiling database table rows...
              </span>
            )}

            {exportStatus === 'success' && (
              <span className="block flex items-center justify-center gap-1 text-[9px] font-extrabold tracking-wider text-emerald-600 uppercase dark:text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Download initialized!
              </span>
            )}

            {exportStatus === 'error' && (
              <div className="mx-auto flex max-w-sm items-start justify-center gap-1 text-rose-600">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <span className="text-left text-[9px] leading-relaxed font-extrabold tracking-wider uppercase">
                  {exportErrorMessage}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
