export interface AuditLogItem {
  id: number
  report_id?: number | null
  user_id?: number | null
  action: string
  details?: string | null
  created_at?: string | null
}

export interface PaginatedAuditLogResponse {
  total: number
  page: number
  page_size: number
  items: AuditLogItem[]
}

export interface LoginAuditItem {
  id: number
  user_id?: number | null
  email?: string | null
  role?: string | null
  login_success: boolean
  failure_reason?: string | null
  ip_address?: string | null
  user_agent?: string | null
  browser?: string | null
  browser_version?: string | null
  operating_system?: string | null
  os_version?: string | null
  device_type?: string | null
  platform?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  request_path?: string | null
  http_method?: string | null
  login_source?: string | null
  login_at?: string | null
  logout_at?: string | null
  session_id?: string | null
  jwt_id?: string | null
}

export interface PaginatedLoginAuditResponse {
  total: number
  page: number
  page_size: number
  items: LoginAuditItem[]
}

export interface SystemHealthSummary {
  total_users: number
  total_departments: number
  active_workers: number
  total_reports: number
}

export interface SystemHealthResponse {
  status: string
  database: string
  redis: string
  app_name: string
  version: string
  timestamp: string
  system_summary: SystemHealthSummary
}

export interface AITelemetryResponse {
  total_ai_verifications: number
  distinct_model_versions: string[]
  average_confidence: number
  average_inference_time_ms: number
  resolution_ai_total: number
  resolution_ai_approved: number
  resolution_ai_manual_review: number
}

export interface AnnouncementRequest {
  title: string
  message: string
  target_role?: string | null
  announcement_type?: 'INFORMATIONAL' | 'MAINTENANCE' | 'URGENT_WARNING' | string
  starts_at?: string | null
  ends_at?: string | null
}

export interface AnnouncementResponse {
  success: boolean
  recipient_count: number
  message: string
  broadcast_id?: string | null
}

export interface AnnouncementItemResponse {
  broadcast_id: string
  title: string
  message: string
  target_role?: string
  announcement_type: 'INFORMATIONAL' | 'MAINTENANCE' | 'URGENT_WARNING' | string
  starts_at?: string | null
  ends_at?: string | null
  created_at: string
  recipient_count: number
  lifecycle_state: 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | string
  created_by?: number | null
}

export interface AuditLogFilters {
  page?: number
  page_size?: number
  action?: string
  user_id?: number
}

export interface LoginAuditFilters {
  page?: number
  page_size?: number
  login_success?: boolean
  user_id?: number
}
