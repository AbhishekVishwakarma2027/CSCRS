/**
 * Full-page loading spinner used while lazy-loaded route chunks are downloading.
 * Replaced with proper skeleton UI in Phase 3.
 */
export function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
    </div>
  )
}
