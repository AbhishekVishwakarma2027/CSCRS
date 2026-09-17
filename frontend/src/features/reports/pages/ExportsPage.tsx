import React, { useState } from 'react'
import { FileText, MessageSquare, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { reportsService } from '../services/reports.service'
import { feedbackService } from '@/features/feedback/services/feedback.service'
import { useAuth } from '@/hooks/use-auth'
import { UserRole } from '@/types/auth.types'
import { toast } from 'sonner'

export default function ExportsPage() {
  const { user } = useAuth()
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(false)
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false)
  const [feedbackFormat, setFeedbackFormat] = useState<'xlsx' | 'csv'>('xlsx')

  const isDeptAdmin = user?.role === UserRole.DEPARTMENT_ADMIN

  const handleExportPerformance = async () => {
    setIsPerformanceLoading(true)
    try {
      let blob: Blob
      let fileName: string

      if (isDeptAdmin) {
        blob = await reportsService.downloadDepartmentReport()
        fileName = `department_performance_report_${new Date().toISOString().split('T')[0]}.pdf`
      } else {
        blob = await reportsService.downloadCityReport()
        fileName = `city_performance_report_${new Date().toISOString().split('T')[0]}.pdf`
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success(
        isDeptAdmin
          ? 'Department Performance Report exported successfully!'
          : 'City Performance Report exported successfully!'
      )
    } catch (e) {
      console.error(e)
      toast.error('Failed to export Performance Report.')
    } finally {
      setIsPerformanceLoading(false)
    }
  }

  const handleExportFeedback = async () => {
    setIsFeedbackLoading(true)
    try {
      const blob = await feedbackService.exportFeedback(feedbackFormat)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `citizen_feedback_export_${new Date().toISOString().split('T')[0]}.${feedbackFormat}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success(
        `Feedback Report exported in ${feedbackFormat.toUpperCase()} format successfully!`
      )
    } catch (e) {
      console.error(e)
      toast.error('Failed to export Feedback Report.')
    } finally {
      setIsFeedbackLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-10 text-left select-none">
      {/* Header Banner */}
      <div className="flex shrink-0 flex-col gap-1.5 pb-4">
        <h1 className="text-2xl font-black tracking-tight text-neutral-800 dark:text-white">
          Data Exports & Reports
        </h1>
        <p className="text-[13px] leading-relaxed font-semibold text-neutral-500 dark:text-neutral-400">
          Generate and download operational reports, performance logs, and citizen feedback
          datasets.
        </p>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Card 1: Performance Report */}
        <Card className="flex flex-col justify-between border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-[#1C1C1E]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0A3C7D]/5 dark:bg-blue-600/10">
                <FileText className="h-5 w-5 text-[#0A3C7D] dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-wider text-neutral-800 uppercase dark:text-white">
                  {isDeptAdmin ? 'Department Performance' : 'City Performance Report'}
                </h3>
                <p className="text-neutral-450 text-[12px] font-semibold dark:text-neutral-500">
                  {isDeptAdmin
                    ? 'Export PDF summary of department performance'
                    : 'Export PDF summary of citywide performance'}
                </p>
              </div>
            </div>

            <p className="text-[13px] leading-relaxed font-semibold text-neutral-500 dark:text-neutral-400">
              {isDeptAdmin
                ? 'This report provides a detailed breakdown of report completion rates, average response latency, worker workloads, and general operations for your municipal sector.'
                : 'This report provides a detailed breakdown of civic report completion rates, department response times, worker resolution performance, and general citywide operations.'}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800/60">
            <span className="text-neutral-450 shrink-0 text-[11px] font-black tracking-widest uppercase dark:text-neutral-400">
              Format: PDF
            </span>
            <Button
              type="button"
              disabled={isPerformanceLoading}
              onClick={handleExportPerformance}
              className="flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 bg-[#0A3C7D] px-4 text-xs font-black tracking-wider text-white uppercase hover:bg-[#0A3C7D]/95 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {isPerformanceLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Export
            </Button>
          </div>
        </Card>

        {/* Card 2: Feedback Report */}
        <Card className="flex flex-col justify-between border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-[#1C1C1E]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0A3C7D]/5 dark:bg-blue-600/10">
                <MessageSquare className="h-5 w-5 text-[#0A3C7D] dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-wider text-neutral-800 uppercase dark:text-white">
                  Feedback Report
                </h3>
                <p className="text-neutral-450 text-[12px] font-semibold dark:text-neutral-500">
                  Export citizen feedback registries and scores
                </p>
              </div>
            </div>

            <p className="text-[13px] leading-relaxed font-semibold text-neutral-500 dark:text-neutral-400">
              Download complete logs of citizen feedback, including aggregate rating counts, average
              satisfaction scores, liked feature remarks, and raw user suggestions.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800/60">
            <div className="flex min-w-0 items-center gap-1.5">
              <label className="text-neutral-450 shrink-0 text-[11px] font-black tracking-wider uppercase dark:text-neutral-400">
                Format:
              </label>
              <select
                value={feedbackFormat}
                onChange={(e) => setFeedbackFormat(e.target.value as 'xlsx' | 'csv')}
                className="h-8 cursor-pointer rounded-lg border border-neutral-200 bg-white px-2 py-0.5 text-xs font-bold outline-none dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
              >
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
              </select>
            </div>

            <Button
              type="button"
              disabled={isFeedbackLoading}
              onClick={handleExportFeedback}
              className="flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 bg-[#0A3C7D] px-4 text-xs font-black tracking-wider text-white uppercase hover:bg-[#0A3C7D]/95 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {isFeedbackLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Export
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
