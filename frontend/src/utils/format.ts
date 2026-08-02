import { format, formatDistanceToNow, parseISO } from 'date-fns'

/**
 * Formats an ISO 8601 UTC timestamp string from the backend
 * into a human-readable date (e.g. "Jul 30, 2026").
 */
export function formatDate(isoString: string): string {
  return format(parseISO(isoString), 'MMM d, yyyy')
}

/**
 * Formats an ISO 8601 UTC timestamp string into a full datetime
 * (e.g. "Jul 30, 2026 at 8:42 PM").
 */
export function formatDateTime(isoString: string): string {
  return format(parseISO(isoString), "MMM d, yyyy 'at' h:mm a")
}

/**
 * Returns a relative time string (e.g. "3 hours ago", "2 days ago").
 * Useful for notification timestamps, report ages, etc.
 */
export function formatRelativeTime(isoString: string): string {
  return formatDistanceToNow(parseISO(isoString), { addSuffix: true })
}
