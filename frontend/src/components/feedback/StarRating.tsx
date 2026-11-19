'use client'

import { Star } from 'lucide-react'
import { useRef, useState, type KeyboardEvent } from 'react'

import { cn } from '@/utils/tailwind'

const STARS = [1, 2, 3, 4, 5]

export default function StarRating({
  rating,
  onChange,
  label,
}: {
  rating: number
  onChange: (newRating: number) => void
  label?: string
}) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([])

  // Arrow keys move the selection, like a native radio group.
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowUp'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
          ? -1
          : 0
    if (!step) return
    event.preventDefault()
    const next = Math.min(5, Math.max(1, (rating || 0) + step))
    onChange(next)
    buttonsRef.current[next - 1]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex items-center gap-1"
      onMouseLeave={() => setHoveredStar(null)}
    >
      {STARS.map((star) => {
        const isActive =
          hoveredStar !== null ? star <= hoveredStar : star <= rating
        const isFocusable = rating ? star === rating : star === 1
        return (
          <button
            key={star}
            ref={(el) => {
              buttonsRef.current[star - 1] = el
            }}
            type="button"
            role="radio"
            aria-checked={star === rating}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            tabIndex={isFocusable ? 0 : -1}
            onClick={() => onChange(star)}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setHoveredStar(star)}
            className="rounded-md p-1 transition-transform duration-150 active:scale-90"
          >
            <Star
              aria-hidden
              className={cn(
                'h-7 w-7 transition-colors duration-150',
                isActive
                  ? 'fill-navy text-navy'
                  : 'fill-transparent text-line-strong',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
