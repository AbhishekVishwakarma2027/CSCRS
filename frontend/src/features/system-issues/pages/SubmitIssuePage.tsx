import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, FilePlus, Loader2, ListCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { systemIssuesService } from '../services/system-issues.service'
import { SystemIssueCategory } from '../types'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { UserRole } from '@/types/auth.types'
import { reportsService } from '@/features/reports/services/reports.service'
import { PATHS } from '@/routes/paths'

export default function SubmitIssuePage() {
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [relatedReportNumber, setRelatedReportNumber] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Report number validation state
  const [isReportVerified, setIsReportVerified] = useState<
    'idle' | 'verifying' | 'valid' | 'invalid'
  >('idle')
  const [verifiedReportDetails, setVerifiedReportDetails] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const verifyReportNumber = async (reportNo: string) => {
    const trimmed = reportNo.trim()
    if (!trimmed) {
      setIsReportVerified('idle')
      setVerifiedReportDetails(null)
      return
    }

    setIsReportVerified('verifying')
    try {
      interface ReportResult {
        report_number: string
        issue_type: string
        status: string
      }
      let results: ReportResult[] = []
      if (user?.role === UserRole.CITY_ADMIN) {
        results = (await reportsService.searchCityReports(trimmed)) as ReportResult[]
      } else if (user?.role === UserRole.DEPARTMENT_ADMIN) {
        results = (await reportsService.searchDepartmentReports(trimmed)) as ReportResult[]
      }

      // Check if any returned result matches report_number exactly (case-insensitive)
      const matched = results.find((r) => r.report_number.toLowerCase() === trimmed.toLowerCase())

      if (matched) {
        setIsReportVerified('valid')
        setVerifiedReportDetails(`${matched.issue_type} (Status: ${matched.status})`)
      } else {
        setIsReportVerified('invalid')
        setVerifiedReportDetails(null)
      }
    } catch {
      setIsReportVerified('invalid')
      setVerifiedReportDetails(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || title.trim().length < 5 || title.trim().length > 200) {
      toast.error('Subject/Title must be between 5 and 200 characters.')
      return
    }

    if (!category) {
      toast.error('Please select an issue category.')
      return
    }

    if (!description || description.trim().length < 10 || description.trim().length > 3000) {
      toast.error('Description must be between 10 and 3000 characters.')
      return
    }

    if (relatedReportNumber.trim()) {
      if (relatedReportNumber.trim().length > 30) {
        toast.error('Related report number must be under 30 characters.')
        return
      }

      // If the report number is entered but is not verified as valid, prevent submission
      if (isReportVerified === 'invalid') {
        toast.error('Cannot submit issue. The entered Related Report Number does not exist.')
        return
      }
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('category', category)
      if (relatedReportNumber.trim()) {
        formData.append('related_report_number', relatedReportNumber.trim())
      }
      if (attachment) {
        formData.append('attachments', attachment)
      }

      const res = await systemIssuesService.submitIssue(formData)
      toast.success(`System issue reported successfully! Ref: ${res.issue_number}`)

      // Reset form
      setTitle('')
      setDescription('')
      setCategory('')
      setRelatedReportNumber('')
      setAttachment(null)
      setIsReportVerified('idle')
      setVerifiedReportDetails(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      interface ValidationError {
        msg: string
      }
      const err = error as { response?: { data?: { detail?: string | ValidationError[] } } }
      // eslint-disable-next-line no-console
      console.error(err)
      let errorMsg = err.response?.data?.detail || 'Failed to submit issue report.'

      // Prevent React crash when detail is an array (e.g. from FastAPI 422 error)
      if (Array.isArray(errorMsg)) {
        errorMsg = errorMsg.map((e: ValidationError) => e.msg).join(', ')
      }

      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to submit issue report.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10 text-left select-none">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-neutral-800 dark:text-white">
            <AlertCircle className="h-6 w-6 text-[#0A3C7D] dark:text-blue-400" />
            Submit System Issue
          </h1>
          <p className="mt-1 text-[13px] leading-relaxed font-semibold text-neutral-500 dark:text-neutral-400">
            Report application bugs, operational latency, configuration failures, or interface
            issues.
          </p>
        </div>

        <Link to={PATHS.MY_ISSUES}>
          <Button
            variant="outline"
            size="sm"
            className="h-9 shrink-0 border-neutral-200 text-xs font-bold text-[#0A3C7D] hover:bg-neutral-100 dark:border-neutral-800 dark:text-blue-400"
          >
            <ListCheck className="mr-1.5 h-4 w-4" />
            My System Issues
          </Button>
        </Link>
      </div>

      {/* Submit Form Card */}
      <Card className="border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category */}
          <div>
            <label className="text-neutral-450 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
              Issue Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-bold outline-none focus:ring-2 focus:ring-[#0A3C7D]/20 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
              required
            >
              <option value="" disabled>
                Select issue category...
              </option>
              {Object.values(SystemIssueCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Subject / Title */}
          <div>
            <label className="text-neutral-450 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
              Subject / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the issue (min 5 chars)..."
              maxLength={200}
              className="mt-1.5 block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-bold outline-none focus:ring-2 focus:ring-[#0A3C7D]/20 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
              required
            />
          </div>

          {/* Related Civic Report Number (Optional) */}
          <div>
            <label className="text-neutral-450 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
              Related Report Number (Optional)
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                value={relatedReportNumber}
                onChange={(e) => {
                  setRelatedReportNumber(e.target.value)
                  if (isReportVerified !== 'idle') {
                    setIsReportVerified('idle')
                    setVerifiedReportDetails(null)
                  }
                }}
                onBlur={() => verifyReportNumber(relatedReportNumber)}
                placeholder="e.g. CSCRS-20260812-ABCDEF..."
                maxLength={30}
                className="block w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-bold outline-none focus:ring-2 focus:ring-[#0A3C7D]/20 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => verifyReportNumber(relatedReportNumber)}
                disabled={isReportVerified === 'verifying' || !relatedReportNumber.trim()}
                className="dark:hover:bg-neutral-850 h-[38px] shrink-0 border-neutral-200 text-xs font-bold hover:bg-neutral-100 dark:border-neutral-800"
              >
                {isReportVerified === 'verifying' ? 'Verifying...' : 'Verify'}
              </Button>
            </div>

            {/* Verification Status Feedback */}
            {isReportVerified === 'valid' && (
              <span className="mt-1.5 flex items-center gap-1 text-[11px] font-extrabold text-[#22C55E]">
                ✓ Report verified: {verifiedReportDetails}
              </span>
            )}
            {isReportVerified === 'invalid' && (
              <span className="mt-1.5 flex items-center gap-1 text-[11px] font-extrabold text-red-500">
                ✗ No matching report found in the database.
              </span>
            )}

            <span className="mt-1.5 block text-[11px] font-bold text-neutral-400 dark:text-neutral-500">
              If this issue is related to a specific civic complaint/report, link it here.
            </span>
          </div>

          {/* Description */}
          <div>
            <label className="text-neutral-450 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide steps to reproduce, actual vs. expected behavior, or traceback error logs (min 10 chars)..."
              maxLength={3000}
              className="mt-1.5 block h-36 w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-bold outline-none focus:ring-2 focus:ring-[#0A3C7D]/20 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
              required
            />
          </div>

          {/* Screenshot / File Attachment */}
          <div>
            <label className="text-neutral-450 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
              File Attachment / Screenshot (Optional)
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                className="hidden"
                id="file-attachment"
                accept="image/*,video/*"
              />
              <label
                htmlFor="file-attachment"
                className="text-neutral-750 flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-4 text-xs font-black tracking-wider uppercase hover:bg-neutral-100 dark:border-neutral-700 dark:bg-[#1C1C1E] dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <FilePlus className="h-4 w-4 text-[#0A3C7D] dark:text-blue-500" />
                {attachment ? 'Change File' : 'Choose File'}
              </label>
              <span className="dark:text-neutral-450 text-xs font-bold text-neutral-500">
                {attachment ? attachment.name : 'No file selected'}
              </span>
            </div>
            <span className="mt-1 block text-[11px] font-bold text-neutral-400 dark:text-neutral-500">
              Only a single image or video file is accepted (max 10MB).
            </span>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-2 border-t border-neutral-100 pt-2 dark:border-neutral-800/60">
            <Button
              type="submit"
              disabled={isSubmitting || isReportVerified === 'verifying'}
              className="h-9 bg-[#0A3C7D] px-6 text-xs font-bold text-white hover:bg-[#0A3C7D]/90 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-4.5 w-4.5 animate-spin" />
                  Submitting Report...
                </>
              ) : (
                'Submit Issue'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
