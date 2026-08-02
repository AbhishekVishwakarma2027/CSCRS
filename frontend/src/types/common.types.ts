/**
 * Standard backend success message response.
 * Returned by endpoints that don't return a resource (e.g. logout, mark-as-read).
 */
export interface MessageResponse {
  message: string
}

/**
 * Standard FastAPI HTTPException error shape.
 * detail is a string for most errors, or a ValidationError[] for 422.
 */
export interface ApiErrorDetail {
  detail: string | ValidationError[]
}

/**
 * Rate limit error shape (HTTP 429) — custom format from SlowAPI handler.
 */
export interface RateLimitError {
  success: false
  message: string
  error_code: 'RATE_LIMIT_EXCEEDED'
}

/**
 * Pydantic validation error item (HTTP 422).
 */
export interface ValidationError {
  loc: string[]
  msg: string
  type: string
}

/**
 * Generic paginated response wrapper.
 * Used by GET /api/v1/reports which returns a paginated envelope.
 *
 * Note: Not all list endpoints are paginated — check each endpoint's schema.
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}
