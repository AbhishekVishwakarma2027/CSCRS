import { Calendar, Tag, Clock, ArrowRight } from 'lucide-react'

interface NewsItem {
  id: number
  date: string
  category: string
  readTime: string
  title: string
  preview: string
}

const RECENT_NEWS: NewsItem[] = [
  {
    id: 1,
    date: 'July 30, 2026',
    category: 'System SLA',
    readTime: '3 min read',
    title: 'Resolution SLAs Updated for Sanitation Department',
    preview:
      'Revised timeframe guidelines have been configured to expedite public cleaning tickets in high-density sectors.',
  },
  {
    id: 2,
    date: 'July 28, 2026',
    category: 'Announcements',
    readTime: '4 min read',
    title: 'Noida Division Added to CSCRS Active Coverage',
    preview:
      'Civil administration boundaries have been expanded. Regional department heads onboarded to manage local assignments.',
  },
  {
    id: 3,
    date: 'July 25, 2026',
    category: 'SOP Update',
    readTime: '5 min read',
    title: 'New Guidelines Issued for On-Site Photo Verification',
    preview:
      'Mandatory checking parameters established for worker resolution submissions. All reviews now require active GPS tags.',
  },
]

export function LatestUpdates() {
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {RECENT_NEWS.map((news) => (
            <article
              key={news.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:border-neutral-300 hover:shadow-md"
            >
              {/* Card Main Body */}
              <div className="space-y-4 p-6">
                {/* Thumbnail graphic placeholder */}
                <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-neutral-200/80 bg-neutral-100">
                  <span className="text-neutral-450 text-[10px] font-bold tracking-wider uppercase">
                    Update Thumbnail
                  </span>
                  <div className="absolute top-2 right-2 rounded border border-neutral-200 bg-white/85 px-2 py-0.5 text-[9px] font-bold text-neutral-600 backdrop-blur">
                    Press
                  </div>
                </div>

                {/* News Metadata row */}
                <div className="flex flex-wrap items-center gap-3 border-b border-neutral-100 pb-2 text-[10px] font-semibold text-neutral-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="text-neutral-450 h-3.5 w-3.5" />
                    <span>{news.date}</span>
                  </div>
                  <span className="text-neutral-350">|</span>
                  <div className="text-primary flex items-center space-x-1">
                    <Tag className="h-3.5 w-3.5" />
                    <span>{news.category}</span>
                  </div>
                  <span className="text-neutral-350">|</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="text-neutral-450 h-3.5 w-3.5" />
                    <span>{news.readTime}</span>
                  </div>
                </div>

                {/* Title and Preview */}
                <h3 className="text-neutral-850 group-hover:text-primary text-sm leading-tight font-bold tracking-tight transition-colors">
                  {news.title}
                </h3>
                <p className="text-xs leading-relaxed text-neutral-500">{news.preview}</p>
              </div>

              {/* Action Button footer */}
              <div className="border-neutral-150 text-primary flex cursor-pointer items-center justify-between border-t bg-neutral-50 px-6 py-4 text-xs font-bold transition-colors hover:bg-neutral-100">
                <span>Read Update Detail</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
