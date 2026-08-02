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
import { ShieldCheck, Compass } from 'lucide-react'

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

  // Dynamic configuration retrieval
  const title = user ? DASHBOARD_META[user.role]?.title || 'Dashboard' : 'Dashboard'
  const subtitle = user
    ? DASHBOARD_META[user.role]?.subtitle ||
      'Municipal services, operational metrics and administrative overview.'
    : 'Municipal services, operational metrics and administrative overview.'

  const isCityOrSuper = user?.role === UserRole.CITY_ADMIN || user?.role === UserRole.SUPER_ADMIN

  return (
    <div className="space-y-6">
      {/* Role-Aware Title and Subtitle Headers */}
      <div className="flex shrink-0 flex-col gap-1.5 select-none">
        <h1 className="text-2xl font-black tracking-tight text-neutral-800 dark:text-white">
          {title}
        </h1>
        <p className="text-sm leading-relaxed font-semibold text-neutral-500 dark:text-neutral-400">
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
        <div className="max-w-3xl pt-2 select-none">
          <Card className="flex flex-col items-start gap-4 border border-neutral-200 bg-white p-6 shadow-sm md:flex-row dark:border-neutral-800 dark:bg-[#1C1C1E]">
            <div className="flex shrink-0 items-center justify-center rounded-xl bg-[#0A3C7D]/5 p-3">
              <Compass className="dark:text-blue-450 h-6 w-6 text-[#0A3C7D]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black text-neutral-800 dark:text-neutral-200">
                Operational Dispatch Center
              </h3>
              <p className="dark:text-neutral-450 text-xs leading-relaxed font-semibold text-neutral-500">
                You are currently accessing the department dashboard. Detailed analytics charts,
                monthly trends, and citywide reports tables are restricted to Citywide
                Administration accounts.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="dark:border-neutral-750 flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-600 dark:bg-neutral-800/40 dark:text-neutral-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-neutral-500" />
                  Department Guard Active
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
export { DashboardPage }
