import { useState, useRef, useEffect } from 'react'
import {
  useDashboardMonthlyTrends,
  useDashboardStatus,
  useDashboardPriorities,
  useDashboardIssues,
} from '../hooks/use-dashboard'
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
  AlertCircle,
  LineChart,
  PieChart as PieIcon,
  BarChart2,
  Activity,
  Info,
  MoreVertical,
  RefreshCw,
  FileImage,
  FileSpreadsheet,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Centralized Global Status & Priority Color System ───────────────────────

const COLOR_RESOLVED = '#22C55E' // Green
const COLOR_ASSIGNED = '#F59E0B' // Amber
const COLOR_PENDING = '#EF4444' // Red
const COLOR_IN_PROGRESS = '#3B82F6' // Blue
const COLOR_CLOSED = '#15803D' // Dark Green
const COLOR_REJECTED = '#6B7280' // Gray
const COLOR_CRITICAL = '#DC2626' // Dark Red
const COLOR_INDIGO = '#6366F1'
const COLOR_PRIMARY = '#0A3C7D' // Brand Navy Blue

const STATUS_COLORS: Record<string, string> = {
  PENDING: COLOR_PENDING,
  ASSIGNED: COLOR_ASSIGNED,
  IN_PROGRESS: COLOR_IN_PROGRESS,
  RESOLVED: COLOR_RESOLVED,
  CLOSED: COLOR_CLOSED,
  REJECTED: COLOR_REJECTED,
  CANCELLED: COLOR_CRITICAL,
  REOPENED: COLOR_INDIGO,
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: COLOR_REJECTED,
  MEDIUM: COLOR_IN_PROGRESS,
  HIGH: COLOR_ASSIGNED,
  CRITICAL: COLOR_CRITICAL,
}

// ─── Reusable Overflow Dropdown Action Menu ──────────────────────────────────

