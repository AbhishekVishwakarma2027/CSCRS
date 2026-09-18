import { useState } from 'react'
import { Lock } from 'lucide-react'
import { AuditLogsTable } from '../components/AuditLogsTable'
import { LoginAuditsTable } from '../components/LoginAuditsTable'

export default function AuditSecurityPage() {
  const [activeAuditTab, setActiveAuditTab] = useState<'action' | 'login'>('action')

  return (
    <div className="space-y-6 pb-12 text-left select-none">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-neutral-800 dark:text-white">
            <Lock className="h-6 w-6" />
            Audit Trail & Security Access Logs
          </h1>
          <p className="mt-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Audit platform operational activity, system state modifications, and user authentication
            security trails.
          </p>
        </div>
      </div>

      {/* Audit & Security Section */}
      <div className="space-y-4">
        {/* Tab Selection */}
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-800">
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
    </div>
  )
}

export { AuditSecurityPage }
