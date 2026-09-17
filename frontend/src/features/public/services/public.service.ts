import { apiClient } from '@/services/api'

export interface PublicOverviewResponse {
  reports_resolved: number
  departments: number
  active_workers: number
  covered_cities: number
}

export interface DistrictSummaryItem {
  district: string
  total_reports: number
  resolved_reports: number
  active_departments: number
  active_workers: number
  average_resolution_hours: number
  coordinates_available: boolean
}

export interface StateDashboardResponse {
  state: string
  total_reports: number
  resolved_reports: number
  active_departments: number
  active_workers: number
  average_resolution_hours: number
  resolution_rate: number
  districts: DistrictSummaryItem[]
}

export interface PublicUpdate {
  id: number
  title: string
  slug: string
  description?: string
  content: string
  category: string
  thumbnail_url?: string
  published_at?: string
  read_time_minutes: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface PaginatedPublicUpdates {
  items: PublicUpdate[]
  total_items: number
  page: number
  page_size: number
  total_pages: number
}

export const publicService = {
  /**
   * Fetch real aggregate platform snapshot metrics (Unauthenticated).
   */
  async getOverview(signal?: AbortSignal): Promise<PublicOverviewResponse> {
    const { data } = await apiClient.get<PublicOverviewResponse>('/api/v1/public/overview', {
      signal,
    })
    return data
  },

  /**
   * Fetch real state & district analytics (Unauthenticated).
   */
  async getStateDashboard(
    state: string = 'Uttar Pradesh',
    signal?: AbortSignal
  ): Promise<StateDashboardResponse> {
    const { data } = await apiClient.get<StateDashboardResponse>('/api/v1/public/state-dashboard', {
      params: { state },
      signal,
    })
    return data
  },

  /**
   * Fetch published news & press updates (Unauthenticated).
   */
  async getUpdates(
    page: number = 1,
    pageSize: number = 10,
    category?: string,
    signal?: AbortSignal
  ): Promise<PaginatedPublicUpdates> {
    const { data } = await apiClient.get<PaginatedPublicUpdates>('/api/v1/public/updates', {
      params: { page, page_size: pageSize, category: category || undefined },
      signal,
    })
    return data
  },

  /**
   * Fetch a single published news update detail by slug (Unauthenticated).
   */
  async getUpdateBySlug(slug: string, signal?: AbortSignal): Promise<PublicUpdate> {
    const { data } = await apiClient.get<PublicUpdate>(`/api/v1/public/updates/${slug}`, {
      signal,
    })
    return data
  },
}
