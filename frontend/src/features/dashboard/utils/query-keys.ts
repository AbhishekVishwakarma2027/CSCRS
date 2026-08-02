export const DASHBOARD_QUERY_KEYS = {
  summary: () => ['dashboard', 'summary'] as const,
  status: () => ['dashboard', 'status'] as const,
  priorities: () => ['dashboard', 'priorities'] as const,
  issues: () => ['dashboard', 'issues'] as const,
  monthlyTrends: (year: number) => ['dashboard', 'monthly-trends', year] as const,
  recentReports: () => ['dashboard', 'recent-reports'] as const,
  highPriority: () => ['dashboard', 'high-priority'] as const,
  insights: () => ['dashboard', 'insights'] as const,
} as const
