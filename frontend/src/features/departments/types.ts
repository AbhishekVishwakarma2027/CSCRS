export interface DepartmentResponseApi {
  id: number
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

export interface DepartmentUI {
  id: number
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  code: string // Derived department uppercase code (e.g. "SL")
  initials: string // Derived department initials for avatars
  colorClass: string // Deterministic high contrast color styling classes
}

export interface DepartmentFilters {
  q?: string
  status?: string // 'active' | 'inactive' | 'all'
  page?: number
  page_size?: number
}

// Deterministic colors for department avatars (WCAG high-contrast compliance)
const AVATAR_COLOR_CLASSES = [
  'bg-blue-600 text-white dark:bg-blue-500',
  'bg-emerald-600 text-white dark:bg-emerald-500',
  'bg-amber-600 text-white dark:bg-amber-500',
  'bg-rose-600 text-white dark:bg-rose-500',
  'bg-violet-600 text-white dark:bg-violet-500',
  'bg-cyan-600 text-white dark:bg-cyan-500',
]

/**
 * Deterministic helper to generate department initials.
 * Handles user specific requirements:
 * Roads -> RD, Sanitation -> SN, Water Supply -> WS, Street Lighting -> SL
 */
export function getDepartmentInitials(name: string): string {
  const cleanName = name.trim().toLowerCase()

  if (cleanName.includes('street lighting')) return 'SL'
  if (cleanName.includes('roads')) return 'RD'
  if (cleanName.includes('sanitation')) return 'SN'
  if (cleanName.includes('water supply')) return 'WS'
  if (cleanName.includes('waste')) return 'WM'
  if (cleanName.includes('health')) return 'HD'
  if (cleanName.includes('power')) return 'PD'

  const words = name.trim().split(/\s+/)
  const firstWord = words[0]
  const secondWord = words[1]
  if (firstWord && secondWord && firstWord[0] && secondWord[0]) {
    return (firstWord[0] + secondWord[0]).toUpperCase()
  }
  if (firstWord && firstWord.length >= 2) {
    // If single word like "Horticulture" -> "HT" or first/last
    const w = firstWord.toUpperCase()
    return w[0] + (w[2] || w[1] || '')
  }
  return 'DP'
}

/**
 * Deterministic helper to get color index from hash of name.
 */
export function getDepartmentColorClass(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_COLOR_CLASSES.length
  return AVATAR_COLOR_CLASSES[index] || 'bg-blue-600 text-white dark:bg-blue-500'
}

/**
 * DTO to UI Presentation Model Mapper.
 */
export function mapDepartmentApiToUi(dto: DepartmentResponseApi): DepartmentUI {
  const initials = getDepartmentInitials(dto.name)
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    is_active: dto.is_active,
    created_at: dto.created_at,
    code: initials,
    initials,
    colorClass: getDepartmentColorClass(dto.name),
  }
}
