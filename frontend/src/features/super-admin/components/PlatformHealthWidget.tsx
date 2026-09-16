import { useSystemHealthQuery } from '../hooks/use-super-admin'
import { Card } from '@/components/ui/card'
import {
  Activity,
  Database,
  Server,
  Users,
  Building2,
  FileText,
  HardDrive,
  RefreshCw,
} from 'lucide-react'

export function PlatformHealthWidget() {
  const { data, isLoading, error, refetch, isRefetching } = useSystemHealthQuery()

  if (isLoading) {
    return (
      <Card className="animate-pulse p-6">
        <div className="h-6 w-1/4 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="dark:bg-neutral-850 h-20 rounded-lg bg-neutral-100" />
          ))}
        </div>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-red-50/10 p-5 dark:border-red-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
            <Activity className="h-5 w-5" />
            <div>
              <h4 className="text-sm font-bold">Health Diagnostic Failed</h4>
              <p className="text-xs">Unable to load platform health status.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded border border-red-200 bg-white px-3 py-1 text-xs font-bold text-red-700 shadow-xs hover:bg-red-50 dark:bg-[#1C1C1E]"
          >
            Retry
          </button>
        </div>
      </Card>
    )
  }

  const isHealthy = data.status === 'healthy'
  const summary = data.system_summary || {}

  return (
    <Card className="border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-[#1C1C1E]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isHealthy
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black tracking-tight text-neutral-900 dark:text-white">
                {data.app_name}
              </h3>
              <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                v{data.version}
              </span>
            </div>
            <p className="text-xs font-semibold text-neutral-500">
              Platform Status:{' '}
              <span
                className={`font-bold capitalize ${isHealthy ? 'text-emerald-600' : 'text-amber-600'}`}
              >
                {data.status}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 select-none">
          <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-bold dark:border-neutral-800">
            <Database className="h-3.5 w-3.5 text-blue-500" />
            <span>
              DB: <span className="text-emerald-600 uppercase">{data.database}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-bold dark:border-neutral-800">
            <Server className="h-3.5 w-3.5 text-purple-500" />
            <span>
              Cache: <span className="text-emerald-600 uppercase">{data.redis}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
            title="Refresh Health Data"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin text-blue-500' : 'text-neutral-500'}`}
            />
          </button>
        </div>
      </div>

      {/* System Summary Grid */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="dark:border-neutral-850 rounded-xl border border-neutral-100 bg-neutral-50/60 p-3.5 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
            <Users className="h-3.5 w-3.5 text-blue-500" />
            Total Users
          </div>
          <p className="mt-1 text-2xl font-black text-neutral-900 dark:text-white">
            {summary.total_users ?? 0}
          </p>
        </div>

        <div className="dark:border-neutral-850 rounded-xl border border-neutral-100 bg-neutral-50/60 p-3.5 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
            <Building2 className="h-3.5 w-3.5 text-purple-500" />
            Departments
          </div>
          <p className="mt-1 text-2xl font-black text-neutral-900 dark:text-white">
            {summary.total_departments ?? 0}
          </p>
        </div>

        <div className="dark:border-neutral-850 rounded-xl border border-neutral-100 bg-neutral-50/60 p-3.5 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
            <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
            Active Workers
          </div>
          <p className="mt-1 text-2xl font-black text-emerald-600">{summary.active_workers ?? 0}</p>
        </div>

        <div className="dark:border-neutral-850 rounded-xl border border-neutral-100 bg-neutral-50/60 p-3.5 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
            <FileText className="h-3.5 w-3.5 text-amber-500" />
            Total Reports
          </div>
          <p className="mt-1 text-2xl font-black text-neutral-900 dark:text-white">
            {summary.total_reports ?? 0}
          </p>
        </div>
      </div>
    </Card>
  )
}
