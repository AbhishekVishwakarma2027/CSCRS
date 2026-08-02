import { Menu } from 'lucide-react'
import { Breadcrumb } from '../Breadcrumb'
import { GlobalSearch } from './GlobalSearch'
import { NotificationBell } from './NotificationBell'
import { UserMenu } from './UserMenu'

interface HeaderProps {
  /** Callback to open/toggle the mobile navigation drawer. */
  onToggleSidebar: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-neutral-200 bg-white/95 px-4 shadow-sm backdrop-blur-md sm:px-6">
      {/* Left side: Hamburger & Breadcrumb */}
      <div className="flex min-w-0 items-center space-x-3 sm:space-x-4">
        {/* Mobile Hamburger toggle */}
        <button
          onClick={onToggleSidebar}
          className="shrink-0 rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100/80 hover:text-neutral-900 focus:outline-none lg:hidden"
          aria-label="Toggle Navigation Drawer"
        >
          <Menu className="h-5.5 w-5.5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="hidden truncate sm:block">
          <Breadcrumb />
        </div>
      </div>

      {/* Middle: Disabled GlobalSearch */}
      <div className="mx-6 hidden max-w-sm flex-1 md:block">
        <GlobalSearch />
      </div>

      {/* Right side: Alert bell & user options */}
      <div className="flex shrink-0 items-center space-x-2 sm:space-x-3">
        {/* Search button only on small mobile viewports */}
        <div className="md:hidden">
          {/* We could place a mobile search icon if needed, but keeping it simple for desktop-first layout */}
        </div>

        <NotificationBell />

        {/* Vertical divider */}
        <div className="h-6 w-px bg-neutral-200" />

        <UserMenu />
      </div>
    </header>
  )
}
