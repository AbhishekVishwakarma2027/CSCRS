import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { PATHS } from '@/routes/paths'

// Helper to format segments into displayable titles
const formatCrumbLabel = (segment: string): string => {
  if (!segment) return ''
  // Handle common routes or format automatically
  if (segment.toLowerCase() === 'dashboard') return 'Dashboard'

  // Replace hyphens/underscores and capitalize
  return segment.replace(/[-_]+/g, ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
}

export function Breadcrumb() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  return (
    <nav
      className="flex items-center space-x-1.5 text-xs font-semibold text-neutral-500"
      aria-label="Breadcrumb"
    >
      {/* Home Crumb */}
      <Link
        to={PATHS.ROOT}
        className="flex items-center gap-1 py-1 transition-colors duration-150 hover:text-[#0A3C7D]"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Home</span>
      </Link>

      {/* Path Crumbs */}
      {pathnames.map((segment, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1
        const label = formatCrumbLabel(segment)

        return (
          <div key={routeTo} className="flex items-center space-x-1.5">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
            {isLast ? (
              <span className="font-bold text-[#0A3C7D]" aria-current="page">
                {label}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="py-1 transition-colors duration-150 hover:text-[#0A3C7D]"
              >
                {label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
