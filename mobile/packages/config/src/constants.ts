export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'cscrs_access_token',
  REFRESH_TOKEN: 'cscrs_refresh_token',
  USER_DATA: 'cscrs_user_data',
  THEME_MODE: 'cscrs_theme_mode',
  LANGUAGE: 'cscrs_language',
} as const;

export const APP_INFO = {
  NAME: 'CSCRS Mobile',
  VERSION: '1.0.0',
  BUILD: '1',
} as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    ME: '/api/v1/auth/me',
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',
    LOGOUT_ALL: '/api/v1/auth/logout-all',
    SESSIONS: '/api/v1/auth/sessions',
    VERIFY_EMAIL: '/api/v1/auth/verify-email',
    RESEND_OTP: '/api/v1/auth/resend-otp',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    VERIFY_RESET_OTP: '/api/v1/auth/verify-reset-otp',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
    CHANGE_PASSWORD: '/api/v1/auth/change-password',
  },
  PROFILE: {
    ME: '/api/v1/profile/me',
    PHOTO: '/api/v1/profile/photo',
  },
  REPORTS: {
    CREATE: '/api/v1/report',
    MY: '/api/v1/reports/my',
    SEARCH: '/api/v1/reports/my/search',
    DETAIL: (reportNumber: string) => `/api/v1/reports/${reportNumber}`,
    TIMELINE: (reportId: number) => `/api/v1/reports/${reportId}/timeline`,
  },
  NOTIFICATIONS: {
    LIST: '/api/v1/notifications',
    UNREAD_COUNT: '/api/v1/notifications/unread-count',
    MARK_READ: (id: number) => `/api/v1/notifications/${id}/read`,
    MARK_ALL_READ: '/api/v1/notifications/read-all',
  },
  WORKER: {
    ASSIGNMENTS: '/api/v1/assignments/my',
    START_WORK: (id: number) => `/api/v1/assignments/${id}/start`,
    RESOLUTIONS: '/api/v1/resolutions',
    FORWARD: (reportId: number) => `/api/v1/forward-requests/${reportId}`,
    ACTIVATE: '/api/v1/workers/activate',
  },
  DASHBOARD: {
    CITIZEN: '/api/v1/dashboard/citizen/dashboard',
    WORKER: '/api/v1/dashboard/worker/dashboard',
  },
} as const;
