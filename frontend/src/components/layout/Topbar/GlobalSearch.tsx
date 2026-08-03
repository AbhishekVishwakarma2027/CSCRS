import { useEffect } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

export function GlobalSearch() {
  // Listen for Cmd+K or Ctrl+K shortcut keybinds
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        toast.info('Command search index querying will be integrated in a later phase.')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="relative w-72 transition-all duration-200 md:w-[450px]">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
        <Search className="h-4 w-4" />
      </span>
      <input
        type="text"
        disabled
        placeholder="Search reports, workers or departments... (⌘K)"
        className="border-neutral-250 w-full cursor-not-allowed rounded-lg border bg-neutral-50/50 py-1.5 pr-12 pl-9 text-[13px] text-neutral-400 placeholder-neutral-400 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800/20"
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <kbd className="text-neutral-450 border-neutral-250 hidden items-center gap-0.5 rounded border bg-neutral-100 px-1.5 py-0.5 text-[11px] font-black select-none sm:inline-flex dark:border-neutral-700 dark:bg-neutral-800">
          ⌘K
        </kbd>
      </div>
    </div>
  )
}
export default GlobalSearch
