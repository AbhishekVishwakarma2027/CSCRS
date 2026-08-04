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
