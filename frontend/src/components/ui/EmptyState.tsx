import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/utils/tailwind'

interface EmptyStateProps {
  icon?: LucideIcon
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-lg border border-dashed border-line-strong bg-card/60 px-6 py-12 text-center',
        className,
      )}
    >
      {Icon && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage-tint text-sage">
          <Icon aria-hidden className="h-6 w-6" />
        </span>
      )}
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      {description && (
        <p className="mt-1.5 max-w-sm text-[15px] leading-relaxed text-stone">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
