'use client'

import { ChevronDown } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'

import { cn } from '@/utils/tailwind'

interface AccordionItem {
  id: string
  title: ReactNode
  content: ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
  defaultOpenId?: string
  className?: string
}

export function Accordion({ items, defaultOpenId, className }: AccordionProps) {
  const baseId = useId()
  const [openId, setOpenId] = useState<string | undefined>(defaultOpenId)

  return (
    <div
      className={cn(
        'divide-y divide-line overflow-hidden rounded-lg border border-line bg-card',
        className,
      )}
    >
      {items.map((item) => {
        const open = openId === item.id
        const buttonId = `${baseId}-${item.id}-button`
        const panelId = `${baseId}-${item.id}-panel`
        return (
          <div key={item.id}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? undefined : item.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-navy transition-colors hover:bg-paper sm:px-6"
              >
                <span>{item.title}</span>
                <ChevronDown
                  aria-hidden
                  className={cn(
                    'h-5 w-5 shrink-0 text-stone transition-transform duration-200 ease-out',
                    open && 'rotate-180',
                  )}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!open}
              className="px-5 pb-5 text-[15px] leading-relaxed text-ink/90 sm:px-6"
            >
              {item.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}
