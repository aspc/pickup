'use client'

import { Suspense } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { postJson, requestJson } from '@/utils/api'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ButtonLink } from '@/components/ui/Button'
import { formatRideDate } from '@/components/ui/RideTicket'
import { formatTime12Hour } from '@/utils/formatTime'
import { isGroupReady } from '@/utils/groupReadiness'

type MatchRow = {
  ride_id: number
  user_id: string
  date: string | null
  time: string | null
  ready_for_pickup_at: string | null
  ready_for_pickup_status: 'ready' | 'reporting_missing' | null
  reported_missing_user_ids: string[] | null
  group_ready_at: string | null
  uber_type: string | null
  voucher: string | null
  contingency_voucher: string | null
  Flights: {
    airport: string
    to_airport: boolean
    date: string
  } | null
  Users: {
    user_id: string
    firstname: string
  } | null
}

const getPickupLocation = (airport: string, toAirport: boolean): string => {
  if (toAirport) {
    return '647 N College Way (outside Lincoln Hall)'
  }
  if (airport === 'LAX') {
    return 'Take the LAX-it shuttle to rideshare area'
  }
  if (airport === 'ONT') {
    return 'At ONT: Group picks a curbside terminal meeting point. Use the inter-terminal bus between T2 and T4 if needed.'
  }
  return `${airport}'s rideshare location`
}

function countConfirmed(matches: MatchRow[]): number {
  return matches.filter((m) => m.ready_for_pickup_at).length
}

function AspcReadyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const rideIdParam = searchParams.get('ride_id')
  const rideId = rideIdParam ? parseInt(rideIdParam, 10) : null

  const { user, isAuthenticated, signInWithGoogle } = useAuth()

  const [matches, setMatches] = useState<MatchRow[]>([])
  const [userRides, setUserRides] = useState<
    { ride_id: number; label: string }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [atPickupLocation, setAtPickupLocation] = useState(false)
  const [ackVehicleSize, setAckVehicleSize] = useState(false)
  const [ackWaitForGroup, setAckWaitForGroup] = useState(false)
  const [everyoneReady, setEveryoneReady] = useState(true)
  const [missingUserIds, setMissingUserIds] = useState<string[]>([])

  const fetchRideData = useCallback(async () => {
    if (!user) return

    try {
      const result = await requestJson<{
        success: boolean
        matches: MatchRow[]
        userRides: { ride_id: number; label: string }[]
      }>(rideId ? `/api/aspc-ready?rideId=${rideId}` : '/api/aspc-ready')

      setMatches((result.matches || []) as MatchRow[])
      setUserRides(result.userRides || [])
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to load ride data.',
      )
      setMatches([])
      setUserRides([])
    }
  }, [user, rideId])

  useEffect(() => {
    if (user) {
      setLoading(true)
      setError('')
      void fetchRideData().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user, fetchRideData])

  const firstMatch = matches[0]
  const groupReady = firstMatch?.group_ready_at != null
  const everyoneAccountedFor = isGroupReady(matches)
  const confirmedCount = countConfirmed(matches)
  const totalCount = matches.length
  const otherMembers = matches.filter((m) => m.user_id !== user?.id)
  const rideVoucher =
    matches.find((m) => m.voucher)?.voucher ?? firstMatch?.voucher ?? null
  const rideContingencyRaw =
    matches.find((m) => (m.contingency_voucher ?? '').trim())
      ?.contingency_voucher ??
    firstMatch?.contingency_voucher ??
    null
  const rideContingency =
    rideContingencyRaw && rideContingencyRaw.trim() !== ''
      ? rideContingencyRaw.trim()
      : null
  const contingencyDiffersFromUber =
    rideContingency &&
    rideVoucher &&
    rideContingency.trim() !== (rideVoucher ?? '').trim()
  const pickupLocation = firstMatch?.Flights
    ? getPickupLocation(
        firstMatch.Flights.airport,
        firstMatch.Flights.to_airport,
      )
    : ''
  const uberType = firstMatch?.uber_type || 'Uber'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !rideId) return

    if (!atPickupLocation || !ackVehicleSize || !ackWaitForGroup) {
      setError('Please confirm all items above before submitting.')
      return
    }

    if (!everyoneReady && missingUserIds.length === 0) {
      setError('Please select who is missing.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const result = await postJson<{ success: boolean; nowReady: boolean }>(
        '/api/aspc-ready/report',
        {
          rideId,
          everyoneReady,
          missingUserIds,
        },
      )

      setSuccess('Your response was saved.')
      setSubmitting(false)

      if (result.nowReady) {
        setSuccess(
          'Your group is ready! Your voucher is now available on the results page.',
        )
        router.refresh()
        setTimeout(() => router.push('/results'), 2000)
      } else {
        router.refresh()
        void fetchRideData()
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to save your response.',
      )
      setSubmitting(false)
    }
  }

  const toggleMissing = (userId: string) => {
    setMissingUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="relative">
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
          <div className="mx-auto max-w-md rounded-lg border border-line bg-card p-8 text-center shadow-card">
            <h1 className="mb-4 font-display text-3xl font-semibold text-navy">
              ASPC Ready for Pickup
            </h1>
            <p className="mb-6 text-stone">
              Sign in to confirm your group is ready for pickup.
            </p>
            <button
              onClick={() => void signInWithGoogle()}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-navy px-4 text-[15px] font-medium text-white transition-[background-color,transform] duration-150 hover:bg-navy-700 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-sage border-r-transparent" />
      </div>
    )
  }

  if (!rideId && userRides.length > 0) {
    return (
      <div className="relative">
        <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:pt-12">
          <h1 className="mb-6 font-display text-[32px] font-semibold leading-tight text-navy sm:text-[40px]">
            Ready for Pickup
          </h1>
          <p className="mb-6 text-stone">
            Select a ride to confirm your group is ready:
          </p>
          <div className="space-y-3">
            {userRides.map((r) => (
              <a
                key={r.ride_id}
                href={`/aspc-ready?ride_id=${r.ride_id}`}
                className="block min-h-[48px] rounded-lg border border-line bg-card p-4 shadow-card transition-colors hover:border-navy-300"
              >
                {r.label}
              </a>
            ))}
          </div>
          <div className="mt-8">
            <ButtonLink href="/results" variant="secondary">
              Back to Results
            </ButtonLink>
          </div>
        </div>
      </div>
    )
  }

  if (!rideId && userRides.length === 0) {
    return (
      <div className="relative">
        <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:pt-12">
          <h1 className="mb-6 font-display text-[32px] font-semibold leading-tight text-navy sm:text-[40px]">
            Ready for Pickup
          </h1>
          <p className="mb-6 text-stone">
            You don&apos;t have any upcoming rides. Go to the results page to
            view your matches.
          </p>
          <ButtonLink href="/results" variant="secondary">
            Back to Results
          </ButtonLink>
        </div>
      </div>
    )
  }

  if (error && matches.length === 0) {
    return (
      <div className="relative">
        <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:pt-12">
          <h1 className="mb-6 font-display text-[32px] font-semibold leading-tight text-navy sm:text-[40px]">
            Ready for Pickup
          </h1>
          <p className="mb-6 text-danger">{error}</p>
          <ButtonLink href="/results" variant="secondary">
            Back to Results
          </ButtonLink>
        </div>
      </div>
    )
  }

  if (groupReady) {
    return (
      <div className="relative">
        <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:pt-12">
          <div className="rounded-lg border border-line bg-card p-5 shadow-card sm:p-8">
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-sage-tint">
              <svg
                className="h-8 w-8 text-sage"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="mb-2 font-display text-3xl font-semibold text-navy">
              Your group is ready!
            </h1>
            <p className="mb-6 text-stone">
              Your voucher is available on the results page.
            </p>
            <ButtonLink href="/results" variant="secondary">
              View Results
            </ButtonLink>
          </div>
        </div>
      </div>
    )
  }

  const matchDate = formatRideDate(
    firstMatch?.date ?? firstMatch?.Flights?.date ?? null,
  )

  const matchTime = firstMatch?.time ? formatTime12Hour(firstMatch.time) : ''

  return (
    <div className="relative">
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:pt-12">
        <div className="rounded-lg border border-line bg-card p-5 shadow-card sm:p-8">
          {/* Delayed / Missing notice */}
          <Link
            href={`/aspc-delay/${rideId}`}
            className="mb-6 flex w-full items-center gap-3 rounded-md border border-warning/25 bg-warning-tint p-4 text-left transition-colors hover:border-warning/50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card">
              <svg
                className="h-5 w-5 text-warning"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">Delayed or missing?</p>
              <p className="text-sm text-warning">
                If you are delayed and will miss this ride, report it here and
                get rematched or a contingency voucher.
              </p>
            </div>
            <svg
              className="h-5 w-5 shrink-0 text-warning"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </Link>

          <h1 className="mb-2 font-display text-2xl font-semibold text-navy sm:text-3xl">
            Confirm your group is ready to receive voucher
          </h1>
          <p className="mb-6 text-stone">
            {firstMatch?.Flights?.to_airport
              ? `${firstMatch.Flights.airport} - School → Airport`
              : `${firstMatch?.Flights?.airport} - Airport → School`}
          </p>

          <div
            className={`mb-6 flex flex-col gap-3 rounded-md border px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
              everyoneAccountedFor
                ? 'border-sage/30 bg-sage-tint'
                : 'border-warning/25 bg-warning-tint'
            }`}
          >
            <div className="min-w-0 flex-1">
              <p
                className={`font-semibold ${everyoneAccountedFor ? 'text-sage-strong' : 'text-warning'}`}
              >
                {confirmedCount} of {totalCount} group members have confirmed
              </p>
              {everyoneAccountedFor ? (
                <p className="mt-1 text-sm text-sage-strong">
                  Everyone accounted for! You may return to the Results.
                  {rideVoucher && (
                    <span className="mt-2 block font-medium">
                      Uber voucher:{' '}
                      {rideVoucher.startsWith('https') ? (
                        <a
                          href={rideVoucher}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-navy underline underline-offset-2 hover:text-sage"
                        >
                          {rideVoucher}
                        </a>
                      ) : (
                        rideVoucher
                      )}
                    </span>
                  )}
                  {rideContingency &&
                    totalCount === 1 &&
                    (!rideVoucher || contingencyDiffersFromUber) && (
                      <span className="mt-2 block font-medium">
                        Contingency voucher:{' '}
                        {rideContingency.startsWith('https') ? (
                          <a
                            href={rideContingency}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-navy underline underline-offset-2 hover:text-sage"
                          >
                            {rideContingency}
                          </a>
                        ) : (
                          rideContingency
                        )}
                      </span>
                    )}
                  Your voucher will also appear on the results page.
                </p>
              ) : (
                <p className="mt-1 text-sm text-warning">
                  Complete the form below and press Confirm. If some members are
                  missing, select them below.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => void fetchRideData()}
              className={`min-h-[44px] shrink-0 text-sm font-medium hover:underline sm:min-h-0 ${
                everyoneAccountedFor ? 'text-sage-strong' : 'text-warning'
              }`}
            >
              Refresh
            </button>
          </div>

          <div className="mb-6 rounded-md bg-sunken p-4">
            <p className="text-sm font-medium text-ink">
              {matchDate}
              {matchTime && ` at ${matchTime}`}
            </p>
            <p className="mt-1 text-sm text-stone">Pickup: {pickupLocation}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label className="flex min-h-[44px] cursor-pointer items-start gap-3 sm:min-h-0 sm:items-center">
                <input
                  type="checkbox"
                  checked={atPickupLocation}
                  onChange={(e) => setAtPickupLocation(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-line-strong accent-sage sm:mt-0"
                />
                <span className="text-sm font-medium text-ink">
                  I&apos;m at the correct pickup location ({pickupLocation})
                </span>
              </label>
              <label className="flex min-h-[44px] cursor-pointer items-start gap-3 sm:min-h-0 sm:items-center">
                <input
                  type="checkbox"
                  checked={ackVehicleSize}
                  onChange={(e) => setAckVehicleSize(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-line-strong accent-sage sm:mt-0"
                />
                <span className="text-sm font-medium text-ink">
                  I acknowledge the suggested vehicle size (Uber {uberType}). If
                  not all people or luggage will fit, you can order a larger
                  ride.
                </span>
              </label>
              <label className="flex min-h-[44px] cursor-pointer items-start gap-3 sm:min-h-0 sm:items-center">
                <input
                  type="checkbox"
                  checked={ackWaitForGroup}
                  onChange={(e) => setAckWaitForGroup(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-line-strong accent-sage sm:mt-0"
                />
                <span className="text-sm font-medium text-ink">
                  I acknowledge that I will wait for everyone in my group before
                  requesting the ride. If I know they are not showing up, are
                  delayed, or we have waited at least 15 minutes for them, I
                  will report them missing from the group.
                </span>
              </label>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-ink">
                Everyone in my group is:
              </p>
              <div className="space-y-3">
                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 sm:min-h-0">
                  <input
                    type="radio"
                    name="readyStatus"
                    checked={everyoneReady}
                    onChange={() => {
                      setEveryoneReady(true)
                      setMissingUserIds([])
                    }}
                    className="h-5 w-5 cursor-pointer accent-sage"
                  />
                  <span>Here and ready</span>
                </label>
                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 sm:min-h-0">
                  <input
                    type="radio"
                    name="readyStatus"
                    checked={!everyoneReady}
                    onChange={() => setEveryoneReady(false)}
                    className="h-5 w-5 cursor-pointer accent-sage"
                  />
                  <span>Some people are missing</span>
                </label>
              </div>

              {!everyoneReady && otherMembers.length > 0 && (
                <div className="mt-4 rounded-md border border-line p-4">
                  <p className="mb-3 text-sm font-medium text-ink">
                    Who is missing? (check all that apply)
                  </p>
                  <div className="space-y-3">
                    {otherMembers.map((m) => (
                      <label
                        key={m.user_id}
                        className="flex min-h-[44px] cursor-pointer items-center gap-3 sm:min-h-0"
                      >
                        <input
                          type="checkbox"
                          checked={missingUserIds.includes(m.user_id)}
                          onChange={() => toggleMissing(m.user_id)}
                          className="h-5 w-5 cursor-pointer rounded accent-sage"
                        />
                        <span>{m.Users?.firstname || 'Unknown'}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}
            {success && <p className="text-sm text-sage">{success}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-navy px-4 text-[15px] font-medium text-white transition-[background-color,transform] duration-150 hover:bg-navy-700 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Confirm'}
            </button>
          </form>

          <div className="mt-8">
            <ButtonLink href="/results" variant="secondary">
              Back to Results
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AspcReadyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-sage border-r-transparent" />
        </div>
      }
    >
      <AspcReadyContent />
    </Suspense>
  )
}
