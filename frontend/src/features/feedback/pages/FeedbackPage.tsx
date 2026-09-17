import React, { useState, useMemo } from 'react'
import { MessageSquare, AlertCircle, TrendingUp, Star, Loader2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  useFeedbackSummaryQuery,
  useSubmitFeedbackMutation,
  useExportFeedbackMutation,
} from '../hooks/use-feedback'
import { FeedbackDistribution } from '../components/FeedbackDistribution'
import { useAuth } from '@/hooks/use-auth'
import { UserRole } from '@/types/auth.types'

export default function FeedbackPage() {
  const { user } = useAuth()
  const isDeptAdmin = user?.role === UserRole.DEPARTMENT_ADMIN
  const { data: summary, isLoading, error, refetch } = useFeedbackSummaryQuery(!isDeptAdmin)
  const submitFeedbackMutation = useSubmitFeedbackMutation()
  const exportFeedbackMutation = useExportFeedbackMutation()

  const handleExportFeedback = async (format: 'csv' | 'xlsx') => {
    try {
      const blob = await exportFeedbackMutation.mutateAsync(format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `citizen_feedback.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(`Feedback dataset exported successfully as ${format.toUpperCase()}.`)
    } catch (err: unknown) {
      console.error(err)
      toast.error('Failed to export feedback dataset.')
    }
  }

  // State to manage feedback submission
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [likedText, setLikedText] = useState('')
  const [suggestionText, setSuggestionText] = useState('')

  const hasFeedback = useMemo(() => {
    return summary ? summary.total_feedback > 0 : false
  }, [summary])

  const satisfactionRate = useMemo(() => {
    if (!summary || summary.total_feedback === 0) return '—'
    const positiveCount =
      summary.rating_distribution.five_star + summary.rating_distribution.four_star
    return `${((positiveCount / summary.total_feedback) * 100).toFixed(1)}%`
  }, [summary])

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      toast.error('Please select a rating score between 1 and 5 stars.')
      return
    }

    try {
      await submitFeedbackMutation.mutateAsync({
        rating,
        liked_text: likedText.trim() || undefined,
        suggestion_text: suggestionText.trim() || undefined,
      })
      toast.success('Thank you! Your feedback has been submitted successfully.')
      setRating(0)
      setLikedText('')
      setSuggestionText('')
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string } } }
      console.error(err)
      const errorMsg = err.response?.data?.detail || 'Failed to submit feedback.'
      toast.error(errorMsg)
    }
  }

  return (
    <div className="space-y-6 pb-10 text-left select-none">
      {isDeptAdmin ? (
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col gap-1.5 border-b border-neutral-100 pb-4 dark:border-neutral-800">
            <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-neutral-800 dark:text-white">
              <MessageSquare className="h-6 w-6 text-[#0A3C7D] dark:text-blue-400" />
              Give Platform Feedback
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed font-semibold text-neutral-500 dark:text-neutral-400">
              Provide ratings and suggestions to help improve our crowdsourced civic issue
              resolution platform.
            </p>
          </div>

          {/* Submit Form Card */}
          <Card className="border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
            <form onSubmit={handleFeedbackSubmit} className="space-y-5">
              {/* Rating Selector */}
              <div>
                <label className="text-neutral-450 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Overall System Rating <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="cursor-pointer transition-colors duration-150 outline-none"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-neutral-350 dark:text-neutral-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-500">
                    Selected: {rating} {rating === 1 ? 'Star' : 'Stars'}
                  </span>
                )}
              </div>

              {/* What did you like */}
              <div>
                <label className="text-neutral-450 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
                  What did you like about the system?
                </label>
                <textarea
                  value={likedText}
                  onChange={(e) => setLikedText(e.target.value)}
                  placeholder="Share aspects of the platform you found helpful or efficient..."
                  maxLength={1000}
                  className="mt-1.5 block h-24 w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-bold outline-none focus:ring-2 focus:ring-[#0A3C7D]/20 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
                />
              </div>

              {/* Suggestion Text */}
              <div>
                <label className="text-neutral-450 block text-[11px] font-black tracking-wider uppercase dark:text-neutral-500">
                  Suggestions for improvement
                </label>
                <textarea
                  value={suggestionText}
                  onChange={(e) => setSuggestionText(e.target.value)}
                  placeholder="Enter suggestions or improvements for the interface and backend flows..."
                  maxLength={1000}
                  className="mt-1.5 block h-24 w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] font-bold outline-none focus:ring-2 focus:ring-[#0A3C7D]/20 dark:border-neutral-800 dark:bg-[#1C1C1E] dark:text-neutral-200"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-2 border-t border-neutral-100 pt-2 dark:border-neutral-800/60">
                <Button
                  type="submit"
                  disabled={submitFeedbackMutation.isPending}
                  className="h-9 bg-[#0A3C7D] px-6 text-xs font-bold text-white hover:bg-[#0A3C7D]/90 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {submitFeedbackMutation.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-4.5 w-4.5 animate-spin" />
                      Submitting Feedback...
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : (
        <>
          {/* 1. Header Banner */}
          <div className="flex flex-col gap-4 pb-4 select-none sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-neutral-800 dark:text-white">
                Citizen Feedback Registry
              </h1>
              <p className="text-[13px] leading-relaxed font-semibold text-neutral-500 dark:text-neutral-400">
                Overview aggregate ratings statistics, download detailed comments log, and audit
                service metrics.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={exportFeedbackMutation.isPending}
                onClick={() => handleExportFeedback('csv')}
                className="flex items-center gap-1.5 text-xs font-bold dark:border-neutral-800"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={exportFeedbackMutation.isPending}
                onClick={() => handleExportFeedback('xlsx')}
                className="flex items-center gap-1.5 text-xs font-bold dark:border-neutral-800"
              >
                <Download className="h-3.5 w-3.5" />
                Export XLSX
              </Button>
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
              <h4 className="text-red-750 text-[13px] font-black tracking-wider uppercase dark:text-red-400">
                Connection Error
              </h4>
              <p className="max-w-md text-[13px] leading-relaxed font-semibold text-red-600/80 dark:text-red-400/80">
                {error.message ||
                  'FastAPI dashboard summary query failed. Try refreshing or logging in again.'}
              </p>
              <Button type="button" onClick={() => refetch()} className="h-8.5 text-[13px]">
                Retry Connection
              </Button>
            </div>
          ) : (
            <>
              {/* 3. Taller, Centered KPI Summary Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {/* Card 1: Total Feedback */}
                <Card className="group flex h-[135px] flex-col justify-between border border-neutral-200 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-[#1C1C1E]">
                  <div className="flex items-start justify-between">
                    <span className="text-neutral-450 mt-0.5 text-[13px] leading-none font-black tracking-wide uppercase dark:text-neutral-500">
                      Total Feedbacks
                    </span>
                    <div className="-mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 transition-colors select-none group-hover:bg-[#0A3C7D]/5 dark:bg-neutral-800/40 dark:group-hover:bg-[#0A3C7D]/10">
                      <MessageSquare className="h-4.5 w-4.5 text-[#0A3C7D]" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-3xl leading-none font-black tracking-tight text-neutral-800 transition-colors md:text-4xl dark:text-white">
                      {summary?.total_feedback ?? 0}
                    </h3>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="dark:text-neutral-450 text-[13px] leading-none font-bold text-neutral-500">
                        Real-time query sync
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Card 2: Average Rating */}
                <Card className="group flex h-[135px] flex-col justify-between border border-neutral-200 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-[#1C1C1E]">
                  <div className="flex items-start justify-between">
                    <span className="text-neutral-450 mt-0.5 text-[13px] leading-none font-black tracking-wide uppercase dark:text-neutral-500">
                      Average Score
                    </span>
                    <div className="-mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 transition-colors select-none group-hover:bg-[#0A3C7D]/5 dark:bg-neutral-800/40 dark:group-hover:bg-[#0A3C7D]/10">
                      <Star className="h-4.5 w-4.5 text-amber-500" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-3xl leading-none font-black tracking-tight text-neutral-800 transition-colors md:text-4xl dark:text-white">
                      {hasFeedback ? `${summary?.average_rating.toFixed(2)}` : '0.00'}
                    </h3>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="dark:text-neutral-450 text-[13px] leading-none font-bold text-neutral-500">
                        Aggregate score
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Card 3: Satisfaction Rate */}
                <Card className="group flex h-[135px] flex-col justify-between border border-neutral-200 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:col-span-2 md:col-span-1 dark:border-neutral-800 dark:bg-[#1C1C1E]">
                  <div className="flex items-start justify-between">
                    <span className="text-neutral-450 mt-0.5 text-[13px] leading-none font-black tracking-wide uppercase dark:text-neutral-500">
                      User Satisfaction Rate
                    </span>
                    <div className="-mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 transition-colors select-none group-hover:bg-[#0A3C7D]/5 dark:bg-neutral-800/40 dark:group-hover:bg-[#0A3C7D]/10">
                      <TrendingUp className="h-4.5 w-4.5 text-[#22C55E]" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-3xl leading-none font-black tracking-tight text-neutral-800 transition-colors md:text-4xl dark:text-white">
                      {satisfactionRate}
                    </h3>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="dark:text-neutral-450 text-[13px] leading-none font-bold text-neutral-500">
                        {hasFeedback ? '4 & 5 Star ratings ratio' : 'No feedback available'}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 4. Telemetry Distribution Block */}
              {summary && <FeedbackDistribution data={summary} />}
            </>
          )}
        </>
      )}
    </div>
  )
}
