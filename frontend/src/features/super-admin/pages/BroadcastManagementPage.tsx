import { useState } from 'react'
import { Megaphone, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActiveAnnouncementsWidget } from '../components/ActiveAnnouncementsWidget'
import { BroadcastAnnouncementModal } from '../components/BroadcastAnnouncementModal'

export default function BroadcastManagementPage() {
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false)

  return (
    <div className="space-y-6 pb-12 text-left select-none">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-neutral-800 dark:text-white">
            <Megaphone className="h-6 w-6" />
            Broadcast & Announcement Management
          </h1>
          <p className="mt-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Issue real-time system alerts, scheduled maintenance notices, and broadcast messages to
            platform users.
          </p>
        </div>

        {/* Primary Action Button */}
        <Button
          type="button"
          onClick={() => setIsAnnouncementModalOpen(true)}
          className="flex items-center gap-2 bg-[#0A3C7D] font-bold text-white shadow-xs hover:bg-[#0A3C7D]/90 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          <span>New Broadcast Announcement</span>
        </Button>
      </div>

      {/* Broadcast Lifecycle Management Widget */}
      <ActiveAnnouncementsWidget />

      {/* Broadcast Modal */}
      <BroadcastAnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
      />
    </div>
  )
}

export { BroadcastManagementPage }
