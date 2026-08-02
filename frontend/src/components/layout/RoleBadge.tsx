import { UserRole } from '@/types/auth.types'
import { getRoleLabel } from '@/utils/role'

interface RoleBadgeProps {
  role: UserRole
  className?: string
}

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  const label = getRoleLabel(role)

  // Determine styling based on role (Navy, Teal, Indigo)
  const getBadgeStyle = (userRole: UserRole) => {
    switch (userRole) {
      case UserRole.SUPER_ADMIN:
        return 'bg-[#0A3C7D]/10 text-[#0A3C7D] border-[#0A3C7D]/20 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900/40'
      case UserRole.CITY_ADMIN:
        return 'bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/20 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-900/40'
      case UserRole.DEPARTMENT_ADMIN:
        return 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-900/40'
      default:
        return 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-350 dark:border-neutral-700'
    }
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold tracking-tight ${getBadgeStyle(
        role
      )} ${className}`}
    >
      {label}
    </span>
  )
}
