'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ResultMatchDto } from '@/contracts/readModels'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import { createBrowserClient } from '@/utils/supabase'
import {
  CalendarPlus,
  ChevronRight,
  Clock,
  MapPin,
  UserCheck,
  Ticket,
} from 'lucide-react'

import { Button, ButtonLink } from '@/components/ui/Button'
import { RideTicket } from '@/components/ui/RideTicket'
import { Badge } from '@/components/ui/StatusBadge'
import ConfirmCancelMatch from './ConfirmCancelMatch'

interface MatchCardProps {
  matches: ResultMatchDto[]
  upcoming: boolean
  onDelete?: (rideId: number) => Promise<void>
  rideId?: number
  isGroupReady?: boolean
}

const getAirportAddress = (airport: string | null): string => {
  if (!airport) return ''
  const airports: Record<string, string> = {
    LAX: 'World Way, Los Angeles, CA 90045',
    SNA: '18601 Airport Way, Santa Ana, CA 92707',
  }
  return airports[airport] || ''
}

// Helper function to generate an ICS file for match date/time
const createICSFile = (
  eventTitle: string,
  description: string,
  startDate: Date,
  startTime: string,
) => {
  const pad = (num: number) => String(num).padStart(2, '0')

  const formatDateTime = (date: Date) => {
    return (
      date.getUTCFullYear().toString() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      'T' +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) +
      'Z'
    )
  }

  // Create start date/time
  const [hours, minutes] = startTime.split(':').map(Number)
  const startDateTime = new Date(startDate)
  startDateTime.setHours(hours, minutes, 0, 0)
  const start = formatDateTime(startDateTime)

  // Create end date/time (1 hour later)
  const endDateTime = new Date(startDateTime)
  endDateTime.setHours(hours + 1, minutes, 0, 0)
  const end = formatDateTime(endDateTime)

  const content = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:${eventTitle}
