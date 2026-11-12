import type { ComponentProps, ElementType } from 'react'

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
