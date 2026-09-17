export const APP_CONFIG = {
  version: import.meta.env.VITE_APP_VERSION || 'v1.0.0',
  environment: import.meta.env.MODE || 'development',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  dashboardPollInterval: Number(import.meta.env.VITE_DASHBOARD_POLL_INTERVAL) || 30000, // 30 seconds default
} as const
