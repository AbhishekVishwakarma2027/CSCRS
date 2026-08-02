import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface HeroSlide {
  title: string
  subtitle: string
  description: string
  primaryCtaText: string
  primaryCtaLink: string
  secondaryCtaText?: string
  secondaryCtaLink?: string
  backgroundClass?: string
}

interface HeroSliderProps {
  slides: HeroSlide[]
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused || slides.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isPaused, slides.length])

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length)
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }

  if (!slides || slides.length === 0) return null

  return (
    <div
      id="home"
      className="relative h-[480px] w-full overflow-hidden select-none md:h-[540px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides container */}
      <div className="relative h-full w-full">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex
          return (
            <div
              key={index}
              className={`absolute inset-0 flex h-full w-full items-center bg-gradient-to-r from-[#01142E] via-[#0A3C7D] to-[#01142E] transition-opacity duration-700 ease-in-out ${
                isActive
                  ? 'pointer-events-auto z-10 opacity-100'
                  : 'pointer-events-none z-0 opacity-0'
              }`}
            >
              {/* Rich Overlay mask for absolute WCAG AA legibility */}
              <div className="absolute inset-0 z-15 bg-gradient-to-r from-black/85 via-black/60 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.04),transparent_60%)]" />

              <div className="relative z-20 mx-auto w-full max-w-7xl px-4 text-white sm:px-6 lg:px-8">
                <div className="max-w-2xl space-y-5 md:space-y-6">
                  {/* Slide Subtitle Eyebrow */}
                  <span className="inline-block rounded-md border border-[#0D9488]/30 bg-[#0D9488]/15 px-3 py-1 text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase backdrop-blur-md">
                    {slide.subtitle}
                  </span>

                  {/* Slide Title */}
                  <h2 className="text-3xl leading-tight font-black tracking-tight md:text-5xl">
                    {slide.title}
                  </h2>

                  {/* Slide Description */}
                  <p className="max-w-xl text-xs leading-relaxed font-medium text-neutral-300 md:text-sm">
                    {slide.description}
                  </p>

                  {/* Call-to-action buttons (8px spacing grid padding) */}
                  <div className="flex items-center space-x-4 pt-3">
                    <button
                      onClick={() => {
                        const el = document.getElementById(slide.primaryCtaLink)
                        if (el) el.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="rounded-lg bg-white px-6 py-2.5 font-extrabold text-neutral-900 shadow-lg transition-all duration-200 hover:bg-neutral-100 focus:ring-2 focus:ring-white/50 focus:outline-none"
                    >
                      {slide.primaryCtaText}
                    </button>
                    {slide.secondaryCtaText && (
                      <button
                        onClick={() => {
                          const el = document.getElementById(slide.secondaryCtaLink || '')
                          if (el) el.scrollIntoView({ behavior: 'smooth' })
                        }}
                        className="rounded-lg border border-white/30 px-6 py-2.5 font-extrabold text-white transition-all duration-200 hover:bg-white/10 focus:ring-2 focus:ring-white/50 focus:outline-none"
                      >
                        {slide.secondaryCtaText}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Manual Previous/Next Controls */}
      {slides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute top-1/2 left-4 z-30 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white backdrop-blur-sm transition-all hover:bg-[#0A3C7D] focus:ring-2 focus:ring-white/50 focus:outline-none"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute top-1/2 right-4 z-30 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white backdrop-blur-sm transition-all hover:bg-[#0A3C7D] focus:ring-2 focus:ring-white/50 focus:outline-none"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Indicator dots */}
      {slides.length > 1 && (
        <div className="absolute right-0 bottom-6 left-0 z-30 flex justify-center space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'w-6 bg-[#0D9488]' : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
