import { ShieldCheck } from 'lucide-react'
import { PlatformHealthWidget } from '../components/PlatformHealthWidget'
import { AITelemetryCard } from '../components/AITelemetryCard'
import { SystemIssuesAnalyticsWidget } from '../components/SystemIssuesAnalyticsWidget'

export default function SuperAdminGovernancePage() {
  return (
    <div className="space-y-6 pb-12 text-left select-none">
      {/* 1. Header Banner */}
      <div className="dark:border-neutral-850 flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-neutral-800 dark:text-white">
            <ShieldCheck className="h-6 w-6" />
            Platform Governance Hub
          </h1>
          <p className="mt-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Centralized infrastructure performance observability, AI model telemetry, and system
            issue metrics analytics.
          </p>
        </div>
      </div>

      {/* 2. Infrastructure Platform System Health Widget */}
      <PlatformHealthWidget />

      {/* 3. AI Model Governance & Verification Telemetry */}
      <AITelemetryCard />

      {/* 4. System Health & Bug Analytics */}
      <SystemIssuesAnalyticsWidget />
    </div>
  )
}

export { SuperAdminGovernancePage }
