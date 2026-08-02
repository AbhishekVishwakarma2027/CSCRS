import React, { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConfirmationDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  isDanger?: boolean
  isSubmitting?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  isSubmitting = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // ESC key to close
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  // Focus trap
  useEffect(() => {
    if (!isOpen) return
    const modalEl = modalRef.current
    if (!modalEl) return

    const focusableEls = modalEl.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusableEls.length === 0) return

    const firstEl = focusableEls[0] as HTMLElement
    const lastEl = focusableEls[focusableEls.length - 1] as HTMLElement

    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          lastEl.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastEl) {
          firstEl.focus()
          e.preventDefault()
        }
      }
    }

    firstEl.focus()
    window.addEventListener('keydown', handleTab)
    return () => window.removeEventListener('keydown', handleTab)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 duration-200 dark:bg-black/80">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="dark:text-neutral-350 w-full max-w-sm space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 text-xs font-bold text-neutral-700 shadow-2xl dark:border-neutral-800 dark:bg-[#1C1C1E]"
      >
        <div className="dark:border-neutral-850 flex items-center justify-between border-b border-neutral-100 pb-2">
          <h3
            id="confirm-dialog-title"
            className={`flex items-center gap-1.5 text-sm font-black tracking-wider uppercase ${
              isDanger ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
            {title}
          </h3>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="text-neutral-450 cursor-pointer rounded-md outline-none hover:text-neutral-700 disabled:opacity-50 dark:hover:text-neutral-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="leading-relaxed font-semibold text-neutral-500 dark:text-neutral-400">
          {description}
        </p>

        <div className="dark:border-neutral-850 flex items-center justify-end gap-2 border-t border-neutral-100 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onCancel}
            className="h-8 cursor-pointer text-neutral-600 dark:border-neutral-800 dark:text-neutral-400"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className={`h-8 cursor-pointer text-white ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800/50'
                : 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/50'
            }`}
          >
            {isSubmitting ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
