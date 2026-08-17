import { useAuth } from '@/hooks/use-auth'
import { UserRole } from '@/types/auth.types'
import { SummaryCards } from '../components/SummaryCards'
import {
  MonthlyTrendsChart,
  StatusChart,
  PriorityChart,
  IssueCategoryChart,
} from '../components/DashboardCharts'
import { RecentReportsTable } from '../components/RecentReportsTable'
import { HighPriorityQueue } from '../components/HighPriorityQueue'
import { OperationalInsights } from '../components/OperationalInsights'
import { WidgetErrorBoundary } from '../components/WidgetErrorBoundary'
import { Card } from '@/components/ui/card'
import { FileText, Users, RefreshCw, Hourglass } from 'lucide-react'
import { useDashboardSummary } from '../hooks/use-dashboard'
import type { DepartmentDashboardResponse } from '../types'

// Dynamic role-aware dashboard headers
const DASHBOARD_META: Record<UserRole, { title: string; subtitle: string }> = {
  [UserRole.SUPER_ADMIN]: {
    title: 'System Administration Dashboard',
    subtitle:
      'System settings configurations, central administration logs, and platform configurations.',
  },
  [UserRole.CITY_ADMIN]: {
    title: 'City Administration Dashboard',
    subtitle: 'City-wide reports, department performance, and operational analytics.',
  },
  [UserRole.DEPARTMENT_ADMIN]: {
    title: 'Department Administration Dashboard',
    subtitle:
      'Department operations backlog, verification manual review lists, and worker assignments.',
  },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data } = useDashboardSummary()

  // Dynamic configuration retrieval
  const title = user ? DASHBOARD_META[user.role]?.title || 'Dashboard' : 'Dashboard'
  const subtitle = user
    ? DASHBOARD_META[user.role]?.subtitle ||
      'Municipal services, operational metrics and administrative overview.'
    : 'Municipal services, operational metrics and administrative overview.'

  const isCityOrSuper = user?.role === UserRole.CITY_ADMIN || user?.role === UserRole.SUPER_ADMIN

  const deptData =
    data && 'available_workers' in data ? (data as DepartmentDashboardResponse) : null

  const formatResolutionTime = (hours: number) => {
    if (!hours || hours === 0) return '0h'
    const totalMinutes = Math.round(hours * 60)
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  return (
    <div className="space-y-6">
      {/* Role-Aware Title and Subtitle Headers */}
      <div className="flex shrink-0 flex-col gap-1.5 select-none">
        <h1 className="text-2xl font-black tracking-tight text-neutral-800 dark:text-white">
          {title}
        </h1>
        <p className="text-[13px] leading-relaxed font-semibold text-neutral-500 dark:text-neutral-400">
          {subtitle}
        </p>
      </div>

      {/* 1. KPI Summary Cards (Wrapped in its own isolation boundary) */}
      <WidgetErrorBoundary title="Summary Cards">
        <SummaryCards />
      </WidgetErrorBoundary>

      {/* 2. City Admin & Super Admin Core Metrics (Hidden for Department Admin) */}
      {isCityOrSuper && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Major Trends, Metrics, and Report Logs */}
          <div className="space-y-6 lg:col-span-2">
            <WidgetErrorBoundary title="Report Volume Trends">
              <MonthlyTrendsChart />
            </WidgetErrorBoundary>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <WidgetErrorBoundary title="Priority Distribution">
                <PriorityChart />
              </WidgetErrorBoundary>

              <WidgetErrorBoundary title="Category Analytics">
                <IssueCategoryChart />
              </WidgetErrorBoundary>
            </div>

            {/* Bottom Table section kept exactly in place */}
            <WidgetErrorBoundary title="Recent Reports Table">
              <RecentReportsTable />
            </WidgetErrorBoundary>
          </div>

          {/* Right Column: Status ratios, queues, and anomaly alerts */}
          <div className="space-y-6">
            <WidgetErrorBoundary title="Status Ratios">
              <StatusChart />
            </WidgetErrorBoundary>

            <WidgetErrorBoundary title="Critical Incident Queue">
              <HighPriorityQueue />
            </WidgetErrorBoundary>

            <WidgetErrorBoundary title="Telemetry Bottlenecks">
              <OperationalInsights />
            </WidgetErrorBoundary>
          </div>
        </div>
      )}

      {/* 3. Department Admin specific operational advice (Hides analytics elements) */}
      {user?.role === UserRole.DEPARTMENT_ADMIN && (
        <div className="space-y-6 select-none">
          {/* Detailed Statistics Grid */}
          {deptData && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Reports Card */}
              <Card className="flex flex-col justify-between border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
                <div>
                  <h3 className="text-neutral-450 dark:border-neutral-850 mb-4 flex items-center gap-2 border-b border-neutral-100 pb-2 text-xs font-black tracking-wider uppercase dark:text-neutral-500">
                    <FileText className="h-4.5 w-4.5 text-[#0A3C7D] dark:text-blue-400" />
                    Reports Breakdown
                  </h3>
                  <div className="dark:text-neutral-350 space-y-2.5 text-xs font-semibold text-neutral-700">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Total Reports</span>
                      <span className="font-extrabold text-neutral-900 dark:text-white">
                        {deptData.total_reports}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Pending Reports</span>
                      <span className="font-extrabold text-[#F59E0B]">
                        {deptData.pending_reports}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Assigned Reports</span>
                      <span className="font-extrabold text-[#3B82F6]">
                        {deptData.assigned_reports}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">In Progress</span>
                      <span className="font-extrabold text-blue-500">
                        {deptData.in_progress_reports}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Resolved Reports</span>
                      <span className="font-extrabold text-[#22C55E]">
                        {deptData.resolved_reports}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Cancelled Reports</span>
                      <span className="font-extrabold text-neutral-500">
                        {deptData.cancelled_reports}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Reopened Reports</span>
                      <span className="font-extrabold text-purple-500">
                        {deptData.reopened_reports}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Workforce Card */}
              <Card className="flex flex-col justify-between border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
                <div>
                  <h3 className="text-neutral-450 dark:border-neutral-850 mb-4 flex items-center gap-2 border-b border-neutral-100 pb-2 text-xs font-black tracking-wider uppercase dark:text-neutral-500">
                    <Users className="dark:text-emerald-450 h-4.5 w-4.5 text-[#22C55E]" />
                    Workforce Operations
                  </h3>
                  <div className="dark:text-neutral-350 space-y-3.5 text-xs font-semibold text-neutral-700">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Available Workers</span>
                      <span className="font-extrabold text-[#22C55E]">
                        {deptData.available_workers}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Busy Workers</span>
                      <span className="font-extrabold text-[#F59E0B]">{deptData.busy_workers}</span>
                    </div>
                    <div className="dark:border-neutral-850 flex justify-between border-t border-neutral-100 pt-3">
                      <span className="text-neutral-400">Total Active Force</span>
                      <span className="font-extrabold text-neutral-900 dark:text-white">
                        {deptData.available_workers + deptData.busy_workers}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Transfer Requests Card */}
              <Card className="flex flex-col justify-between border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
                <div>
                  <h3 className="text-neutral-450 dark:border-neutral-850 mb-4 flex items-center gap-2 border-b border-neutral-100 pb-2 text-xs font-black tracking-wider uppercase dark:text-neutral-500">
                    <RefreshCw className="h-4.5 w-4.5 text-indigo-500" />
                    Transfer Requests
                  </h3>
                  <div className="dark:text-neutral-350 space-y-3.5 text-xs font-semibold text-neutral-700">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Pending Forwards</span>
                      <span className="font-extrabold text-[#F59E0B]">
                        {deptData.forward_requests_pending}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Accepted Forwards</span>
                      <span className="font-extrabold text-[#22C55E]">
                        {deptData.forward_requests_accepted}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Rejected Forwards</span>
                      <span className="font-extrabold text-[#DC2626]">
                        {deptData.forward_requests_rejected}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Performance Card */}
              <Card className="flex flex-col justify-between border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
                <div>
                  <h3 className="dark:border-neutral-850 mb-4 flex items-center gap-2 border-b border-neutral-100 pb-2 text-xs font-black tracking-wider text-[#A3A3A3] uppercase dark:text-neutral-500">
                    <Hourglass className="h-4.5 w-4.5 text-purple-500" />
                    Performance Metrics
                  </h3>
                  <div className="dark:text-neutral-350 space-y-3.5 text-xs font-semibold text-neutral-700">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Avg Resolution Time</span>
                      <span className="font-extrabold text-neutral-900 dark:text-white">
                        {formatResolutionTime(deptData.average_resolution_time_hours)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Automation Rate</span>
                      <span className="font-extrabold text-indigo-500">
                        {deptData.automation_rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
export { DashboardPage }
