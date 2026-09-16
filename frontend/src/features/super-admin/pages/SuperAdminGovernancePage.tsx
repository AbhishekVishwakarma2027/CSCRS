import { useState } from 'react'
import { ShieldCheck, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlatformHealthWidget } from '../components/PlatformHealthWidget'
import { AITelemetryCard } from '../components/AITelemetryCard'
import { SystemIssuesAnalyticsWidget } from '../components/SystemIssuesAnalyticsWidget'
import { ActiveAnnouncementsWidget } from '../components/ActiveAnnouncementsWidget'
import { AuditLogsTable } from '../components/AuditLogsTable'
import { LoginAuditsTable } from '../components/LoginAuditsTable'
import { BroadcastAnnouncementModal } from '../components/BroadcastAnnouncementModal'

export default function SuperAdminGovernancePage() {
  const [activeAuditTab, setActiveAuditTab] = useState<'action' | 'login'>('action')
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false)

  return (
    <div className="space-y-6 pb-12 text-left select-none">
      {/* 1. Header Banner */}
      <div className="dark:border-neutral-850 flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-widest text-[#0A3C7D] uppercase dark:text-blue-400">
            <ShieldCheck className="h-6 w-6" />
            Platform Governance Hub
          </h1>
          <p className="mt-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Centralized platform health monitoring, system audit logs, security access trails, AI
            model telemetry, and system announcements.
          </p>
        </div>

        {/* Action Button: Broadcast Announcement */}
        <Button
          type="button"
          onClick={() => setIsAnnouncementModalOpen(true)}
          className="flex items-center gap-2 bg-[#0A3C7D] font-bold text-white shadow-xs hover:bg-[#0A3C7D]/90 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <Megaphone className="h-4 w-4" />
          <span>Broadcast Announcement</span>
        </Button>
      </div>

      {/* 2. Platform System Health Widget */}
      <PlatformHealthWidget />

      {/* 3. AI Governance & Telemetry */}
      <AITelemetryCard />

      {/* 4. System Health & Bug Analytics */}
      <SystemIssuesAnalyticsWidget />

      {/* 5. System Announcement Lifecycle Management */}
      <ActiveAnnouncementsWidget />

      {/* 6. Audit & Security Trail Section */}
      <div className="space-y-4">
        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveAuditTab('action')}
            className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-black uppercase transition-colors outline-none ${
              activeAuditTab === 'action'
                ? 'bg-[#0A3C7D] text-white dark:bg-blue-600'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
            }`}
          >
            System Action Audit Logs
          </button>
          <button
            type="button"
            onClick={() => setActiveAuditTab('login')}
            className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-black uppercase transition-colors outline-none ${
              activeAuditTab === 'login'
                ? 'bg-[#0A3C7D] text-white dark:bg-blue-600'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
            }`}
          >
            User Login Security Audits
          </button>
        </div>

        {/* Active Audit Table View */}
        {activeAuditTab === 'action' ? <AuditLogsTable /> : <LoginAuditsTable />}
      </div>

      {/* ─── MODALS ────────────────────────────────────────── */}
      <BroadcastAnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
      />
    </div>
  )
}
export { SuperAdminGovernancePage }
