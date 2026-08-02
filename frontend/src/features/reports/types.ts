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