function ChartActionMenu({ onRefresh }: { onRefresh: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAction = (label: string, action: () => void) => {
    setIsOpen(false)
    action()
  }

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-neutral-450 cursor-pointer rounded-lg p-1 transition-colors outline-none hover:bg-neutral-50 hover:text-neutral-900 focus:ring-2 focus:ring-blue-500 dark:hover:bg-neutral-800 dark:hover:text-white"
        aria-label="Chart Actions Menu"
        aria-expanded={isOpen}
      >
        <MoreVertical className="h-4 w-4 shrink-0" />
      </button>

      {isOpen && (
        <div className="border-neutral-250 animate-slide-in absolute right-0 z-50 mt-1 w-36 origin-top-right rounded-lg border bg-white py-1 shadow-lg focus:outline-none dark:border-neutral-800 dark:bg-[#1C1C1E]">
          <button
            onClick={() =>
              handleAction('Refresh', () => {
                onRefresh()
                toast.success('Telemetry refetched successfully')
              })
            }
            className="text-neutral-750 hover:bg-neutral-55 focus:bg-neutral-55 flex w-full cursor-pointer items-center space-x-2 px-3 py-1.5 text-[13px] font-bold transition-colors outline-none dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <RefreshCw className="text-neutral-450 h-3.5 w-3.5 shrink-0" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() =>
              handleAction('Export PNG', () => toast.success('Exporting high-resolution PNG...'))
            }
            className="text-neutral-750 hover:bg-neutral-55 focus:bg-neutral-55 flex w-full cursor-pointer items-center space-x-2 px-3 py-1.5 text-[11px] font-bold transition-colors outline-none dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <FileImage className="text-neutral-450 h-3.5 w-3.5 shrink-0" />
            <span>Export PNG</span>
          </button>

          <button
            onClick={() =>
              handleAction('Export CSV', () => toast.success('Exporting reports ledger CSV...'))
            }
            className="text-neutral-750 hover:bg-neutral-55 focus:bg-neutral-55 flex w-full cursor-pointer items-center space-x-2 px-3 py-1.5 text-[11px] font-bold transition-colors outline-none dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <FileSpreadsheet className="text-neutral-450 h-3.5 w-3.5 shrink-0" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() =>
              handleAction('View Details', () =>
                toast.info('Detailed telemetry charts view will be integrated in a later phase.')
              )
            }
            className="text-neutral-750 hover:bg-neutral-55 focus:bg-neutral-55 flex w-full cursor-pointer items-center space-x-2 px-3 py-1.5 text-[11px] font-bold transition-colors outline-none dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <ExternalLink className="text-neutral-450 h-3.5 w-3.5 shrink-0" />
            <span>View Details</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Sub-Component Helper: Chart State States ────────────────────────────────

interface ChartStateWrapperProps {
  title: string
  icon: React.ReactNode
  isLoading: boolean
  error: unknown
  isEmpty: boolean
  children: React.ReactNode
  refetch: () => void
  ariaLabel: string
  extraHeader?: React.ReactNode
  isScrollable?: boolean
}

function ChartStateWrapper({
  title,
  icon,
  isLoading,
  error,
  isEmpty,
  children,
  refetch,
  ariaLabel,
  extraHeader,
  isScrollable = false,
}: ChartStateWrapperProps) {
  return (
    <Card
      role="region"
      aria-label={ariaLabel}
      className="flex h-[330px] flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-[#1C1C1E]"
    >
      {/* Header */}
      <div className="mb-3 flex shrink-0 items-center justify-between border-b border-neutral-100 pb-2 select-none dark:border-neutral-800">
        <h4 className="flex items-center gap-2 text-[18px] font-black tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
          {icon}
          {title}
        </h4>
        <div className="flex items-center space-x-2">
          {extraHeader}
          <ChartActionMenu onRefresh={refetch} />
        </div>
      </div>

      {/* Drawing viewport */}
      <div
        className={`relative min-h-0 w-full flex-grow ${isScrollable ? 'scrollbar-thin overflow-y-auto' : ''}`}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 flex animate-pulse flex-col items-center justify-center gap-2 bg-white/60 select-none dark:bg-[#1C1C1E]/60">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0A3C7D] border-t-transparent" />
            <span className="text-neutral-450 dark:text-neutral-450 text-[13px] font-black tracking-wider uppercase">
              Syncing Data...
            </span>
          </div>
        )}

        {!!error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 p-6 text-center select-none">
            <AlertCircle className="h-6 w-6 shrink-0 text-rose-500" />
            <h5 className="text-neutral-750 dark:text-neutral-350 text-[13px] font-bold">
              Failed to render telemetry
            </h5>
            <button
              onClick={refetch}
              className="mt-1 cursor-pointer rounded px-1 text-[13px] font-black text-[#0A3C7D] outline-none hover:underline focus:ring-2 focus:ring-blue-500 dark:text-blue-400"
            >
              Retry Sync
            </button>
          </div>
        )}

        {!isLoading && !error && isEmpty && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 p-6 text-center select-none">
            <Activity className="h-5 w-5 shrink-0 animate-pulse text-neutral-400" />
            <h5 className="dark:text-neutral-450 text-[13px] font-black tracking-widest text-neutral-500 uppercase">
              No Records Found
            </h5>
            <p className="dark:text-neutral-550 max-w-[200px] text-[13px] leading-relaxed font-semibold text-neutral-400">
              There is currently no reported operational data for this widget.
            </p>
          </div>
        )}

        {!isLoading && !error && !isEmpty && children}
      </div>
    </Card>
  )
}

// ─── Chart Widgets ───────────────────────────────────────────────────────────

// 1. Monthly Volume Trends Area Chart
export function MonthlyTrendsChart() {
  const { data, isLoading, error, refetch } = useDashboardMonthlyTrends()
  const chartData = data || []
  const isLimited = chartData.length <= 1

  return (
    <ChartStateWrapper
      title="Monthly Report Trends"
      ariaLabel="Telemetry chart showing report volume trends over months"
      icon={<LineChart className="h-4 w-4 text-[#0A3C7D]" />}
      isLoading={isLoading}
      error={error}
      isEmpty={chartData.length === 0}
      refetch={refetch}
      extraHeader={
        isLimited && !isLoading && !error && chartData.length > 0 ? (
          <span className="text-blue-750 dark:text-blue-450 flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-black select-none dark:border-blue-900/30 dark:bg-blue-950/20">
            <Info className="h-3 w-3" />
            Limited Historical Data
          </span>
        ) : null
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 12, right: 10, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLOR_PRIMARY} stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLOR_PRIMARY} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="month_name"
            stroke="#64748B"
            fontSize={10}
            fontWeight="bold"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748B"
            fontSize={10}
            fontWeight="bold"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 'black',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Area
            type="monotone"
            dataKey="total_reports"
            name="Created Reports"
            stroke={COLOR_PRIMARY}
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorTrend)"
            isAnimationActive={true}
            label={
              isLimited
                ? { position: 'top', fill: '#64748B', fontSize: 10, fontWeight: 'bold' }
                : undefined
            }
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartStateWrapper>
  )
}