DESCRIPTION:${description}
URL:https://p-ickup.com/results
DTSTART:${start}
DTEND:${end}
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Reminder: Your PICKUP Match is tomorrow!
END:VALARM
END:VEVENT
END:VCALENDAR`

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${eventTitle.replace(/\s+/g, '_')}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

const MatchCard = ({
  matches,
  upcoming,
  onDelete,
  rideId,
  isGroupReady,
}: MatchCardProps) => {
  const { user } = useAuth()
  /** Prefer the logged-in user's row for date/voucher; fallback for edge cases */
  const primaryMatch = matches.find((m) => m.user_id === user?.id) ?? matches[0]
  /** Alias for fields shared with merged main-branch UI (Connect / voucher checks) */
  const firstMatch = primaryMatch
  const otherRiders = user ? matches.filter((m) => m.user_id !== user.id) : []
  const isSolo = otherRiders.length === 0
  const voucherStr = (primaryMatch.voucher ?? '').trim()
  const contingencyStr = (primaryMatch.contingency_voucher ?? '').trim()
  const hasUberVoucher = voucherStr.length > 0
  const hasContingencyVoucher = contingencyStr.length > 0
  /**
   * Contingency is meant for post-delay solo rides (your own group). Do not show
   * or require pickup for it while other riders are on the same ride.
   */
  const contingencyAppliesHere = isSolo && hasContingencyVoucher
  /** Reveal contingency URL on Results only after ASPC “confirm ready” (group ready). */
  const showContingencyBlock =
    contingencyAppliesHere && contingencyStr !== voucherStr && isGroupReady
  const hasAnyVoucher = hasUberVoucher || contingencyAppliesHere
  /** Uber always; contingency only when solo */
  const needsPickupConfirmation =
    hasAnyVoucher && rideId && upcoming && !isGroupReady
  const supabase = createBrowserClient()
  const [isDeleting, setIsDeleting] = useState(false)
  const [urlCache, setUrlCache] = useState<Record<string, string>>({})

  const getProfileUrl = (photoPath: string | null) => {
    if (!photoPath) return '/images/profileIcon.webp'
    if (photoPath.startsWith('/images')) return photoPath
    if (/^https?:\/\//i.test(photoPath)) return photoPath

    // Check cache first
    if (urlCache[photoPath]) {
      return urlCache[photoPath]
    }

    // Generate URL and cache it
    const { data } = supabase.storage
      .from('profile_picture')
      .getPublicUrl(photoPath)

    const publicUrl = data?.publicUrl || '/images/profileIcon.webp'
    setUrlCache((prev: Record<string, string>) => ({
      ...prev,
      [photoPath]: publicUrl,
    }))
    return publicUrl
  }

  const [showCancelModal, setShowCancelModal] = useState(false)

  const handleCancelClick = () => {
    setShowCancelModal(true)
  }

  const handleConfirmCancel = async () => {
    if (!onDelete || isDeleting) return
    try {
      setIsDeleting(true)
      await onDelete(primaryMatch.ride_id)
      setShowCancelModal(false)
    } catch (error) {
      console.error('Error deleting match:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Use voucher existence (not is_subsidized). Connect rides never have vouchers, so exclude them.
  const hasVoucher =
    Boolean(firstMatch.voucher?.trim()) &&
    firstMatch.uber_type?.toLowerCase() !== 'connect'

  const isConnect = firstMatch.uber_type?.toLowerCase() === 'connect'

  const handleReminderClick = () => {
    if (!primaryMatch.date || !primaryMatch.time) return

    // Parse date manually to avoid timezone issues
    const [year, month, day] = primaryMatch.date.split('-').map(Number)
    const matchDate = new Date(year, month - 1, day)
    const matchTime = primaryMatch.time
    const flightData = primaryMatch.Flights

    const title = `PICKUP Group: ${flightData?.to_airport ? 'School → ' + flightData.airport : flightData.airport + ' → School'}`

    createICSFile(title, 'Your PICKUP ride share match!', matchDate, matchTime)
  }

  const status = !upcoming ? 'past' : isGroupReady ? 'ready' : 'matched'
  const airportAddress = getAirportAddress(primaryMatch.Flights.airport)
  const linkClass =
    'break-all font-medium text-navy underline underline-offset-2 hover:text-sage'

  return (
    <RideTicket
      date={primaryMatch.date}
      time={primaryMatch.time}
      airport={primaryMatch.Flights.airport}
      toAirport={primaryMatch.Flights.to_airport}
      status={status}
      statusLabel={status === 'ready' ? 'Group ready' : undefined}
      stub={
        upcoming ? (
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            {rideId && !primaryMatch.Flights?.to_airport && (
              <ButtonLink
                href={`/aspc-delay/${rideId}`}
                variant="secondary"
                size="sm"
              >
                <Clock aria-hidden className="h-4 w-4 text-warning" />
                Report a delay
              </ButtonLink>
            )}
            <Button variant="secondary" size="sm" onClick={handleReminderClick}>
              <CalendarPlus aria-hidden className="h-4 w-4" />
              Set a reminder
            </Button>
            <Button
              variant="danger-ghost"
              size="sm"
              onClick={handleCancelClick}
              loading={isDeleting}
              className="col-span-2 sm:ml-auto"
            >
              {isDeleting ? 'Processing...' : 'Cancel match'}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-5">
        <div>
          <p className="text-lg font-semibold leading-snug text-navy">
            {isConnect
              ? `You are matched with ${otherRiders.length} ${otherRiders.length === 1 ? 'person' : 'people'}`
              : otherRiders.length === 0
                ? "You're the only rider in this group right now."
                : otherRiders.length === 1
                  ? `You are matched with ${otherRiders[0].Users.firstname}`
                  : `You are matched with ${otherRiders.length} people`}
          </p>
          {airportAddress && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-stone">
              <MapPin aria-hidden className="h-4 w-4 shrink-0" />
              {airportAddress}
            </p>
          )}
          {isConnect && (
            <Badge tone="info" className="mt-2">
              Subsidized Connect shuttle - no Uber needed
            </Badge>
          )}
        </div>

        {otherRiders.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-stone">
              {isConnect ? 'Other riders' : 'Other riders contact information'}
            </p>
            <ul className="divide-y divide-line rounded-md border border-line">
              {otherRiders.map((match) => (
                <li
                  key={match.Users.user_id}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  {!isConnect &&
                    (match.Users.photo_url ? (
                      <Image
                        src={getProfileUrl(match.Users.photo_url)}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-50 text-sm font-semibold text-navy"
                      >
                        {(match.Users.firstname?.[0] ?? '') +
                          (match.Users.lastname?.[0] ?? '')}
                      </span>
                    ))}
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium text-ink">
                      {match.Users.firstname} {match.Users.lastname}
                    </p>
                    {!isConnect && (
                      <>
                        <p className="break-all text-stone">
                          {match.Users.email ? (
                            <a
                              href={`mailto:${match.Users.email}`}
                              className="hover:text-navy hover:underline"
                            >
                              {match.Users.email}
                            </a>
                          ) : (
                            'No email provided'
                          )}
                        </p>
                        <p className="text-stone">
                          {match.Users.phonenumber ? (
                            <a
                              href={`tel:${match.Users.phonenumber}`}
                              className="hover:text-navy hover:underline"
                            >
                              {match.Users.phonenumber}
                            </a>
                          ) : (
                            'No phone provided'
                          )}
                        </p>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasVoucher && isGroupReady ? (
          <div className="flex items-start gap-2 rounded-md bg-sage-tint px-3 py-2.5 text-sm">
            <Ticket aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
            <p className="min-w-0 font-medium text-ink">
              Uber voucher:{' '}
              {voucherStr.startsWith('https') ? (
                <a
                  href={voucherStr}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  {voucherStr}
                </a>
              ) : (
                voucherStr
              )}
            </p>
          </div>
        ) : needsPickupConfirmation ? (
          <Link
            href={`/aspc-ready?ride_id=${rideId}`}
            className="group flex items-center gap-3 rounded-md border border-sage/30 bg-sage-tint p-3 transition-colors hover:border-sage/60"
          >
            <UserCheck aria-hidden className="h-5 w-5 shrink-0 text-sage" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-navy">
                {isSolo
                  ? hasUberVoucher
                    ? 'Confirm you are ready for pickup to unlock your voucher'
                    : 'Confirm you are ready for pickup to use your contingency voucher'
                  : hasUberVoucher
                    ? 'Confirm your group is ready to unlock your voucher'
                    : 'Confirm your group is ready before using contingency vouchers'}
              </p>
              <p className="mt-0.5 text-[13px] text-ink/80">
                {isSolo
                  ? 'Confirm you are at the pickup location. After everyone is accounted for, your voucher details stay available on this page.'
                  : 'Everyone in your group must confirm they are at the pickup location'}
              </p>
            </div>
            <ChevronRight
              aria-hidden
              className="h-5 w-5 shrink-0 text-sage transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        ) : null}

        {showContingencyBlock ? (
          <div className="flex items-start gap-2 rounded-md bg-warning-tint px-3 py-2.5 text-sm">
            <Ticket
              aria-hidden
              className="mt-0.5 h-4 w-4 shrink-0 text-warning"
            />
            <p className="min-w-0 font-medium text-ink">
              Contingency voucher:{' '}
              {contingencyStr.startsWith('https') ? (
                <a
                  href={contingencyStr}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  {contingencyStr}
                </a>
              ) : (
                contingencyStr
              )}
            </p>
          </div>
        ) : null}

        {!hasAnyVoucher ? (
          <p className="text-sm text-stone">
            You do not have a voucher available for your group.
          </p>
        ) : isSolo ? (
          <p className="text-sm font-medium text-sage-strong">
            {isGroupReady
              ? 'You have a voucher!'
              : 'You have a voucher! Please confirm you are ready to unlock it!'}
          </p>
        ) : null}
      </div>

      {upcoming && (
        <ConfirmCancelMatch
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleConfirmCancel}
          isDeleting={isDeleting}
        />
      )}
    </RideTicket>
  )
}

export default MatchCard
