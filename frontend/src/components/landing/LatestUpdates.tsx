import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Tag, Clock, ArrowRight, Newspaper } from 'lucide-react'
import { publicService, type PublicUpdate } from '@/features/public/services/public.service'

export function LatestUpdates() {
  const [updates, setUpdates] = useState<PublicUpdate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    publicService
      .getUpdates(1, 6, undefined, controller.signal)
      .then((res) => {
        if (isMounted) {
          setUpdates(res.items)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  return (
    <section id="updates" className="border-neutral-150 border-b bg-neutral-50/20 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="text-primary text-xs font-extrabold tracking-widest uppercase">
            News & Press
          </h2>
          <p className="text-neutral-855 mt-1 text-3xl font-black">Latest Updates</p>
          <div className="bg-primary mx-auto mt-3 h-1 w-12 rounded" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-80 w-full animate-pulse rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
              />
            ))}
          </div>
        ) : updates.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
            <Newspaper className="mx-auto h-12 w-12 text-neutral-300" />
            <h3 className="mt-3 text-lg font-black text-neutral-800">
              No News Articles Published Yet
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Official platform updates, SOP guidelines, and press releases will be published here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {updates.map((news) => {
              const formattedDate = news.published_at
                ? new Date(news.published_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : new Date(news.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })

              return (
                <article
                  key={news.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:border-neutral-300 hover:shadow-md"
                >
                  {/* Card Main Body */}
                  <div className="space-y-4 p-6">
                    {/* Thumbnail Image / Placeholder */}
                    <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-neutral-200/80 bg-neutral-100">
                      {news.thumbnail_url ? (
                        <img
                          src={news.thumbnail_url}
                          alt={news.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-neutral-450 text-[10px] font-bold tracking-wider uppercase">
                          Public Update
                        </span>
                      )}
                      <div className="absolute top-2 right-2 rounded border border-neutral-200 bg-white/85 px-2 py-0.5 text-[9px] font-bold text-neutral-600 backdrop-blur">
                        {news.category}
                      </div>
                    </div>

                    {/* News Metadata row */}
                    <div className="flex flex-wrap items-center gap-3 border-b border-neutral-100 pb-2 text-[10px] font-semibold text-neutral-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="text-neutral-450 h-3.5 w-3.5" />
                        <span>{formattedDate}</span>
                      </div>
                      <span className="text-neutral-350">|</span>
                      <div className="text-primary flex items-center space-x-1">
                        <Tag className="h-3.5 w-3.5" />
                        <span>{news.category}</span>
                      </div>
                      <span className="text-neutral-350">|</span>
                      <div className="flex items-center space-x-1">
                        <Clock className="text-neutral-450 h-3.5 w-3.5" />
                        <span>{news.read_time_minutes} min read</span>
                      </div>
                    </div>

                    {/* Title and Preview */}
                    <h3 className="text-neutral-850 group-hover:text-primary line-clamp-2 text-sm leading-tight font-bold tracking-tight transition-colors">
                      {news.title}
                    </h3>
                    <p className="line-clamp-3 text-xs leading-relaxed text-neutral-500">
                      {news.description || news.content}
                    </p>
                  </div>

                  {/* Action Button footer */}
                  <Link
                    to={`/updates/${news.slug}`}
                    className="border-neutral-150 text-primary flex items-center justify-between border-t bg-neutral-50 px-6 py-4 text-xs font-bold transition-colors hover:bg-neutral-100"
                  >
                    <span>Read Update Detail</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
