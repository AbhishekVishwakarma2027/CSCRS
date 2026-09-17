import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { superAdminService } from '../services/super-admin.service'
import type {
  AuditLogFilters,
  LoginAuditFilters,
  PaginatedAuditLogResponse,
  PaginatedLoginAuditResponse,
  SystemHealthResponse,
  AITelemetryResponse,
  AnnouncementRequest,
  AnnouncementResponse,
  AnnouncementItemResponse,
} from '../types'

export const SUPER_ADMIN_QUERY_KEYS = {
  all: ['super-admin'] as const,
  auditLogs: (filters: AuditLogFilters) =>
    [...SUPER_ADMIN_QUERY_KEYS.all, 'audit-logs', filters] as const,
  loginAudits: (filters: LoginAuditFilters) =>
    [...SUPER_ADMIN_QUERY_KEYS.all, 'login-audits', filters] as const,
  health: () => [...SUPER_ADMIN_QUERY_KEYS.all, 'health'] as const,
  aiTelemetry: () => [...SUPER_ADMIN_QUERY_KEYS.all, 'ai-telemetry'] as const,
  announcements: (lifecycleState: string = 'ALL', announcementType: string = 'ALL') =>
    [...SUPER_ADMIN_QUERY_KEYS.all, 'announcements', lifecycleState, announcementType] as const,
}

/**
 * Hook to fetch paginated audit logs.
 */
export function useAuditLogsQuery(filters: AuditLogFilters = {}) {
  return useQuery<PaginatedAuditLogResponse, Error>({
    queryKey: SUPER_ADMIN_QUERY_KEYS.auditLogs(filters),
    queryFn: ({ signal }) => superAdminService.getAuditLogs(filters, signal),
    staleTime: 60 * 1000,
  })
}

/**
 * Hook to fetch paginated login audits.
 */
export function useLoginAuditsQuery(filters: LoginAuditFilters = {}) {
  return useQuery<PaginatedLoginAuditResponse, Error>({
    queryKey: SUPER_ADMIN_QUERY_KEYS.loginAudits(filters),
    queryFn: ({ signal }) => superAdminService.getLoginAudits(filters, signal),
    staleTime: 60 * 1000,
  })
}

/**
 * Hook to fetch platform system health overview.
 */
export function useSystemHealthQuery() {
  return useQuery<SystemHealthResponse, Error>({
    queryKey: SUPER_ADMIN_QUERY_KEYS.health(),
    queryFn: ({ signal }) => superAdminService.getSystemHealth(signal),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch AI model telemetry.
 */
export function useAITelemetryQuery() {
  return useQuery<AITelemetryResponse, Error>({
    queryKey: SUPER_ADMIN_QUERY_KEYS.aiTelemetry(),
    queryFn: ({ signal }) => superAdminService.getAITelemetry(signal),
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook to broadcast a system announcement.
 */
export function useBroadcastAnnouncementMutation() {
  const queryClient = useQueryClient()
  return useMutation<AnnouncementResponse, Error, AnnouncementRequest>({
    mutationFn: (payload) => superAdminService.broadcastAnnouncement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPER_ADMIN_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/**
 * Hook to fetch system announcements lifecycle summary.
 */
export function useAnnouncementsQuery(
  lifecycleState: string = 'ALL',
  announcementType: string = 'ALL'
) {
  return useQuery<AnnouncementItemResponse[], Error>({
    queryKey: SUPER_ADMIN_QUERY_KEYS.announcements(lifecycleState, announcementType),
    queryFn: ({ signal }) =>
      superAdminService.getAnnouncements(lifecycleState, announcementType, signal),
    staleTime: 15 * 1000,
  })
}

/**
 * Hook to end an active announcement for all recipients.
 */
export function useEndAnnouncementMutation() {
  const queryClient = useQueryClient()
  return useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: (broadcastId) => superAdminService.endAnnouncement(broadcastId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPER_ADMIN_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/**
 * Hook to delete a scheduled announcement.
 */
export function useDeleteAnnouncementMutation() {
  const queryClient = useQueryClient()
  return useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: (broadcastId) => superAdminService.deleteAnnouncement(broadcastId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPER_ADMIN_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/**
 * Hook to export AI dataset as Blob.
 */
export function useExportAIDatasetMutation() {
  return useMutation<Blob, Error, 'csv' | 'xlsx'>({
    mutationFn: (format) => superAdminService.exportAIDataset(format),
  })
}
