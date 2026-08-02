import { useState, useEffect } from 'react'
import { useDashboardSummary } from '../hooks/use-dashboard'
import { useAuth } from '@/hooks/use-auth'
import { Card } from '@/components/ui/card'
import {
  FileText,
  Clock,
  RefreshCw,
  CheckCircle2,
  Cpu,
  Users,
  Hourglass,
  AlertCircle,
} from 'lucide-react'
import type { CityDashboardSummaryResponse, DepartmentDashboardResponse } from '../types'

// Type guards to check response shape safely
function isCitySummary(data: unknown): data is CityDashboardSummaryResponse {
  return typeof data === 'object' && data !== null && 'total_departments' in data
}

function isDeptSummary(data: unknown): data is DepartmentDashboardResponse {
  return typeof data === 'object' && data !== null && 'available_workers' in data
}

export function SummaryCards() {
  const { user } = useAuth()
  const { data, isLoading, error, refetch, dataUpdatedAt } = useDashboardSummary()
  const [lastUpdatedText, setLastUpdatedText] = useState('Synchronizing...')

  // Dynamic relative time calculator for dataUpdatedAt
  useEffect(() => {
    if (!dataUpdatedAt) return
    const updateText = () => {
      const diffMs = Date.now() - dataUpdatedAt
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 1) {
        setLastUpdatedText('Updated just now')
      } else {
        setLastUpdatedText(`Updated ${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`)
      }
    }
    updateText()
    const interval = setInterval(updateText, 30000)
    return () => clearInterval(interval)
  }, [dataUpdatedAt])

  // 1. Loading State (renders 4 cards with pulse skeletons, identical heights)
  if (isLoading) {
    return (
      <div className="grid animate-pulse grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card
            key={i}
            className="flex h-[135px] flex-col justify-between border border-neutral-200 bg-white p-5 shadow-xs"
          >
            <div className="flex items-start justify-between">
              <div className="bg-neutral-250 h-3 w-1/3 rounded" />
              <div className="h-7 w-7 shrink-0 rounded-lg bg-neutral-100" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-1/2 rounded bg-neutral-200" />
              <div className="bg-neutral-150 h-3 w-3/4 rounded" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  // 2. Error State (matching layout heights)
  if (error) {
    return (
      <Card className="flex h-[135px] items-center justify-between border border-red-200 bg-red-50/10 p-5 shadow-xs">
        <div className="flex items-center space-x-3 text-red-800">
          <AlertCircle className="text-red-650 h-5 w-5 shrink-0" />
          <div>
            <h4 className="text-[10px] font-black tracking-widest text-neutral-400 uppercase">
              Service Synchronizer
            </h4>
            <p className="mt-1 text-xs font-black text-red-700">
              Failed to retrieve operational stats
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="cursor-pointer rounded-lg border border-red-200 bg-white px-3.5 py-1.5 text-xs font-black text-red-700 shadow-xs transition-colors outline-none hover:bg-red-50 focus:ring-2 focus:ring-red-500"
        >
          Retry Load
        </button>
      </Card>
    )
  }

  // Fallback check if user is not set
  if (!user || !data) return null

  // 3. Render City Admin / Super Admin KPI cards
  if (isCitySummary(data)) {
    const cards = [
      {
        title: 'Total Civic Reports',
        value: data.total_reports ?? 0,
        desc: `Resolution rate: ${(data.resolution_rate ?? 0).toFixed(1)}%`,
        icon: <FileText className="h-4.5 w-4.5 text-[#0A3C7D]" />,
        ariaLabel: `Total Civic Reports is ${data.total_reports ?? 0}`,
      },
      {
        title: 'Pending Incidents',
        value: data.pending_reports ?? 0,
        desc: `${data.in_progress_reports ?? 0} active in progress`,
        icon: <Clock className="h-4.5 w-4.5 text-[#F59E0B]" />, // Centralized warning Assigned-orange color
        ariaLabel: `Pending Incidents is ${data.pending_reports ?? 0}`,
      },
      {
        title: 'Resolved Reports',
        value: data.resolved_reports ?? 0,
        desc: `Total departments: ${data.total_departments ?? 0}`,
        icon: <CheckCircle2 className="h-4.5 w-4.5 text-[#22C55E]" />, // Centralized green Resolved color
        ariaLabel: `Resolved Reports is ${data.resolved_reports ?? 0}`,
      },
      {
        title: 'AI Automation Rate',
        value: `${(data.automation_rate ?? 0).toFixed(1)}%`,
        desc: `Verified by platform classifiers`,
        icon: <Cpu className="h-4.5 w-4.5 text-indigo-500" />,
        ariaLabel: `AI Automation Rate is ${(data.automation_rate ?? 0).toFixed(1)}%`,
      },
    ]

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <Card
            key={i}
            role="region"
            aria-label={card.ariaLabel}
            className="group flex h-[135px] flex-col justify-between border border-neutral-200 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-[#1C1C1E]"
          >
            <div className="flex items-start justify-between">
              <span className="text-neutral-450 mt-0.5 text-[10px] leading-none font-black tracking-widest uppercase dark:text-neutral-500">
                {card.title}
              </span>
              <div className="-mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 transition-colors select-none group-hover:bg-[#0A3C7D]/5 dark:bg-neutral-800/40 dark:group-hover:bg-[#0A3C7D]/10">
                {card.icon}
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl leading-none font-black tracking-tight text-neutral-800 transition-colors md:text-4xl dark:text-white">
                {card.value}
              </h3>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="dark:text-neutral-450 text-[11px] leading-none font-bold text-neutral-500">
                  {card.desc}
                </p>
                <span className="text-[9px] leading-none font-semibold text-neutral-400 select-none">
                  {lastUpdatedText}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  // 4. Render Department Admin KPI cards
  if (isDeptSummary(data)) {
    const activeWorkers = (data.available_workers ?? 0) + (data.busy_workers ?? 0)
    const cards = [
      {
        title: 'Department Reports',
        value: data.total_reports ?? 0,
        desc: `${data.resolved_reports ?? 0} resolved records`,
        icon: <FileText className="h-4.5 w-4.5 text-[#0A3C7D]" />,
        ariaLabel: `Department Reports is ${data.total_reports ?? 0}`,
      },
      {
        title: 'Active Workload',
        value:
          (data.pending_reports ?? 0) +
          (data.assigned_reports ?? 0) +
          (data.in_progress_reports ?? 0),
        desc: `${data.in_progress_reports ?? 0} active, ${data.pending_reports ?? 0} queue`,
        icon: <RefreshCw className="animate-spin-slow h-4.5 w-4.5 text-[#3B82F6]" />, // Centralized blue In Progress color
        ariaLabel: `Active Workload is ${(data.pending_reports ?? 0) + (data.assigned_reports ?? 0) + (data.in_progress_reports ?? 0)}`,
      },
      {
        title: 'Active Field Force',
        value: activeWorkers,
        desc: `${data.busy_workers ?? 0} busy, ${data.available_workers ?? 0} idle`,
        icon: <Users className="h-4.5 w-4.5 text-[#22C55E]" />, // Centralized green Resolved color
        ariaLabel: `Active Field Force is ${activeWorkers}`,
      },
      {
        title: 'Department Telemetry',
        value: `${(data.automation_rate ?? 0).toFixed(1)}%`,
        desc: `Avg response time: ${(data.average_resolution_time_hours ?? 0).toFixed(1)}h`,
        icon: <Hourglass className="h-4.5 w-4.5 text-indigo-500" />,
        ariaLabel: `Department Telemetry is ${(data.automation_rate ?? 0).toFixed(1)}%`,
      },
    ]

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <Card
            key={i}
            role="region"
            aria-label={card.ariaLabel}
            className="group flex h-[135px] flex-col justify-between border border-neutral-200 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-[#1C1C1E]"
          >
            <div className="flex items-start justify-between">
              <span className="text-neutral-450 mt-0.5 text-[10px] leading-none font-black tracking-widest uppercase dark:text-neutral-500">
                {card.title}
              </span>
              <div className="-mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-50 transition-colors select-none group-hover:bg-[#0A3C7D]/5 dark:bg-neutral-800/40 dark:group-hover:bg-[#0A3C7D]/10">
                {card.icon}
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl leading-none font-black tracking-tight text-neutral-800 transition-colors md:text-4xl dark:text-white">
                {card.value}
              </h3>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="dark:text-neutral-450 text-[11px] leading-none font-bold text-neutral-500">
                  {card.desc}
                </p>
                <span className="text-[9px] leading-none font-semibold text-neutral-400 select-none">
                  {lastUpdatedText}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  // 5. Empty State fallback (identical height)
  return (
    <Card className="flex h-[135px] items-center justify-center border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
      <span className="text-xs font-bold text-neutral-500">No summary data available.</span>
    </Card>
  )
}
export default SummaryCards
