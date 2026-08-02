/**
 * User roles as returned by the backend JWT payload.
 * Backend serializes roles as PascalCase strings (confirmed in api-conventions.md).
 */
export const UserRole = {
  SUPER_ADMIN: 'SuperAdmin',
  CITY_ADMIN: 'CityAdmin',
  DEPARTMENT_ADMIN: 'DepartmentAdmin',
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
  session_id: string
  browser: string | null
  os: string | null
  device_type: string | null
  last_used: string
  created_at: string
}
