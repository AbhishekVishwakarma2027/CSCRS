export interface CityDashboardSummaryResponse {
  total_reports: number
  pending_reports: number
  assigned_reports: number
  in_progress_reports: number
  resolved_reports: number
  closed_reports: number
  rejected_reports: number
  cancelled_reports: number
  reopened_reports: number
  total_departments: number
  total_workers: number
  total_citizens: number
  resolution_rate: number
  automation_rate: number
}

export interface DepartmentDashboardResponse {
  total_reports: number
  pending_reports: number
  assigned_reports: number
  in_progress_reports: number
  resolved_reports: number
  cancelled_reports: number
  reopened_reports: number
  available_workers: number
  busy_workers: number
  forward_requests_pending: number
  forward_requests_accepted: number
  forward_requests_rejected: number
  average_resolution_time_hours: number
  automation_rate: number
}

export interface DepartmentStatisticsItem {
  department_id: number
  department_name: string
  total_reports: number
}

export interface IssueStatisticsItem {
  issue_type: string
  total_reports: number
}

export interface StatusStatisticsItem {
  status: string
  total_reports: number
}

export interface PriorityStatisticsItem {
  priority: string
  total_reports: number
}

export interface MonthlyTrendItem {
  month: number
  month_name: string
  total_reports: number
}

export interface RecentReportItem {
  report_number: string
  issue_type: string
  priority: string
  status: string
  department_name: string
  created_at: string
}

export interface HighPriorityReportItem {
  report_number: string
  issue_type: string
  priority: string
  status: string
  department_name: string
  risk_score: number
  created_at: string
  age_hours: number
  assigned_worker: string | null
}

export interface DashboardInsightItem {
  type: string
  title: string
  message: string
}
