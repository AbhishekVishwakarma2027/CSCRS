import { useQuery } from '@tanstack/react-query'
import type { SystemIssueFilters } from '../services/system-issues.service'
import { systemIssuesService } from '../services/system-issues.service'
import type { SystemIssueListItem, SystemIssueDetail } from '../types'

export const SYSTEM_ISSUES_QUERY_KEYS = {
  all: ['system-issues'] as const,
  lists: () => [...SYSTEM_ISSUES_QUERY_KEYS.all, 'list'] as const,
  list: (filters: SystemIssueFilters) => [...SYSTEM_ISSUES_QUERY_KEYS.lists(), filters] as const,
  details: () => [...SYSTEM_ISSUES_QUERY_KEYS.all, 'detail'] as const,
  detail: (issueNumber: string) => [...SYSTEM_ISSUES_QUERY_KEYS.details(), issueNumber] as const,
}

/**
 * Fetch all system issues.
 */
export function useSystemIssuesQuery(filters: SystemIssueFilters = {}) {
  return useQuery<SystemIssueListItem[], Error>({
    queryKey: SYSTEM_ISSUES_QUERY_KEYS.list(filters),
    queryFn: ({ signal }) => systemIssuesService.getIssues(filters, signal),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch a single system issue by issue number.
 */
export function useSystemIssueDetailQuery(issueNumber: string | null) {
  return useQuery<SystemIssueDetail, Error>({
    queryKey: SYSTEM_ISSUES_QUERY_KEYS.detail(issueNumber!),
    queryFn: ({ signal }) => systemIssuesService.getIssueDetail(issueNumber!, signal),
    enabled: !!issueNumber,
    staleTime: 30 * 1000,
  })
}
