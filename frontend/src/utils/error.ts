import type { AxiosError } from 'axios'
import type { ApiErrorDetail, ValidationError } from '@/types/common.types'

/**
 * Extracts a human-readable error message from an Axios error response.
 *
 * Handles three backend error shapes:
 * 1. { detail: string }               — standard HTTPException
 * 2. { detail: ValidationError[] }    — FastAPI 422 validation error
 * 3. { success: false, message: string } — rate limit 429 error
 * 4. Network / timeout errors
 */
export function extractApiError(error: unknown): string {
  if (!isAxiosError(error)) {
    return 'An unexpected error occurred.'
  }

  const data = error.response?.data as (ApiErrorDetail & { message?: string }) | undefined

  if (!data) {
    return error.message || 'Network error. Please check your connection.'
  }

  // Rate limit error shape: { success: false, message: string }
  if (typeof data.message === 'string') {
    return data.message
  }

  // Standard HTTPException: { detail: string }
  if (typeof data.detail === 'string') {
    return data.detail
  }

  // FastAPI 422 validation error: { detail: ValidationError[] }
  if (Array.isArray(data.detail)) {
    return (data.detail as ValidationError[]).map((e) => e.msg).join(', ')
  }

  return 'An unexpected error occurred.'
}

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error
}
