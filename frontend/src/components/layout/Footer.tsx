import { ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react'
import { APP_CONFIG } from '@/config/app.config'

export type ApiStatus = 'connected' | 'connecting' | 'disconnected'

interface ApiStatusIndicatorProps {
  status?: ApiStatus
  lastSyncTime?: string
}

export function ApiStatusIndicator({
  status = 'connected',
  lastSyncTime,
}: ApiStatusIndicatorProps) {
  const getStatusConfig = (currentStatus: ApiStatus) => {
    switch (currentStatus) {
      case 'connected':
        return {
          dotBg: 'bg-emerald-500',
          dotPing: 'bg-emerald-450',
          text: 'API Connected',
          textColor: 'text-emerald-600 dark:text-emerald-500',
          icon: <ShieldCheck className="h-3.5 w-3.5 animate-pulse text-emerald-500" />,
        }
      case 'connecting':
        return {
          dotBg: 'bg-amber-500',
          dotPing: 'bg-amber-405',
          text: 'API Reconnecting',
          textColor: 'text-amber-650 dark:text-amber-500',
          icon: <RefreshCw className="text-amber-550 h-3.5 w-3.5 animate-spin" />,
        }
      case 'disconnected':
        return {
          dotBg: 'bg-rose-500',
          dotPing: 'bg-rose-405',
          text: 'API Offline',
          textColor: 'text-rose-600 dark:text-rose-500',
          icon: <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />,
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <div className="flex items-center gap-3">
      {lastSyncTime && (
        <span className="hidden text-[10px] leading-none font-semibold text-neutral-400 select-none md:inline dark:text-neutral-500">
          Last Updated: {lastSyncTime}
        </span>
      )}
      <div
        className="flex items-center space-x-2"
        title={`Central REST API status: ${config.text}`}
      >
        <span className="relative flex h-2 w-2">
          {status === 'connected' && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${config.dotBg}`}></span>
        </span>
        <span
          className={`text-[10px] tracking-widest uppercase ${config.textColor} flex items-center gap-1 font-black select-none`}
        >
          {config.icon}
          {config.text}
        </span>
      </div>
    </div>
  )
}

interface FooterProps {
  apiStatus?: ApiStatus
  lastSyncTime?: string
}

export function Footer({
  apiStatus: _apiStatus = 'connected',
  lastSyncTime: _lastSyncTime,
}: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="text-neutral-450 dark:text-neutral-450 flex w-full shrink-0 flex-col items-center justify-between border-t border-neutral-200 bg-white px-4 py-3.5 text-xs font-semibold transition-colors duration-200 select-none sm:flex-row sm:px-6 dark:border-neutral-800 dark:bg-[#1C1C1E]">
      {/* Brand copyright */}
      <div className="flex items-center space-x-1 dark:text-neutral-400">
        <span>© {currentYear} CSCRS Inc.</span>
        <span>•</span>
        <span>Municipal Civic Resolution Platform</span>
      </div>

      {/* System Version status */}
      <div className="mt-2 flex items-center space-x-4 sm:mt-0">
        {/* Version label */}
        <div className="dark:text-neutral-450 dark:border-neutral-750 rounded border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-black text-neutral-400 dark:bg-neutral-800/40">
          {APP_CONFIG.version}
        </div>
      </div>
    </footer>
  )
}
export default Footer
