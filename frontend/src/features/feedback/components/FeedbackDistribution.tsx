import React from 'react'
import { Star, MessageSquare } from 'lucide-react'
import type { FeedbackDashboardResponse } from '../types'

interface FeedbackDistributionProps {
  data: FeedbackDashboardResponse
}

export function FeedbackDistribution({ data }: FeedbackDistributionProps) {
  const { total_feedback, average_rating, rating_distribution } = data
  const hasFeedback = total_feedback > 0

  const ratingsList = [
    { stars: 5, count: rating_distribution.five_star },
    { stars: 4, count: rating_distribution.four_star },
    { stars: 3, count: rating_distribution.three_star },
    { stars: 2, count: rating_distribution.two_star },
    { stars: 1, count: rating_distribution.one_star },
  ]

  // Helper to render star rating stars in filled/empty formats
  const renderStarDisplay = (count: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-500 select-none">
        {[...Array(5)].map((_, i) => {
          const isFilled = i < count
          return (
            <Star
              key={i}
              className={`size-3.5 ${
                isFilled
                  ? 'fill-amber-500 text-amber-500'
                  : 'text-neutral-200 dark:text-neutral-800'
              }`}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className="border-neutral-250/60 grid grid-cols-1 gap-6 rounded-2xl border bg-white p-5 shadow-xs select-none md:grid-cols-3 dark:border-neutral-800 dark:bg-[#1C1C1E]">
      {/* 1. Score KPI Card */}
      <div className="dark:border-neutral-850 flex flex-col items-center justify-center space-y-2 border-b border-neutral-100 p-4 text-center md:border-r md:border-b-0">
        <span className="text-[18px] font-bold tracking-wider text-neutral-600 uppercase dark:text-neutral-400">
          Average Rating
        </span>
        {hasFeedback ? (
          <>
            <div className="dark:text-neutral-150 font-mono text-[40px] leading-none font-black tracking-tight text-neutral-800">
              {average_rating.toFixed(1)}{' '}
              <span className="text-neutral-450 text-[13px] font-bold">/ 5</span>
            </div>
            {renderStarDisplay(Math.round(average_rating))}
            <span className="text-neutral-450 mt-1 block text-[13px] font-bold dark:text-neutral-500">
              Based on {total_feedback} {total_feedback === 1 ? 'review' : 'reviews'}
            </span>
          </>
        ) : (
          <>
            <div className="dark:text-neutral-655 font-mono text-[40px] leading-none font-black tracking-tight text-neutral-400">
              0.0
            </div>
            {renderStarDisplay(0)}
            <span className="dark:text-neutral-550 mt-1 block text-[13px] font-bold text-neutral-400">
              No ratings yet
            </span>
          </>
        )}
      </div>

      {/* 2. Rating Breakdown Bars / Zero-Feedback Illustration Block */}
      <div className="dark:text-neutral-350 col-span-1 flex flex-col justify-center space-y-3.5 text-[13px] font-bold text-neutral-700 md:col-span-2">
        {!hasFeedback ? (
          <div className="flex flex-col items-center justify-center space-y-3.5 p-3 text-center">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-dashed border-neutral-300 text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
              <MessageSquare className="h-7 w-7 opacity-80" />
            </div>
            <div className="space-y-1.5">
              <h4 className="dark:text-neutral-250 text-[26px] leading-none font-bold tracking-widest text-neutral-800 uppercase">
                No Feedback Yet
              </h4>
              <p className="text-[13px] leading-relaxed font-semibold text-neutral-500 dark:text-neutral-400">
                No citizen feedback has been submitted yet.
              </p>
              <p className="dark:text-neutral-550 text-[15px] leading-relaxed font-medium text-neutral-400">
                Feedback analytics will automatically appear after citizens submit ratings.
              </p>
            </div>
          </div>
        ) : (
          ratingsList.map((item) => {
            const percent = total_feedback > 0 ? (item.count / total_feedback) * 100 : 0
            return (
              <div key={item.stars} className="flex items-center gap-4">
                {/* Star Symbol Labels (★★★★★) */}
                <div className="flex w-[82px] shrink-0 items-center justify-start">
                  {renderStarDisplay(item.stars)}
                </div>

                {/* Progress Bar Frame */}
                <div className="dark:bg-neutral-850 relative h-3.5 flex-1 overflow-hidden rounded-full border border-neutral-200/40 bg-neutral-100 dark:border-transparent">
                  <div
                    style={{ width: `${percent}%` }}
                    className="h-full rounded-full bg-amber-500 transition-all duration-700 ease-out dark:bg-amber-600"
                  />
                </div>

                {/* Percentage & Count Indicator */}
                <div className="text-neutral-550 dark:text-neutral-450 flex w-20 shrink-0 items-center justify-between font-mono text-[13px] font-bold">
                  <span>{percent.toFixed(0)}%</span>
                  <span>({item.count})</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
