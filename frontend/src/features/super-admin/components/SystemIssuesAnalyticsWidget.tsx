import React, { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react'
import { useSystemIssuesQuery } from '@/features/system-issues/hooks/use-system-issues'
import { SystemIssueStatus } from '@/features/system-issues/types'
import { format, parseISO } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#EF4444', // Red
  IN_REVIEW: '#3B82F6', // Blue
  RESOLVED: '#22C55E', // Green
  REJECTED: '#6B7280', // Slate Gray
}

const CATEGORY_BAR_COLOR = '#0A3C7D'

export function SystemIssuesAnalyticsWidget() {
  const { data: issues = [], isLoading, error } = useSystemIssuesQuery({})

  // Compute status totals & metrics
  const metrics = useMemo(() => {
    const total = issues.length
    let open = 0
    let inReview = 0
    let resolved = 0
    let rejected = 0

    issues.forEach((issue) => {
      const st = String(issue.status).toUpperCase()
      if (st === SystemIssueStatus.OPEN || st === 'OPEN') open++
      else if (st === SystemIssueStatus.IN_REVIEW || st === 'IN_REVIEW') inReview++
      else if (st === SystemIssueStatus.RESOLVED || st === 'RESOLVED') resolved++
      else if (st === SystemIssueStatus.REJECTED || st === 'REJECTED') rejected++
    })

    return { total, open, inReview, resolved, rejected }
  }, [issues])

  // Status Distribution Data for Donut Chart
  const statusPieData = useMemo(() => {
    const raw = [
      { name: 'Open', value: metrics.open, color: STATUS_COLORS.OPEN },
      { name: 'Under Review', value: metrics.inReview, color: STATUS_COLORS.IN_REVIEW },
      { name: 'Resolved', value: metrics.resolved, color: STATUS_COLORS.RESOLVED },
      { name: 'Rejected', value: metrics.rejected, color: STATUS_COLORS.REJECTED },
    ]
    return raw.filter((item) => item.value > 0)
  }, [metrics])

  // Category Distribution Data for Bar Chart
  const categoryBarData = useMemo(() => {
    const counts: Record<string, number> = {}
    issues.forEach((issue) => {
      const cat = issue.category || 'Other'
      counts[cat] = (counts[cat] || 0) + 1
    })

    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8) // Top 8 categories
  }, [issues])

  // Monthly Trend Data for Area Chart
  const trendData = useMemo(() => {
    const monthMap: Record<string, { month: string; total: number; resolved: number }> = {}

    // Sort issues by created_at date ascending
    const sorted = [...issues].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    sorted.forEach((issue) => {
      try {
        const monthKey = format(parseISO(issue.created_at), 'MMM yyyy')
        if (!monthMap[monthKey]) {
          monthMap[monthKey] = { month: monthKey, total: 0, resolved: 0 }
        }
        monthMap[monthKey].total += 1
        if (String(issue.status).toUpperCase() === 'RESOLVED') {
          monthMap[monthKey].resolved += 1
        }
      } catch {
        // Fallback for unexpected date formats
      }
    })

    return Object.values(monthMap)
  }, [issues])

  if (isLoading) {
    return (
      <Card className="animate-pulse p-6">
        <div className="h-6 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="dark:bg-neutral-850 h-20 rounded-lg bg-neutral-100" />
          ))}
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border border-neutral-200 p-6 text-center text-sm font-bold text-neutral-500 dark:border-neutral-800">
        System Health & Bug Analytics unavailable.
      </Card>
    )
  }

  return (
    <Card className="border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
      {/* Widget Header */}
      <div className="flex flex-col gap-2 border-b border-neutral-100 pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-[#0A3C7D] dark:text-blue-400" />
          <div>
            <h3 className="text-base font-black tracking-tight text-neutral-900 dark:text-white">
              System Health & Bug Telemetry Analytics
            </h3>
            <p className="text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">
              Live resolution states, recurring issue categories, and volume trends across the
              platform.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {/* Total Issues */}
        <div className="dark:border-neutral-850 rounded-xl border border-neutral-100 bg-neutral-50/70 p-3.5 dark:bg-neutral-900/50">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-600 dark:text-neutral-400">
            <span>Total Issues</span>
            <AlertTriangle className="h-4 w-4 text-neutral-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-neutral-900 dark:text-white">
            {metrics.total}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-neutral-500">Logged system defects</p>
        </div>

        {/* Open Issues */}
        <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3.5 dark:border-rose-950/40 dark:bg-rose-950/20">
          <div className="flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
            <span>Open / Pending</span>
            <Clock className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
            {metrics.open}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-neutral-500">Awaiting triage</p>
        </div>

        {/* Under Review */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 dark:border-blue-950/40 dark:bg-blue-950/20">
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
            <span>Under Review</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
            {metrics.inReview}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-neutral-500">Active investigation</p>
        </div>

        {/* Resolved */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 dark:border-emerald-950/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>Resolved</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {metrics.resolved}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-neutral-500">Patched & closed</p>
        </div>

        {/* Rejected */}
        <div className="dark:bg-neutral-850/40 col-span-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 sm:col-span-1 dark:border-neutral-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-neutral-400">
            <span>Rejected</span>
            <XCircle className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-700 dark:text-neutral-300">
            {metrics.rejected}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-neutral-500">Invalid / Duplicates</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Chart 1: Issue Status Distribution (Donut Chart) */}
        <div className="dark:border-neutral-850 rounded-xl border border-neutral-100 bg-white p-4 lg:col-span-4 dark:bg-[#18181A]">
          <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-neutral-700 uppercase dark:text-neutral-300">
            <PieIcon className="h-4 w-4 text-[#0A3C7D] dark:text-blue-400" />
            Resolution Status Distribution
          </h4>
          <div className="mt-3 h-52 w-full">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E1E20',
                      borderColor: '#333',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-neutral-400">
                No issue status data recorded.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Top Issue Categories (Bar Chart) */}
        <div className="dark:border-neutral-850 rounded-xl border border-neutral-100 bg-white p-4 lg:col-span-8 dark:bg-[#18181A]">
          <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-neutral-700 uppercase dark:text-neutral-300">
            <BarChart3 className="h-4 w-4 text-[#0A3C7D] dark:text-blue-400" />
            Top Recurring System Issue Categories
          </h4>
          <div className="mt-3 h-52 w-full">
            {categoryBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryBarData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 10, fill: '#888' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#888' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E1E20',
                      borderColor: '#333',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Issue Count"
                    fill={CATEGORY_BAR_COLOR}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-neutral-400">
                No issue categories recorded.
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Issue Volume Trend over Time */}
        {trendData.length > 1 && (
          <div className="dark:border-neutral-850 rounded-xl border border-neutral-100 bg-white p-4 lg:col-span-12 dark:bg-[#18181A]">
            <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-neutral-700 uppercase dark:text-neutral-300">
              <TrendingUp className="h-4 w-4 text-[#0A3C7D] dark:text-blue-400" />
              Issue Creation vs Resolution Trend Over Time
            </h4>
            <div className="mt-3 h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#888' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#888' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E1E20',
                      borderColor: '#333',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Issues Logged"
                    stroke="#0A3C7D"
                    fill="#0A3C7D"
                    fillOpacity={0.15}
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved Issues"
                    stroke="#22C55E"
                    fill="#22C55E"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
