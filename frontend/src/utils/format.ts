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

/**
 * Normalizes any absolute backend media/profile photo URL to handle host mismatches in dev/prod.
 * Handles extracting relative /uploads paths and appending the active VITE_API_BASE_URL.
 */
export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return ''

  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.includes('/api/')) {
      const path = url.substring(url.indexOf('/api/'))
      return import.meta.env.DEV
        ? path
        : `${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')}${path}`
    }
    if (url.includes('/uploads/')) {
      const path = url.substring(url.indexOf('/uploads/'))
      return import.meta.env.DEV
        ? path
        : `${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')}${path}`
    }
    return url
  }

  if (url.startsWith('/api/') || url.includes('/api/')) {
    const path = url.startsWith('/') ? url : '/' + url.substring(url.indexOf('api/'))
    return import.meta.env.DEV
      ? path
      : `${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')}${path}`
  }

  if (url.startsWith('/uploads/') || url.includes('uploads/')) {
    const path = url.startsWith('/') ? url : '/' + url.substring(url.indexOf('uploads/'))
    return import.meta.env.DEV
      ? path
      : `${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')}${path}`
  }

  return url
}

/**
 * Formats an AI confidence percentage (0-100 scale) to a string with exactly 2 decimal places.
 * Examples: 56.74 -> "56.74%", 87.3 -> "87.30%", 99 -> "99.00%"
 */
export function formatConfidence(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'N/A'
  }
  return `${Number(value).toFixed(2)}%`
}
