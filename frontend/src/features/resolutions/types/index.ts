export interface ManualReviewItem {
  report_id: number
  report_number: string
  issue_type: string
  priority: string
  worker_name: string
  verification_score: number | null
  resolved_at: string
  scene_similarity: number | null
  verification_decision: string | null
  failure_reason: string | null
  attempt_number: number | null
}

export interface ManualReviewDetail {
  report_id: number
  report_number: string
  issue_type: string
  priority: string
  remarks: string | null
  verification_score: number | null
  verification_decision: string | null
  manual_review: boolean
  resolved_at: string
  worker_name: string
  failure_reason: string | null
  attempt_number: number | null
  ai_decision: string | null
  model_version: string | null
  scene_similarity: number | null
  same_scene: boolean | null
  yolo_issue_found: boolean | null
  worker_id: number
  worker_email: string
  worker_phone: string | null
  department_name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  original_image_path: string | null
  annotated_image_path: string | null
  resolution_image_path: string | null
}

export interface ResolutionResponse {
  id: number
  report_id: number
  worker_id: number
  remarks: string | null
  verification_passed: boolean
  verification_score: number | null
  verification_decision: string | null
  manual_review: boolean
  verified_at: string | null
  resolved_at: string
}
