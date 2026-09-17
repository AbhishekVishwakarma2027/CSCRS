export type ForwardRequestStatus =
  | 'Pending'
  | 'Approved By Source'
  | 'Waiting Destination'
  | 'Accepted'
  | 'Rejected'
  | 'Forwarded Again'
  | 'Cancelled'

export type ForwardReasonType =
  | 'WRONG_AI_CLASSIFICATION'
  | 'WRONG_CITIZEN_CATEGORY'
  | 'ADMINISTRATIVE_TRANSFER'
  | 'DUPLICATE_DEPARTMENT'
  | 'OTHER'

export interface ForwardRequestResponse {
  id: number
  report_id: number
  worker_id: number
  worker_name?: string | null
  current_department_id: number
  destination_department_id?: number | null
  source_department_name?: string | null
  destination_department_name?: string | null
  reason: string
  status: ForwardRequestStatus
  decision_reason: string | null
  reviewed_at: string | null
  reviewed_by: number | null
  reviewer_name?: string | null
  created_at?: string | null
}

export interface IncomingForwardRequestResponse {
  id: number
  report_id: number
  worker_id?: number | null
  worker_name?: string | null
  current_department_id: number
  destination_department_id?: number | null
  source_department_name?: string | null
  destination_department_name?: string | null
  reason: string
  status: ForwardRequestStatus
  decision_reason: string | null
  reviewed_at: string | null
  reviewed_by: number | null
  reviewer_name?: string | null
  created_at?: string | null
}

export interface ForwardRequestWorkerInfo {
  id: number
  name: string
  email: string | null
  phone: string | null
}

export interface ForwardRequestReportInfo {
  id: number
  report_number: string
  issue_type: string
  priority: string
  status: string
  latitude: number
  longitude: number
  address: string | null
  support_count: number
  risk_score: number
  ai_confidence: number
  verification_decision: string
  verification_passed: boolean
}

export interface ForwardRequestDepartmentInfo {
  id: number
  name: string
}

export interface ForwardRequestDepartments {
  source_department: ForwardRequestDepartmentInfo
  destination_department: ForwardRequestDepartmentInfo | null
}

export interface ForwardRequestImageInfo {
  original_image: string | null
  annotated_image: string | null
  resolution_image: string | null
}

export interface ForwardRequestTimelineInfo {
  title: string
  description: string
  created_at: string
}

export interface ForwardRequestDetailResponse {
  request_id: number
  status: ForwardRequestStatus
  reason: string
  decision_reason?: string | null
  reviewed_at?: string | null
  reviewed_by?: number | null
  reviewer_name?: string | null
  created_at: string
  worker: ForwardRequestWorkerInfo
  report: ForwardRequestReportInfo
  departments: ForwardRequestDepartments
  images: ForwardRequestImageInfo
  timeline: ForwardRequestTimelineInfo[]
}
