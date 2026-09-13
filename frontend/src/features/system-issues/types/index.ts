export enum SystemIssueCategory {
  AUTHENTICATION = 'Authentication',
  AUTHORIZATION = 'Authorization',
  REPORT_SUBMISSION = 'Report Submission',
  REPORT_VERIFICATION = 'Report Verification',
  DUPLICATE_DETECTION = 'Duplicate Detection',
  ASSIGNMENT = 'Assignment',
  WORKER = 'Worker',
  RESOLUTION_UPLOAD = 'Resolution Upload',
  RESOLUTION_VERIFICATION = 'Resolution Verification',
  TIMELINE = 'Timeline',
  NOTIFICATION = 'Notification',
  EMAIL = 'Email',
  DASHBOARD = 'Dashboard',
  SEARCH = 'Search',
  FILTER = 'Filter',
  PERFORMANCE = 'Performance',
  UI_UX = 'UI / UX',
  API = 'API',
  DATABASE = 'Database',
  AI_DETECTION = 'AI Detection',
  GPS_EXIF = 'GPS / EXIF',
  IMAGE_UPLOAD = 'Image Upload',
  VIDEO_UPLOAD = 'Video Upload',
  SECURITY = 'Security',
  OTHER = 'Other',
}

export enum SystemIssueStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export interface SystemIssueListItem {
  issue_number: string
  title: string
  category: SystemIssueCategory
  status: SystemIssueStatus | string
  reporter_name: string
  created_at: string
}

export interface SystemIssueAttachment {
  original_filename: string
  file_path: string
  mime_type: string
  file_size: number
}

export interface MySystemIssueItem {
  issue_number: string
  title: string
  description: string
  category: SystemIssueCategory
  status: SystemIssueStatus | string
  remarks?: string | null
  related_report_number?: string | null
  attachments: SystemIssueAttachment[]
  created_at: string
  updated_at: string
  closed_at?: string | null
}

export interface SystemIssueDetail {
  issue_number: string
  title: string
  description: string
  category: SystemIssueCategory
  status: SystemIssueStatus | string
  reporter_name: string
  reporter_email: string
  reporter_phone: string | null
  related_report_number: string | null
  remarks?: string | null
  attachments: SystemIssueAttachment[]
  created_at: string
  updated_at: string
  closed_at?: string | null
}
