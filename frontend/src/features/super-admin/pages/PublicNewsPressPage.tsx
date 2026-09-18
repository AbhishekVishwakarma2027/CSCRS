import { Newspaper } from 'lucide-react'
import { PublicUpdatesManagementWidget } from '../components/PublicUpdatesManagementWidget'

export default function PublicNewsPressPage() {
  return (
    <div className="space-y-6 pb-12 text-left select-none">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-neutral-800 dark:text-white">
            <Newspaper className="h-6 w-6" />
            Public News & Press Management
          </h1>
          <p className="mt-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Create, edit, publish, and manage official municipal updates, SOP guidelines, and press
            releases for the public portal.
          </p>
        </div>
      </div>

      {/* Public Updates Management Widget */}
      <PublicUpdatesManagementWidget />
    </div>
  )
}

export { PublicNewsPressPage }
