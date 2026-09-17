import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, Clock, ArrowLeft, Newspaper } from 'lucide-react'
import {
  AccessibilityBar,
  GovernmentHeader,
  Navbar,
  Footer,
  ScrollToTop,
} from '@/components/landing'
import { publicService, type PublicUpdate } from '@/features/public/services/public.service'
import { PATHS } from '@/routes/paths'

export default function PublicUpdateDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [update, setUpdate] = useState<PublicUpdate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    let isMounted = true
    const controller = new AbortController()

    setIsLoading(true)
    setError(null)

    publicService
      .getUpdateBySlug(slug, controller.signal)
      .then((data) => {
        if (isMounted) {
          setUpdate(data)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.detail || 'Article update not found.')
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [slug])

  const formattedDate = update?.published_at
    ? new Date(update.published_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : update?.created_at
      ? new Date(update.created_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : ''

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#f4f7fc] via-[#f7f6fd] to-[#f2f6fc]">
      <AccessibilityBar />
      <GovernmentHeader />
      <Navbar />

      <main id="main-content" className="flex-grow py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Back Navigation */}
          <Link
            to={PATHS.ROOT}
            className="text-primary hover:text-primary-dark mb-8 inline-flex items-center space-x-2 text-sm font-bold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>

          {isLoading ? (
            <div className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
              <div className="h-8 w-1/3 animate-pulse rounded bg-neutral-200" />
              <div className="h-12 w-3/4 animate-pulse rounded bg-neutral-200" />
              <div className="h-64 w-full animate-pulse rounded-xl bg-neutral-200" />
              <div className="space-y-3">
                <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
                <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
              </div>
            </div>
          ) : error || !update ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
              <Newspaper className="mx-auto h-12 w-12 text-neutral-300" />
              <h2 className="mt-4 text-xl font-black text-neutral-800">Article Not Found</h2>
              <p className="mt-2 text-sm text-neutral-500">
                {error ||
                  'The requested public news update could not be located or has been unpublished.'}
              </p>
              <Link
                to={PATHS.ROOT}
                className="bg-primary hover:bg-primary-dark mt-6 inline-flex items-center space-x-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow transition-colors"
              >
                <span>Return to Platform Home</span>
              </Link>
            </div>
          ) : (
            <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              {/* Cover Thumbnail */}
              {update.thumbnail_url ? (
                <div className="relative h-64 w-full overflow-hidden border-b border-neutral-200 sm:h-80">
                  <img
                    src={update.thumbnail_url}
                    alt={update.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}

              <div className="space-y-6 p-8 sm:p-10">
                {/* Meta Header */}
                <div className="border-neutral-150 flex flex-wrap items-center gap-3 border-b pb-4 text-xs font-semibold text-neutral-500">
                  <span className="rounded-md border border-neutral-200 bg-neutral-100 px-3 py-1 font-bold text-[#0A3C7D]">
                    {update.category}
                  </span>
                  <span className="text-neutral-300">•</span>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                    <span>{formattedDate}</span>
                  </div>
                  <span className="text-neutral-300">•</span>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="h-4 w-4 text-neutral-400" />
                    <span>{update.read_time_minutes} min read</span>
                  </div>
                </div>

                {/* Article Title */}
                <h1 className="text-2xl leading-tight font-black text-neutral-900 sm:text-3xl">
                  {update.title}
                </h1>

                {/* Optional Description / Subtitle */}
                {update.description && (
                  <p className="text-base leading-relaxed font-semibold text-neutral-600 italic">
                    {update.description}
                  </p>
                )}

                {/* Article Body Content */}
                <div className="prose prose-slate border-neutral-150 max-w-none space-y-4 border-t pt-6 text-sm leading-relaxed text-neutral-700">
                  {update.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </article>
          )}
        </div>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  )
}
