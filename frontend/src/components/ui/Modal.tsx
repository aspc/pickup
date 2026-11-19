'use client'

import { X } from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/utils/tailwind'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const sizes = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  footer?: ReactNode
  size?: keyof typeof sizes
  /** When false, only an explicit action inside the dialog can close it. */
  dismissible?: boolean
  className?: string
  children?: ReactNode
}

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  size = 'md',
  dismissible = true,
  className,
  children,
}: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const firstFocusable = dialog?.querySelector<HTMLElement>(FOCUSABLE)
    ;(firstFocusable ?? dialog)?.focus()

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflow
      previouslyFocused?.focus()
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      if (dismissible) onCloseRef.current()
      return
    }
    if (event.key !== 'Tab' || !dialogRef.current) return

    // Keep keyboard focus inside the dialog.
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onKeyDown={handleKeyDown}
    >
      <div
        aria-hidden
        className="absolute inset-0 animate-overlay-in bg-navy-900/40"
        onClick={() => dismissible && onCloseRef.current()}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[calc(100dvh-2rem)] w-full animate-dialog-in flex-col overflow-hidden rounded-lg bg-card shadow-overlay outline-none',
          sizes[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-5 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-navy">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-stone">
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <button
              type="button"
              aria-label="Close"
              onClick={() => onCloseRef.current()}
              className="-mr-2 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-stone transition-colors hover:bg-sunken hover:text-navy"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="overflow-y-auto px-5 pb-5 pt-2 text-[15px] text-ink sm:px-6">
          {children}
        </div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line bg-paper/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
