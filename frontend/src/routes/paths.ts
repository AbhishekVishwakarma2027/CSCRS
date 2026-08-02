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

  // Authenticated — foundation
  DASHBOARD: '/dashboard',
  REPORTS: '/reports',
  DEPARTMENTS: '/departments',
  FEEDBACK: '/feedback',

  // Error states
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '*',
} as const

export type AppPath = (typeof PATHS)[keyof typeof PATHS]
