import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data considered fresh for 60 seconds — avoids redundant refetches on navigation
      staleTime: 1000 * 60,
      // Keep unused query data in cache for 5 minutes
      gcTime: 1000 * 60 * 5,
      // Only retry GET queries — never retry mutations (mutations are configured per call)
      retry: (failureCount, error) => {
        // Do not retry on 401 (handled by Axios interceptor), 403, or 404
        if (error instanceof Error && 'status' in error) {
          const status = (error as { status: number }).status
          if ([401, 403, 404, 422].includes(status)) return false
        }
        return failureCount < 2
      },
      // Refetch when user returns to the tab (catches stale admin data)
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Never auto-retry mutations — each call may produce side effects
      retry: false,
    },
  },
})
