'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { requestJson } from '@/utils/api'
import { useCallback, useEffect, useState } from 'react'
import { ButtonLink } from '@/components/ui/Button'
import FlightConfirmStep from '@/components/aspc-delay/FlightConfirmStep'
import NewFlightStep, {
  type NewFlightTimeRange,
} from '@/components/aspc-delay/NewFlightStep'
import ReasonForDelayStep from '@/components/aspc-delay/ReasonForDelayStep'
import DelayInfoStep from '@/components/aspc-delay/DelayInfoStep'
import {
  useFindNewMatch,
  getContingencyVoucherDeclineReasons,
  type FindNewMatchResult,
} from '@/hooks/useFindNewMatch'
import type {
  AspcDelayFormState,
  DelayFormCurrentFlight,
  DelayFormNewFlight,
} from '@/components/aspc-delay/types'
import { REASON_FOR_DELAY_LABELS } from '@/components/aspc-delay/types'

const initialFormState: AspcDelayFormState = {
  step: 0,
  flightUnchanged: null,
  newFlight: null,
  reasonForDelay: null,
  customReasonText: '',
  newEtaDate: '',
  newEtaTime: '',
  newEtaTimeEarliest: '',
  newEtaTimeLatest: '',
}

export default function AspcDelayPage() {
  const params = useParams()
  const rideId = params.rideId as string
  const { user } = useAuth()
  const {
    findNewMatch,
    joinGroup,
    declineAllGroups,
    loading: findNewMatchLoading,
  } = useFindNewMatch()

  const [formState, setFormState] =
    useState<AspcDelayFormState>(initialFormState)
  const [currentFlight, setCurrentFlight] =
    useState<DelayFormCurrentFlight | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [defaultEtaDate, setDefaultEtaDate] = useState('')
  const [findResult, setFindResult] = useState<FindNewMatchResult | null>(null)
  const [joinedRideId, setJoinedRideId] = useState<number | null>(null)
  const [joiningRideId, setJoiningRideId] = useState<number | null>(null)
  const [choseUnmatched, setChoseUnmatched] = useState(false)
  const [declining, setDeclining] = useState(false)

  const fetchRideAndFlight = useCallback(async () => {
    if (!user || !rideId) return
    setLoading(true)
    setError(null)
    try {
      const rid = parseInt(rideId, 10)
      if (Number.isNaN(rid)) {
        setError('Invalid ride.')
        return
      }
      const result = await requestJson<{
        success: boolean
        currentFlight: DelayFormCurrentFlight | null
        defaultEtaDate: string
      }>(`/api/aspc-delay?rideId=${rid}`)

      const f = result.currentFlight
      if (!f) {
        setError('No flight found for this match.')
        return
      }

      setCurrentFlight({
        airport: f.airport,
        to_airport: f.to_airport,
        date: f.date,
        flight_no: f.flight_no ?? '',
        airline_iata: f.airline_iata ?? '',
        earliest_time: f.earliest_time,
        latest_time: f.latest_time,
      })
      setDefaultEtaDate(result.defaultEtaDate || f.date)
      setFormState((s) => ({
        ...s,
        newEtaDate: s.newEtaDate || result.defaultEtaDate || f.date,
      }))
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to load ride information.',
      )
    } finally {
      setLoading(false)
    }
  }, [user, rideId])

  useEffect(() => {
    if (user && rideId) void fetchRideAndFlight()
    else setLoading(false)
  }, [user, rideId, fetchRideAndFlight])

  const goToStep3 = () => setFormState((s) => ({ ...s, step: 3 }))
  const goBack = () =>
    setFormState((s) => {
      if (s.step === 1) return { ...s, step: 0 }
      if (s.step === 2)
        return { ...s, step: s.flightUnchanged === false ? 1 : 0 }
      if (s.step === 3) return { ...s, step: 2 }
      return s
    })

  const handleConfirmSame = () => {
    setFormState((s) => ({ ...s, flightUnchanged: true, step: 2 }))
  }

  const handleConfirmChanged = () => {
    setFormState((s) => ({ ...s, flightUnchanged: false, step: 1 }))
  }

  const handleNewFlightSubmit = (
    flight: DelayFormNewFlight,
    timeRange?: NewFlightTimeRange,
  ) => {
    setFormState((s) => ({
      ...s,
      newFlight: flight,
      newEtaTimeEarliest: timeRange?.earliest ?? '',
      newEtaTimeLatest: timeRange?.latest ?? '',
      step: 2,
    }))
  }

  const handleReasonContinue = async () => {
    goToStep3()
  }

  const defaultDateForEta =
    formState.newFlight?.date || currentFlight?.date || defaultEtaDate
  const newEtaDate = formState.newEtaDate || defaultDateForEta
  const isDifferentDay =
    defaultDateForEta && newEtaDate && newEtaDate !== defaultDateForEta
  const showTimeRangeOnDelayStep =
    isDifferentDay || Boolean(formState.newFlight)

  const handleFindNewMatch = async () => {
    if (!user) return
    const reasonValue =
      formState.reasonForDelay === 'custom'
        ? `Custom Delay: "${formState.customReasonText.trim()}"`
        : formState.reasonForDelay
          ? REASON_FOR_DELAY_LABELS[formState.reasonForDelay]
          : ''
    const fromNewFlight = Boolean(formState.newFlight)
    const result = await findNewMatch({
      rideId,
      userId: user.id,
      reasonForDelay: reasonValue,
      newEtaDate: fromNewFlight
        ? formState.newFlight!.date
        : formState.newEtaDate || defaultDateForEta,
      newEtaTime: fromNewFlight
        ? formState.newEtaTimeEarliest || formState.newFlight!.time
        : isDifferentDay
          ? formState.newEtaTimeEarliest
          : formState.newEtaTime,
      ...(fromNewFlight &&
      formState.newEtaTimeEarliest &&
      formState.newEtaTimeLatest
        ? {
            newEtaTimeEarliest: formState.newEtaTimeEarliest,
            newEtaTimeLatest: formState.newEtaTimeLatest,
          }
        : isDifferentDay &&
            formState.newEtaTimeEarliest &&
            formState.newEtaTimeLatest
          ? {
              newEtaTimeEarliest: formState.newEtaTimeEarliest,
              newEtaTimeLatest: formState.newEtaTimeLatest,
            }
          : {}),
      newFlight: formState.newFlight ?? undefined,
    })
    if (result) {
      if (!result.success) {
        setError(result.error ?? 'Something went wrong')
        return
      }
      setFindResult(result)
    }
  }

  if (loading) {
    return (
      <div className="relative">
        <div className="flex min-h-[60vh] items-center justify-center p-4">
          <p className="text-stone">Loading…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative">
        <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:pt-12">
          <div className="rounded-lg border border-line bg-card p-5 shadow-card sm:p-8">
            <p className="mb-4 text-danger">{error}</p>
            <ButtonLink href="/results" variant="secondary">
              Back to Results
            </ButtonLink>
          </div>
        </div>
      </div>
    )
  }

  if (findResult?.success) {
    if (findResult.keptOriginalGroupBecauseEarlierEta) {
      return (
        <div className="relative">
          <div className="flex w-full justify-center px-4 pb-16 pt-8 sm:pt-12">
            <div className="w-full max-w-2xl">
              <div className="rounded-lg border border-line bg-card p-5 shadow-card sm:p-8">
                <h2 className="mb-3 text-lg font-semibold text-navy">
                  This isn&apos;t a delay for your match
                </h2>
                <p className="mb-3 text-ink">
                  The pickup time you entered is <strong>earlier</strong> than
                  your original group&apos;s time. You can still make that ride,
                  so you&apos;ve been{' '}
                  <strong>kept on your original group</strong>-nothing was
                  changed.
                </p>
                <p className="mb-6 text-sm text-stone">
                  Wait for your original pickup time on Results. If your plans
                  change again and you&apos;ll be <em>later</em> than the group,
                  you can report a delay then.
                </p>
                <div className="border-t border-line pt-4">
                  <ButtonLink href="/results" variant="secondary">
                    Back to Results
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    const groups = findResult.availableGroups ?? []
    const hasGroups = groups.length > 0
    const showVoucher =
      !hasGroups &&
      findResult.contingencyVoucherApplied === true &&
      Boolean(findResult.contingencyVoucher)
    const uniqueNoVoucherReasons =
      getContingencyVoucherDeclineReasons(findResult)

    return (
      <div className="relative">
        <div className="flex w-full justify-center px-4 pb-16 pt-8 sm:pt-12">
          <div className="w-full max-w-2xl">
            <div className="rounded-lg border border-line bg-card p-5 shadow-card sm:p-8">
              {joinedRideId != null ? (
                <>
                  <p className="mb-4 text-ink">
                    You&apos;ve been added to the group. Your Results page has
                    been updated.
                  </p>
                </>
              ) : choseUnmatched ? (
                <>
                  <p className="mb-4 text-ink">
                    You&apos;ve been removed from your group. You can look for
                    other riders on the unmatched page.
                  </p>
                  <p className="text-sm text-stone">
                    <Link
                      href="/unmatched"
                      className="font-medium text-navy underline underline-offset-2 hover:text-sage"
                    >
                      Go to unmatched page
                    </Link>
                  </p>
                </>
              ) : findResult.movedToUnmatched ? (
                <>
                  <p className="mb-3 text-ink">
                    We couldn&apos;t find another group for your new pickup
                    time. No contingency voucher was applied for these reasons:
                  </p>
                  <ul className="mb-4 list-disc space-y-2 pl-5 text-sm text-ink">
                    {uniqueNoVoucherReasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                  <p className="mb-4 text-ink">
                    You&apos;ve been removed from your match so you can look for
                    other riders on the unmatched page.
                  </p>
                  <p className="text-sm text-stone">
                    <Link
                      href="/unmatched"
                      className="font-medium text-navy underline underline-offset-2 hover:text-sage"
                    >
                      Go to unmatched page
                    </Link>
                  </p>
                </>
              ) : hasGroups ? (
                <>
                  <h2 className="mb-2 text-lg font-semibold text-navy">
                    Available groups
                  </h2>
                  <p className="mb-4 text-sm text-stone">
                    Groups on your date and route that can accommodate you.
                  </p>
                  <ul className="space-y-3">
                    {groups.map((g) => (
                      <li
                        key={g.rideId}
                        className="flex flex-col gap-3 rounded-md border border-line bg-paper px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-ink">
                            {new Date(g.date + 'T00:00:00').toLocaleDateString(
                              'en-US',
                              {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              },
                            )}{' '}
                            at {g.rideTime}
                          </span>
                          <span className="text-sm text-stone">
                            Uber {g.rideType} · {g.riderCount}{' '}
                            {g.riderCount === 1 ? 'person' : 'people'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!user) return
                            setJoiningRideId(g.rideId)
                            const res = await joinGroup({
                              currentRideId: parseInt(rideId, 10),
                              userId: user.id,
                              selectedRideId: g.rideId,
                            })
                            setJoiningRideId(null)
                            if (res?.success) setJoinedRideId(g.rideId)
                            else setError(res?.error ?? 'Failed to join group')
                          }}
                          disabled={joiningRideId != null}
                          className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-navy px-3 text-sm font-medium text-white transition-colors hover:bg-navy-700 disabled:opacity-50"
                        >
                          {joiningRideId === g.rideId
                            ? 'Joining…'
                            : 'Join this group'}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!user) return
                        setDeclining(true)
                        const res = await declineAllGroups({
                          currentRideId: parseInt(rideId, 10),
                          userId: user.id,
                        })
                        setDeclining(false)
                        if (res?.success) setChoseUnmatched(true)
                        else setError(res?.error ?? 'Failed to leave group')
                      }}
                      disabled={declining}
                      className="text-sm font-medium text-stone underline underline-offset-2 hover:text-navy disabled:opacity-50"
                    >
                      {declining
                        ? 'Leaving…'
                        : "Don't join any group - I'll go to unmatched"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {showVoucher ? (
                    <>
                      <p className="mb-3 text-ink">
                        We couldn&apos;t find a new group, but you qualify for a
                        contingency voucher.
                      </p>
                      <div className="mb-4 rounded-md border border-warning/20 bg-warning-tint p-4">
                        <p className="mb-2 text-sm font-semibold text-warning">
                          Contingency voucher
                        </p>
                        <a
                          href={findResult.contingencyVoucher ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-sm font-medium text-navy underline underline-offset-2 hover:text-sage"
                        >
                          {findResult.contingencyVoucher}
                        </a>
                        <p className="mt-2 text-xs text-warning">
                          Take note of this voucher.
                        </p>
                      </div>
                      <p className="text-sm text-stone">
                        This voucher is also saved on your Results page for
                        reference.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mb-3 text-ink">
                        We couldn&apos;t find another group for your new pickup
                        time. A contingency voucher was not applied for these
                        reasons:
                      </p>
                      <ul className="mb-4 list-disc space-y-2 pl-5 text-sm text-ink">
                        {uniqueNoVoucherReasons.map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                      <p className="text-sm text-stone">
                        Please keep an eye out on the{' '}
                        <Link
                          href="/unmatched"
                          className="font-medium text-navy underline underline-offset-2 hover:text-sage"
                        >
                          unmatched page
                        </Link>{' '}
                        for opportunities to connect with other riders.
                      </p>
                    </>
                  )}
                </>
              )}
              <div className="mt-6 border-t border-line pt-4">
                <ButtonLink href="/results" variant="secondary">
                  Back to Results
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex w-full justify-center px-4 pb-16 pt-8 sm:pt-12">
        <div className="w-full max-w-2xl">
          <div className="mb-4 text-center md:mb-6">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-sage-tint">
              <svg
                className="h-6 w-6 text-sage"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="mb-1 font-display text-2xl font-semibold text-navy sm:text-3xl">
              Report a delay
            </h1>
            <p className="text-sm text-stone sm:text-base">Ride ID: {rideId}</p>
          </div>

          <div className="rounded-lg border border-line bg-card p-5 shadow-card sm:p-8">
            {formState.step >= 1 && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-line-strong bg-card px-3.5 text-sm font-medium text-ink transition-[background-color,transform] duration-150 hover:bg-sunken active:scale-[0.97]"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back
                </button>
              </div>
            )}
            {formState.step === 0 && (
              <FlightConfirmStep
                currentFlight={currentFlight}
                onConfirmSame={handleConfirmSame}
                onConfirmChanged={handleConfirmChanged}
              />
            )}
            {formState.step === 1 && (
              <NewFlightStep
                defaultDate={currentFlight?.date ?? defaultEtaDate}
                newFlight={formState.newFlight}
                onContinue={handleNewFlightSubmit}
              />
            )}
            {formState.step === 2 && (
              <ReasonForDelayStep
                selectedReason={formState.reasonForDelay}
                customReasonText={formState.customReasonText}
                onSelect={(reason) =>
                  setFormState((s) => ({ ...s, reasonForDelay: reason }))
                }
                onCustomTextChange={(text) =>
                  setFormState((s) => ({ ...s, customReasonText: text }))
                }
                onContinue={handleReasonContinue}
              />
            )}
            {formState.step === 3 && (
              <DelayInfoStep
                flightChanged={formState.flightUnchanged === false}
                newFlight={formState.newFlight}
                newFlightTimeEarliest={formState.newEtaTimeEarliest}
                newFlightTimeLatest={formState.newEtaTimeLatest}
                defaultDate={defaultDateForEta}
                newEtaDate={newEtaDate}
                newEtaTime={formState.newEtaTime}
                newEtaTimeEarliest={formState.newEtaTimeEarliest}
                newEtaTimeLatest={formState.newEtaTimeLatest}
                showTimeRange={showTimeRangeOnDelayStep}
                onDateChange={(date) =>
                  setFormState((s) => ({ ...s, newEtaDate: date }))
                }
                onTimeChange={(time) =>
                  setFormState((s) => ({ ...s, newEtaTime: time }))
                }
                onEarliestChange={(time) =>
                  setFormState((s) => ({ ...s, newEtaTimeEarliest: time }))
                }
                onLatestChange={(time) =>
                  setFormState((s) => ({ ...s, newEtaTimeLatest: time }))
                }
                onFindNewMatch={handleFindNewMatch}
                isFindNewMatchLoading={findNewMatchLoading}
              />
            )}

            <div className="mt-6 border-t border-line pt-4">
              <ButtonLink href="/results" variant="secondary">
                Back to Results
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
