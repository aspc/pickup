import type { ReactNode } from 'react'

import { formatTime12Hour } from '@/utils/formatTime'
import { cn } from '@/utils/tailwind'
import { StatusBadge, type RideStatus } from './StatusBadge'

const CAMPUS_CODE = 'CLA'
const CAMPUS_NAME = 'Claremont'

// Formats a YYYY-MM-DD date as a local calendar date ("Sat, Dec 12").
// Parsing the parts avoids the UTC shift `new Date('2026-12-12')` causes.
export const formatRideDate = (value: string | null) => {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null
  if (!match) return value ?? ''
  const [, year, month, day] = match
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
  ).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

interface RideTicketProps {
  date: string | null
  time: string | null
  airport: string
  toAirport: boolean
  status: RideStatus
  statusLabel?: ReactNode
  timeLabel?: ReactNode
  stub?: ReactNode
  className?: string
  children?: ReactNode
}

export function RideTicket({
  date,
  time,
  airport,
  toAirport,
  status,
  statusLabel,
  timeLabel = 'Pickup',
  stub,
  className,
  children,
}: RideTicketProps) {
  const from = toAirport
    ? { code: CAMPUS_CODE, name: CAMPUS_NAME }
    : { code: airport, name: 'Airport' }
  const to = toAirport
    ? { code: airport, name: 'Airport' }
    : { code: CAMPUS_CODE, name: CAMPUS_NAME }
  const routeLabel = toAirport
    ? `${CAMPUS_NAME} to ${airport}`
    : `${airport} to ${CAMPUS_NAME}`

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-lg border border-line bg-card shadow-card',
        className,
      )}
    >
      <div className="px-5 pb-5 pt-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-stone">
            <span className="whitespace-nowrap">{formatRideDate(date)}</span>
            {time && (
              <span className="whitespace-nowrap">
                <span aria-hidden className="mx-1.5 text-line-strong">
                  ·
                </span>
                {timeLabel}{' '}
                <span className="font-semibold text-ink">
                  {formatTime12Hour(time)}
                </span>
              </span>
            )}
          </p>
          <StatusBadge status={status} label={statusLabel} />
        </div>

        <div
          aria-label={routeLabel}
          role="group"
          className="mt-4 flex items-end gap-3"
        >
          <div className="min-w-0">
            <p
              data-testid="ride-code"
              className="text-[28px] font-semibold leading-none tracking-wide text-navy"
            >
              {from.code}
            </p>
            <p className="mt-1.5 truncate text-[13px] text-stone">
              {from.name}
            </p>
          </div>
          <div
            aria-hidden
            className="relative mb-[26px] flex-1 border-t-2 border-dashed border-line-strong"
          >
            <span className="absolute -top-[5px] right-0 h-2 w-2 rounded-full bg-sage" />
          </div>
          <div className="min-w-0 text-right">
            <p
              data-testid="ride-code"
              className="text-[28px] font-semibold leading-none tracking-wide text-navy"
            >
              {to.code}
            </p>
            <p className="mt-1.5 truncate text-[13px] text-stone">{to.name}</p>
          </div>
        </div>

        {children && <div className="mt-5">{children}</div>}
      </div>

      {stub && (
        <div className="relative border-t-2 border-dashed border-line bg-paper/70 px-5 py-3 text-sm text-stone sm:px-6">
          {/* Perforation notches; set --ticket-notch to the surface behind the card */}
          <span
            aria-hidden
            className="absolute -left-2 -top-2 h-4 w-4 rounded-full border border-line bg-[var(--ticket-notch,theme(colors.paper))]"
          />
          <span
            aria-hidden
            className="absolute -right-2 -top-2 h-4 w-4 rounded-full border border-line bg-[var(--ticket-notch,theme(colors.paper))]"
          />
          {stub}
        </div>
      )}
    </article>
  )
}
