import type { ComponentProps, ElementType, ReactNode } from 'react'

import { cn } from '@/utils/tailwind'

type CardProps = ComponentProps<'div'> & {
  as?: ElementType
  padded?: boolean
}

export function Card({
  as: Component = 'div',
  padded = false,
  className,
  ...props
}: CardProps) {
  return (
    <Component
      className={cn(
        'rounded-lg border border-line bg-card shadow-card',
        padded && 'p-5 sm:p-6',
        className,
      )}
      {...props}
    />
  )
}

interface CardHeaderProps {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-navy">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-stone">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardBody({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('px-5 py-5 sm:px-6', className)} {...props} />
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-4 sm:px-6',
        className,
      )}
      {...props}
    />
  )
}
