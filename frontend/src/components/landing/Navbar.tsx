import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X, ChevronDown, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/routes/paths'

interface NavLinkItem {
  label: string
  sectionId: string
}

const NAV_LINKS: NavLinkItem[] = [
  { label: 'Home', sectionId: 'home' },
  { label: 'About', sectionId: 'about' },
  { label: 'How It Works', sectionId: 'how-it-works' },
  { label: 'Statistics', sectionId: 'statistics' },
  { label: 'State Dashboard', sectionId: 'state-dashboard' },
  { label: 'Contact', sectionId: 'contact' },
  { label: 'Sitemap', sectionId: 'sitemap' },
]

export function Navbar() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)

  // Track scroll position for header stickiness & styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)

      // Active section highlighting
      const scrollPosition = window.scrollY + 140
      for (const link of NAV_LINKS) {
        const el = document.getElementById(link.sectionId)
        if (el) {
          const top = el.offsetTop
          const height = el.offsetHeight
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(link.sectionId)
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (sectionId: string) => {
    setActiveSection(sectionId)
    setMobileMenuOpen(false) // Auto-close mobile drawer

    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'border-b border-neutral-200 bg-white/95 py-1.5 shadow-md backdrop-blur-md'
          : 'border-b border-neutral-100 bg-white py-3'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Navbar Brand Logo */}
        <div
          className="group flex cursor-pointer items-center space-x-4"
          onClick={() => handleNavClick('home')}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#0A3C7D] text-lg font-black text-white shadow-sm transition-colors duration-250 group-hover:bg-[#0D9488]">
            C
          </div>
          <span className="text-lg font-black tracking-tight text-neutral-800 transition-colors duration-250 group-hover:text-[#0A3C7D]">
            CSCRS
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center space-x-6 md:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.sectionId}
              onClick={() => handleNavClick(link.sectionId)}
              className={`relative py-1 text-sm font-bold transition-all duration-200 focus:text-[#0A3C7D] focus:outline-none ${
                activeSection === link.sectionId
                  ? 'text-[#0A3C7D]'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {link.label}
              {activeSection === link.sectionId && (
                <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-[#0D9488]" />
              )}
            </button>
          ))}
        </div>

        {/* Right Side Options: Lang & Login */}
        <div className="hidden items-center space-x-4 md:flex">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center space-x-1 rounded-lg px-2.5 py-1.5 text-sm font-extrabold text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
            >
              <Globe className="text-neutral-450 h-4 w-4" />
              <span>EN</span>
              <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 z-50 mt-1 w-24 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                <button
                  onClick={() => setLangMenuOpen(false)}
                  className="w-full px-3 py-1.5 text-left text-xs font-bold text-neutral-800 hover:bg-neutral-50"
                >
                  English
                </button>
                <button
                  onClick={() => setLangMenuOpen(false)}
                  className="w-full px-3 py-1.5 text-left text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                >
                  हिन्दी
                </button>
              </div>
            )}
          </div>

          <Button
            onClick={() => navigate(PATHS.LOGIN)}
            size="default"
            variant="default"
            className="rounded-sm bg-[#0A3C7D] px-5 text-sm font-bold tracking-tight text-white shadow-sm transition-all duration-200 hover:bg-[#0A3C7D]/90"
          >
            Login
          </Button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center space-x-3 md:hidden">
          <Button
            onClick={() => navigate(PATHS.LOGIN)}
            size="sm"
            variant="default"
            className="bg-[#0A3C7D] px-3 text-xs font-bold tracking-tight"
          >
            Login
          </Button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-neutral-600 hover:text-neutral-900 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Menu overlay) */}
      {mobileMenuOpen && (
        <div className="absolute top-full right-0 left-0 z-50 border-b border-neutral-200 bg-white shadow-xl md:hidden">
          <div className="flex flex-col space-y-2 px-4 pt-2 pb-6">
            {NAV_LINKS.map((link) => (
              <button
                key={link.sectionId}
                onClick={() => handleNavClick(link.sectionId)}
                className={`rounded-lg px-3 py-2.5 text-left text-sm font-bold transition-all ${
                  activeSection === link.sectionId
                    ? 'bg-neutral-100 text-[#0A3C7D]'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="bg-neutral-150 my-2 h-px" />
            <div className="flex items-center justify-between px-3 pt-2">
              <span className="text-neutral-450 text-sm font-bold uppercase">Select Language</span>
              <div className="flex space-x-2">
                <button className="rounded bg-neutral-100 px-2.5 py-1 text-sm font-bold text-neutral-800 hover:bg-neutral-200">
                  English
                </button>
                <button className="rounded bg-neutral-50 px-2.5 py-1 text-sm text-neutral-600 hover:bg-neutral-200">
                  हिन्दी
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
