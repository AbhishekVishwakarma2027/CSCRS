export interface DepartmentAdminCreate {
  name: string
  email: string
  department_id: number
}

export interface DepartmentAdminResponse {
  id: number
  name: string
  email: string
  department_id: number
  is_active: boolean
}

export interface CityAdminCitizenItem {
  id: number
  name: string
  email: string
  phone: string | null
  is_active: boolean
  is_email_verified: boolean
  is_blocked: boolean
  created_at: string
}

export interface CityAdminDepartmentAdminItem {
  id: number
  name: string
  email: string
  phone: string | null
  department_id: number | null
  is_active: boolean
  is_email_verified: boolean
  is_blocked: boolean
  created_at: string
}

export interface CityAdminCreate {
  name: string
  email: string
  phone?: string
}

export interface CityAdminItem {
  id: number
  name: string
  email: string
  phone: string | null
  is_active: boolean
  is_email_verified: boolean
  is_blocked: boolean
  created_at: string
}

export type BlockTypeEnum = 'RETIRED' | 'TRANSFERRED' | 'SUSPENDED' | 'TERMINATED' | 'DISMISSED'

export interface BlockUserPayload {
  block_type: BlockTypeEnum | string
  reason: string
}
