import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/utils/tailwind'

const tones = {
  info: {
    box: 'border-navy-100 bg-navy-50',
    icon: 'text-navy-500',
    Icon: Info,
  },
  success: {
    box: 'border-sage/25 bg-sage-tint',
    icon: 'text-sage',
    Icon: CheckCircle2,
  },
  warning: {
    box: 'border-warning/20 bg-warning-tint',
    icon: 'text-warning',
    Icon: AlertTriangle,
  },
  danger: {
    box: 'border-danger/20 bg-danger-tint',
    icon: 'text-danger',
    Icon: XCircle,
  },
}

interface AlertProps {
  tone?: keyof typeof tones
  title?: ReactNode
  action?: ReactNode
  className?: string
  children?: ReactNode
}

export function Alert({
  tone = 'info',
  title,
  action,
  className,
  children,
}: AlertProps) {
  const { box, icon, Icon } = tones[tone]
  const urgent = tone === 'danger' || tone === 'warning'

  return (
    <div
      role={urgent ? 'alert' : 'status'}
      className={cn(
        'flex gap-3 rounded-md border px-4 py-3 text-sm text-ink',
        box,
        className,
      )}
    >
      <Icon
        aria-hidden
        className={cn('mt-0.5 h-[18px] w-[18px] shrink-0', icon)}
      />
      <div className="min-w-0 flex-1 space-y-1 leading-relaxed">
        {title && <p className="font-semibold text-navy">{title}</p>}
        {children && <div className="text-ink/90">{children}</div>}
        {action && <div className="pt-1">{action}</div>}
      </div>
    </div>
  )
}
