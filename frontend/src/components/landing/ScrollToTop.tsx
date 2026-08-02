import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 300) {
            setVisible(true)
          } else {
            setVisible(false)
          }
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  if (!visible) return null

  return (
    <button
      onClick={scrollToTop}
      className="bg-primary text-primary-foreground hover:bg-primary/95 focus:ring-primary/50 fixed right-6 bottom-6 z-40 rounded-full p-3 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 focus:ring-2 focus:outline-none"
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  )
}
