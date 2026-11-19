import type { ReactNode } from 'react'

import { cn } from '@/utils/tailwind'

const widths = {
  narrow: 'max-w-2xl',
  prose: 'max-w-3xl',
  wide: 'max-w-6xl',
  full: 'max-w-none',
}

interface PageContainerProps {
  width?: keyof typeof widths
  className?: string
  children: ReactNode
}

export function PageContainer({
  width = 'narrow',
  className,
  children,
}: PageContainerProps) {
  return (
    <main
      className={cn(
        'mx-auto w-full px-4 pb-16 pt-8 sm:px-6 sm:pt-12',
        widths[width],
        className,
      )}
    >
      {children}
    </main>
  )
}

interface PageHeaderProps {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-sage">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[32px] font-semibold leading-[1.1] text-navy sm:text-[40px]">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-stone sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </header>
  )
}
