import { UserRole } from '@/types/auth.types'

/**
 * Human-readable labels for admin roles.
 * Maps backend PascalCase role strings to display labels.
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.CITY_ADMIN]: 'City Admin',
  [UserRole.DEPARTMENT_ADMIN]: 'Department Admin',
}

/**
 * Returns the display label for a given role.
 */
export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role]
}

/**
 * Checks if the given role is included in the allowed roles array.
 * Used by ProtectedRoute and RBAC-conditional UI elements.
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}
