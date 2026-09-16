/**
 * Application route path constants.
 * All route strings are defined here — never use raw string literals in route logic.
 * Additional paths will be added incrementally as each module is implemented.
 */
export const PATHS = {
  // Public
  ROOT: '/',
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  VERIFY_RESET_OTP: '/verify-reset-otp',
  RESET_PASSWORD: '/reset-password',
  ACTIVATE_ADMIN: '/admins/activate',
  ACTIVATE_CITY_ADMIN: '/city-admins/activate',
  ACTIVATE_WORKER: '/workers/activate',

  // Authenticated — foundation
  DASHBOARD: '/dashboard',
  REPORTS: '/reports',
  DEPARTMENTS: '/departments',
  USERS: '/users',
  FEEDBACK: '/feedback',
  SYSTEM_ISSUES: '/system-issues',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  EXPORTS: '/exports',
  SUBMIT_ISSUE: '/submit-issue',
  MY_ISSUES: '/my-issues',
  WORKERS: '/workers',
  MANUAL_REVIEW: '/resolutions/manual-review',
  FORWARD_REQUESTS: '/forward-requests',
  SUPER_ADMIN_GOVERNANCE: '/super-admin/governance',
  NOTIFICATIONS: '/notifications',

  // Error states
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '*',
} as const

export type AppPath = (typeof PATHS)[keyof typeof PATHS]
