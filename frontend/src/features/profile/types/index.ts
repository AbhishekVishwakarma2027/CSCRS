import type { UserRole } from '@/types/auth.types'

export interface ProfileResponse {
  id: number
  name: string
  email: string
  phone: string | null
  role: UserRole
  profile_image: string | null
  is_email_verified: boolean
  is_active: boolean
  department_id: number | null
  employee_code: string | null
  designation: string | null
  phone_extension: string | null
  joined_at: string | null
  is_available: boolean | null
}

export interface UpdateProfileRequest {
  name?: string
  phone?: string
}
