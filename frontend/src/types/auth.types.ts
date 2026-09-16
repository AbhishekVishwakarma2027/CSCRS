/**
 * User roles as returned by the backend JWT payload.
 * Backend serializes roles as PascalCase strings (confirmed in api-conventions.md).
 */
export const UserRole = {
  SUPER_ADMIN: 'SuperAdmin',
  CITY_ADMIN: 'CityAdmin',
  DEPARTMENT_ADMIN: 'DepartmentAdmin',
  CITIZEN: 'Citizen',
  WORKER: 'Worker',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

/**
 * Authenticated user profile.
 * Shape returned by GET /api/v1/auth/me
 */
export interface UserProfile {
  id: number
  name: string
  email: string
  role: UserRole
}

/**
 * Response from POST /api/v1/auth/login and POST /api/v1/auth/refresh
 */
export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

/**
 * Active session metadata from GET /api/v1/auth/sessions
 */
export interface SessionResponse {
  id: number
  session_id: string
  device_type: string | null
  browser: string | null
  operating_system: string | null
  ip_address: string | null
  created_at: string
  last_used_at: string | null
  expires_at: string
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
  confirm_password: string
}
