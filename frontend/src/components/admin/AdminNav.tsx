'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/utils/tailwind'

const TABS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/groups', label: 'Groups' },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <div className="border-b border-line bg-card">
      <nav
        aria-label="Admin"
        className="mx-auto flex max-w-7xl items-center gap-6 px-4 sm:px-6"
      >
        <span className="mr-2 text-xs font-semibold uppercase tracking-[0.12em] text-sage">
          Admin
        </span>
        {TABS.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative inline-flex h-12 items-center text-sm font-medium transition-colors',
                active ? 'text-navy' : 'text-stone hover:text-navy',
                active &&
                  'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-navy',
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