// 2. Report Status Donut Chart
export function StatusChart() {
  const { data, isLoading, error, refetch } = useDashboardStatus()

  // Format items & map strictly to centralized Status Colors
  const chartData = (data || []).map((d) => ({
    name: d.status.replace(/_/g, ' '),
    value: d.total_reports,
    rawStatus: d.status,
  }))

  const totalReportsCount = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <ChartStateWrapper
      title="Status Distribution"
      ariaLabel="Telemetry pie chart showing reports split by current statuses"
      icon={<PieIcon className="h-4 w-4 text-[#0D9488]" />}
      isLoading={isLoading}
      error={error}
      isEmpty={chartData.length === 0}
      refetch={refetch}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={75}
            paddingAngle={chartData.length > 1 ? 3 : 0} // Render single coloured slice smoothly
            dataKey="value"
            isAnimationActive={true}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={STATUS_COLORS[entry.rawStatus.toUpperCase()] || COLOR_REJECTED}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: unknown) => {
              const numericVal = typeof value === 'number' ? value : Number(value) || 0
              const percentage =
                totalReportsCount > 0 ? ((numericVal / totalReportsCount) * 100).toFixed(1) : '0'
              return [`${numericVal} reports (${percentage}%)`, 'Volume']
            }}
            contentStyle={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 'black',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconSize={8}
            iconType="circle"
            wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '8px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartStateWrapper>
  )
}

// 3. Report Priority Bar Chart
export function PriorityChart() {
  const { data, isLoading, error, refetch } = useDashboardPriorities()

  const chartData = (data || []).map((d) => ({
    name: d.priority,
    Reports: d.total_reports,
    fillColor: PRIORITY_COLORS[d.priority.toUpperCase()] || COLOR_REJECTED,
  }))

  return (
    <ChartStateWrapper
      title="Priority Allocation"
      ariaLabel="Telemetry bar chart showing report counts grouped by priority levels"
      icon={<BarChart2 className="h-4 w-4 text-indigo-500" />}
      isLoading={isLoading}
      error={error}
      isEmpty={chartData.length === 0}
      refetch={refetch}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 15, right: 5, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#64748B"
            fontSize={10}
            fontWeight="bold"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748B"
            fontSize={10}
            fontWeight="bold"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            contentStyle={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 'black',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Bar
            dataKey="Reports"
            radius={[4, 4, 0, 0]}
            isAnimationActive={true}
            label={{ position: 'top', fill: '#64748B', fontSize: 10, fontWeight: 'bold' }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fillColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartStateWrapper>
  )
}

// 4. Issue Category Horizontal Bar Chart (With dynamic scaling heights)
export function IssueCategoryChart() {
  const { data, isLoading, error, refetch } = useDashboardIssues()
  const chartData = data || []

  // Dynamic bar chart height scaling based on item count to support infinite categories without overflows
  const barHeight = 28
  const computedHeight = Math.max(220, chartData.length * barHeight)

  return (
    <ChartStateWrapper
      title="Issue Categories"
      ariaLabel="Telemetry horizontal bar chart showing report volume by category"
      icon={<BarChart2 className="h-4 w-4 text-amber-500" />}
      isLoading={isLoading}
      error={error}
      isEmpty={chartData.length === 0}
      refetch={refetch}
      isScrollable={true} // Allow scrolling for large datasets
    >
      <div style={{ height: computedHeight, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
            <XAxis
              type="number"
              stroke="#64748B"
              fontSize={10}
              fontWeight="bold"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              dataKey="issue_type"
              type="category"
              stroke="#64748B"
              fontSize={9}
              fontWeight="bold"
              tickLine={false}
              axisLine={false}
              width={95}
            />
            <Tooltip
              cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
              contentStyle={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 'black',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Bar
              dataKey="total_reports"
              name="Reports"
              fill={COLOR_PRIMARY}
              radius={[0, 4, 4, 0]}
              barSize={10}
              isAnimationActive={true}
              label={{ position: 'right', fill: '#64748B', fontSize: 10, fontWeight: 'bold' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartStateWrapper>
  )
}
