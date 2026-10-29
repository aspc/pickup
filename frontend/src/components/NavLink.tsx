'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'

import { cn } from '@/utils/tailwind'

const variants = {
  header: cn(
    'relative inline-flex h-16 items-center px-1 text-sm font-medium text-navy-200 transition-colors duration-150 hover:text-white',
    'after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full after:bg-sage-soft after:opacity-0 after:transition-opacity',
    'aria-[current=page]:text-white aria-[current=page]:after:opacity-100',
  ),
  mobile: cn(
    'flex min-h-12 items-center justify-between rounded-md px-3 text-lg font-medium text-navy transition-colors hover:bg-sunken',
    'aria-[current=page]:bg-sage-tint aria-[current=page]:text-sage-strong',
  ),
  footer:
    'text-sm text-stone underline-offset-4 transition-colors hover:text-navy hover:underline',
}

interface NavLinkProps {
  href: string
  variant: keyof typeof variants
  onNavigate?: () => void
  className?: string
  children: ReactNode
}

export function NavLink({
  href,
  variant,
  onNavigate,
  className,
  children,
}: NavLinkProps) {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  useEffect(() => {
    setIsNavigating(false)
  }, [pathname])

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Re-clicking the page you are on should not trigger a reload.
    if (pathname === href) {
      event.preventDefault()
      return
    }
    setIsNavigating(true)
    onNavigate?.()
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-current={isActive ? 'page' : undefined}
      aria-busy={isNavigating || undefined}
      className={cn(variants[variant], isNavigating && 'opacity-70', className)}
    >
      {children}
    </Link>
  )
}
