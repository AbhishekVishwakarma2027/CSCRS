export type ReportStatus =
  | 'Pending'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Verified'
  | 'Closed'
  | 'Cancelled'
  | 'Rejected'

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical'

// Backend DTO for City Admins
export interface CityReportListItemApi {
  id: number
  report_number: string
  issue_type: string
  status: ReportStatus
  priority: Priority
  department_id: number
  citizen_id: number
  created_at: string
}

// Backend DTO for Department Admins
export interface DepartmentReportListItemApi {
  id: number
  report_number: string
  issue_type: string
  status: ReportStatus
  priority: Priority
  citizen_id: number
  created_at: string
}

// Backend Paginated Wrapper for City Reports
export interface PaginatedCityReportsApi {
  items: CityReportListItemApi[]
  pagination: {
    total_items: number
    page: number
    page_size: number
    total_pages: number
  }
}

// Unified UI Presentation model for components (table/cards)
export interface ReportListItem {
  id: number
  report_number: string
  issue_type: string
  status: ReportStatus
  priority: Priority
  department_id?: number
  citizen_id: number
  created_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total_items: number
  page: number
  page_size: number
  total_pages: number
}

export interface ReportFilters {
  q?: string
  status?: string
  priority?: string
  issue_type?: string
  page?: number
  page_size?: number
}

// Backend DTO for Report Details
export interface ReportResponseApi {
  id: number
  report_number: string
  issue_type: string
  status: ReportStatus
  priority: Priority
  latitude: number
  longitude: number
  address: string | null
  risk_score: number
  ai_confidence: number
  verification_decision: string
  verification_passed: boolean
}

// Timeline Interfaces
export interface TimelineEvent {
  title: string
  description: string
  created_at: string
}

export interface TimelineResponse {
  report_id: number
  report_number: string
  status: string
  timeline: TimelineEvent[]
}

// ==========================================
// Admin API Types
// ==========================================
export interface AdminCitizenInfo {
  id: number
  name: string
  email: string
  phone?: string | null
  profile_image?: string | null
}

export interface AdminDepartmentInfo {
  id: number
  name: string
}

export interface AdminWorkerInfo {
  id: number
  name: string
}

export interface AdminAssignmentInfo {
  id: number
  worker: AdminWorkerInfo
  assigned_by: number
  assigned_at: string
  accepted_at?: string | null
  completed_at?: string | null
  status: string
  remarks?: string | null
}

export interface AdminResolutionAttemptInfo {
  id: number
  attempt_number: number
  verification_passed: boolean
  verification_score?: number | null
  verification_decision?: string | null
  ai_decision?: string | null
  failure_reason?: string | null
  model_version?: string | null
  created_at: string
  has_annotated_image: boolean
}

export interface AdminResolutionInfo {
  id: number
  worker_id: number
  remarks?: string | null
  verification_passed: boolean
  resolved_at: string
  verification_score?: number | null
  verification_decision?: string | null
  manual_review: boolean
  verified_at?: string | null
  attempts: AdminResolutionAttemptInfo[]
}

export interface AdminResolutionAIInfo {
  id: number
  attempt_number: number
  scene_similarity?: number | null
  same_scene?: boolean | null
  yolo_issue_found?: boolean | null
  original_area?: number | null
  remaining_area?: number | null
  cleaned_percentage?: number | null
  decision_confidence?: number | null
  ai_decision: string
  model_version: string
  created_at: string
}

export interface AdminImageInfo {
  id: number
  image_type: string
  uploaded_at: string
}

export interface AdminDetectionInfo {
  id: number
  class_name: string
  confidence: number
  model_version: string
  created_at: string
}

export interface AdminReportDetailsResponseApi {
  id: number
  report_number: string
  issue_type: string
  description?: string | null
  status: ReportStatus
  priority: Priority
  latitude: number
  longitude: number
  address?: string | null
  risk_score: number
  ai_confidence: number
  verification_decision: string
  verification_passed: boolean
  created_at: string
  updated_at: string
  citizen?: AdminCitizenInfo | null
  department?: AdminDepartmentInfo | null
  images: AdminImageInfo[]
  assignments: AdminAssignmentInfo[]
  resolution?: AdminResolutionInfo | null
  resolution_ai?: AdminResolutionAIInfo | null
  detections: AdminDetectionInfo[]
}

export interface AdminTimelineEvent {
  id: number
  user_id: number
  actor_name?: string | null
  actor_role?: string | null
  action: string
  details?: string | null
  created_at: string
}

export interface AdminTimelineResponse {
  report_id: number
  report_number: string
  timeline: AdminTimelineEvent[]
}
