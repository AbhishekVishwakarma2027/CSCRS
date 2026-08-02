import { useState } from 'react'
import { Map, Accessibility, Contrast, Languages } from 'lucide-react'

export function AccessibilityBar() {
  const [lang, setLang] = useState<'EN' | 'HI'>('EN')

  return (
    <div className="border-b border-neutral-800 bg-slate-950 text-[13px] text-neutral-300">
      <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Skip to Main Content Link (visible on focus/tab) */}
        <a
          href="#main-content"
          className="focus:bg-primary focus:text-primary-foreground absolute top-[-9999px] left-[-9999px] transition-all focus:static focus:z-50 focus:rounded-sm focus:px-4 focus:py-1"
        >
          Skip to Main Content
        </a>

        {/* Left Utility Links + Accessibility */}
        <div className="flex items-center gap-5">
          <a
            href="#main-content"
            className="hidden items-center gap-1 transition-colors hover:text-emerald-300 md:flex"
          >
            <Accessibility className="h-3 w-3" />
            <span>Skip to Main Content</span>
          </a>

          <a
            href="#sitemap"
            className="hidden items-center gap-1 transition-colors hover:text-emerald-300 md:flex"
          >
            <Map className="h-3 w-3" />
            <span>Sitemap</span>
          </a>

          <div className="hidden h-4 w-px bg-neutral-700 md:block" />

          <div className="flex items-center gap-2">
            <button
              className="transition-colors hover:text-emerald-300"
              aria-label="Decrease text size"
            >
              A-
            </button>

            <button
              className="transition-colors hover:text-emerald-300"
              aria-label="Default text size"
            >
              A
            </button>

            <button
              className="font-bold text-white transition-colors hover:text-emerald-300"
              aria-label="Increase text size"
            >
              A+
            </button>
          </div>

          <div className="h-4 w-px bg-neutral-700" />

          <button
            className="hidden items-center gap-1 transition-colors hover:text-emerald-300 md:flex"
            aria-label="High Contrast"
          >
            <Contrast className="h-3 w-3" />
            <span>Contrast</span>
          </button>
          <div className="flex items-center space-x-2">
            <button
              className="h-4 w-4 rounded-full border border-neutral-600 bg-white"
              aria-label="Light theme contrast"
            />
            <button
              className="h-4 w-4 rounded-full border border-neutral-600 bg-black"
              aria-label="Dark theme contrast"
            />
          </div>
        </div>

        {/* Language Selection & Links */}
        <div className="flex items-center gap-5">
          <button
            onClick={() => setLang(lang === 'EN' ? 'HI' : 'EN')}
            className="flex items-center gap-1 transition-colors hover:text-emerald-300"
            aria-label="Change Language"
          >
            <>
              <Languages className="h-3 w-3" />
              <span>{lang === 'EN' ? 'English' : 'हिन्दी'}</span>
            </>
          </button>
          <div className="h-4 w-px bg-neutral-700" />
          <button className="hidden transition-colors hover:text-emerald-300 md:block">
            Screen Reader Access
          </button>
        </div>
      </div>
    </div>
  )
}
