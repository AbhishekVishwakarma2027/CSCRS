import { useDashboardInsights } from '../hooks/use-dashboard'
import { Card } from '@/components/ui/card'
import { AlertCircle, Lightbulb, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'

// Helper to determine icon based on alert type
const getInsightIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'bottleneck':
    case 'warning':
      return <AlertTriangle className="h-4 w-4 shrink-0 text-[#F59E0B]" />
    case 'anomaly':
    case 'error':
    case 'critical':
      return <AlertCircle className="h-4 w-4 shrink-0 text-[#DC2626]" />
    case 'success':
    case 'resolution':
      return <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22C55E]" />
    case 'trend':
    case 'performance':
      return <TrendingUp className="text-emerald-650 h-4 w-4 shrink-0" />
    default:
      return <Lightbulb className="h-4 w-4 shrink-0 text-[#3B82F6]" />
  }
}

// Severity Styles mapping mapped to central status colors
const getSeveritySettings = (type: string) => {
  const normType = type.toLowerCase()
  if (['anomaly', 'error', 'critical'].includes(normType)) {
    return {
      borderClass: 'border-l-3 border-[#DC2626]',
      bgClass: 'bg-[#DC2626]/5 dark:bg-[#DC2626]/10',
      tagText: 'Critical',
      tagClass:
        'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30',
      weight: 4,
    }
  }
  if (['bottleneck', 'warning'].includes(normType)) {
    return {
      borderClass: 'border-l-3 border-[#F59E0B]',
      bgClass: 'bg-[#F59E0B]/5 dark:bg-[#F59E0B]/10',
      tagText: 'Warning',
      tagClass:
        'bg-[#F59E0B]/10 text-[#D97706] border-[#F59E0B]/20 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30',
      weight: 3,
    }
  }
  if (['success', 'resolution', 'completed'].includes(normType)) {
    return {
      borderClass: 'border-l-3 border-[#22C55E]',
      bgClass: 'bg-[#22C55E]/5 dark:bg-[#22C55E]/10',
      tagText: 'Success',
      tagClass:
        'bg-[#22C55E]/10 text-[#16A34A] border-[#22C55E]/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30',
      weight: 2,
    }
  }
  return {
    borderClass: 'border-l-3 border-[#3B82F6]',
    bgClass: 'bg-[#3B82F6]/5 dark:bg-[#3B82F6]/10',
    tagText: 'Information',
    tagClass:
      'bg-[#3B82F6]/10 text-[#2563EB] border-[#3B82F6]/20 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30',
    weight: 1,
  }
}

export function OperationalInsights() {
  const { data, isLoading, error, refetch } = useDashboardInsights()

  // Sort insights by severity weight desc (Critical -> Warning -> Success -> Info)
  const insights = (data || [])
    .map((i) => ({
      ...i,
      settings: getSeveritySettings(i.type),
    }))
    .sort((a, b) => b.settings.weight - a.settings.weight)

  // 1. Loading State (renders vertical skeleton layout items, equal height match)
  if (isLoading) {
    return (
      <Card className="flex h-[330px] flex-col justify-between border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2 dark:border-neutral-800">
          <div className="bg-neutral-250 h-4 w-40 animate-pulse rounded" />
        </div>
        <div className="mt-4 flex-1 space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex animate-pulse gap-3 py-1">
              <div className="h-5 w-5 shrink-0 rounded-full bg-neutral-100" />
              <div className="flex-grow space-y-2">
                <div className="h-3.5 w-1/3 rounded bg-neutral-200" />
                <div className="bg-neutral-150 h-3 w-5/6 rounded" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  // 2. Error State (matching card height)
  if (error) {
    return (
      <Card className="flex h-[330px] flex-col items-center justify-center gap-2 border border-neutral-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <AlertCircle className="h-6 w-6 shrink-0 text-rose-500" />
        <h4 className="dark:text-neutral-350 text-[13px] font-bold text-neutral-700">
          Failed to load platform insights
        </h4>
        <button
          onClick={() => refetch()}
          className="mt-2 cursor-pointer rounded px-1 text-xs font-black text-[#0A3C7D] outline-none hover:underline focus:ring-2 focus:ring-blue-500 dark:text-blue-400"
        >
          Retry Load
        </button>
      </Card>
    )
  }

  // 3. Empty State (matching card height)
  if (insights.length === 0) {
    return (
      <Card className="flex h-[330px] flex-col items-center justify-center border border-neutral-200 bg-white p-6 text-center shadow-sm select-none dark:border-neutral-800 dark:bg-[#1C1C1E]">
        <div className="text-neutral-450 border-neutral-150 mb-3 flex h-12 w-12 items-center justify-center rounded-full border bg-neutral-50 dark:bg-neutral-800">
          <Lightbulb className="h-6 w-6" />
        </div>
        <h4 className="dark:text-neutral-450 text-[13px] leading-none font-black tracking-widest text-neutral-600 uppercase">
          No Anomalies Detected
        </h4>
        <p className="dark:text-neutral-550 mt-2 max-w-[200px] text-[13px] leading-normal font-bold text-neutral-400">
          System telemetry registers normal operations. No warning anomalies logged.
        </p>
      </Card>
    )
  }

  // 4. Ready State
  return (
    <Card
      role="region"
      aria-label="Platform Telemetry Insights"
      className="group flex h-[330px] flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md dark:border-neutral-800 dark:bg-[#1C1C1E]"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 pb-2 select-none dark:border-neutral-800">
        <h4 className="flex items-center gap-2 text-[18px] font-black tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
          <Lightbulb className="h-4 w-4 text-[#0A3C7D]" />
          Operational Anomalies & Insights
        </h4>
      </div>

      {/* List viewport */}
      <div className="flex-grow scrollbar-thin space-y-3 overflow-y-auto pt-2">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`flex gap-3 rounded-lg border border-neutral-100/30 p-3 ${insight.settings.borderClass} ${insight.settings.bgClass} transition-all duration-200 hover:shadow-xs`}
          >
            <div className="mt-0.5 flex shrink-0 items-center justify-center rounded-md bg-white p-1.5 shadow-xs select-none dark:bg-neutral-800/80">
              {getInsightIcon(insight.type)}
            </div>

            <div className="min-w-0 flex-grow space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h5 className="text-[13px] leading-tight font-black text-neutral-800 dark:text-neutral-200">
                  {insight.title}
                </h5>
                <span
                  className={`py-0.2 shrink-0 rounded border px-1.5 text-[10px] font-black tracking-wider uppercase select-none ${insight.settings.tagClass}`}
                >
                  {insight.settings.tagText}
                </span>
              </div>
              <p className="text-[13px] leading-relaxed font-semibold break-words whitespace-normal text-neutral-500 dark:text-neutral-400">
                {insight.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
export default OperationalInsights
