import type { ReactNode } from 'react'

import { cn } from '@/utils/tailwind'

export type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning' | 'info'

const tones: Record<BadgeTone, { badge: string; dot: string }> = {
  neutral: { badge: 'bg-sunken text-stone', dot: 'bg-stone-light' },
  success: { badge: 'bg-sage-tint text-sage-strong', dot: 'bg-sage' },
  danger: { badge: 'bg-danger-tint text-danger', dot: 'bg-danger' },
  warning: { badge: 'bg-warning-tint text-warning', dot: 'bg-warning' },
  info: { badge: 'bg-navy-50 text-navy', dot: 'bg-navy-400' },
}

interface BadgeProps {
  tone?: BadgeTone
  dot?: boolean
  className?: string
  children: ReactNode
}

export function Badge({
  tone = 'neutral',
  dot = false,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone].badge,
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden
          className={cn('h-1.5 w-1.5 rounded-full', tones[tone].dot)}
        />
      )}
      {children}
    </span>
  )
}

export type RideStatus =
  | 'matched'
  | 'ready'
  | 'waiting'
  | 'unmatched'
  | 'cancelled'
  | 'delayed'
  | 'past'

const statusTones: Record<RideStatus, BadgeTone> = {
  matched: 'success',
  ready: 'success',
  waiting: 'neutral',
  unmatched: 'neutral',
  past: 'neutral',
  cancelled: 'danger',
  delayed: 'warning',
}

const statusLabels: Record<RideStatus, string> = {
  matched: 'Matched',
  ready: 'Ready',
  waiting: 'Waiting',
  unmatched: 'Unmatched',
  past: 'Past',
  cancelled: 'Cancelled',
  delayed: 'Delayed',
}

export const rideStatusTone = (status: RideStatus): BadgeTone =>
  statusTones[status]

interface StatusBadgeProps {
  status: RideStatus
  label?: ReactNode
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <Badge tone={rideStatusTone(status)} dot className={className}>
      {label ?? statusLabels[status]}
    </Badge>
  )
}
