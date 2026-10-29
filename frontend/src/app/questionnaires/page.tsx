'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Pencil, PlaneTakeoff, Plus, X } from 'lucide-react'
import { deleteJson } from '@/utils/api'
import { createBrowserClient } from '@/utils/supabase'
import ConfirmCancel from '@/components/questionnaires/ConfirmCancel'
import { SignInPrompt } from '@/components/SignInPrompt'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'
import { RideTicket } from '@/components/ui/RideTicket'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'
import { canEditFlight } from '@/utils/flightValidation'
import {
  isSubmitted,
  isUnmatched,
  type MatchingStatus,
} from '@/utils/matchingStatus'
import { validateUserProfile } from '@/utils/profileValidation'

interface MatchForm {
  flight_id: string
  flight_no: string
  airline_iata: string
  date: string
  matching_status: MatchingStatus
  opt_in: boolean
  earliest_time: string
  latest_time: string
  to_airport: boolean
  airport: string
}

export default function Questionnaires() {
  const supabase = createBrowserClient()
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [matchForms, setMatchForms] = useState<MatchForm[]>([])
  const [message, setMessage] = useState('')
  const [modalFlightId, setModalFlightId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileBannerDismissed, setProfileBannerDismissed] = useState(false)

  // Function to convert 24-hour time to 12-hour format with AM/PM
  const formatTime12Hour = (time24: string): string => {
    if (!time24) return ''
    const [hours, minutes] = time24.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hours12 = hours % 12 || 12
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const fetchMatchForms = useCallback(async () => {
    try {
      setLoading(true)

      if (!user) {
        console.error('No authenticated user found')
        return
      }

      const userId = user.id

      const { data: matchForms, error } = await supabase
        .from('Flights')
        .select(
          'flight_id, flight_no, airline_iata, date, matching_status, earliest_time, latest_time, to_airport, airport',
        )
        .eq('user_id', userId)
        .order('date', { ascending: true })

      if (error) {
        console.error(
          'Error fetching match forms:',
          error.message,
          error.details,
        )
        setMessage(`Error fetching match forms: ${error.message}`)
      } else {
        setMatchForms(matchForms as MatchForm[])
      }
    } catch (error) {
      console.error('Error in fetchMatchForms:', error)
      setMessage('Error loading match forms')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (user) {
      const loadPage = async () => {
        try {
          const profileValidation = await validateUserProfile(user)
          if (!profileValidation.isValid) {
            router.replace('/profile')
            return
          }

          void fetchMatchForms()
        } catch (error) {
          console.error('Error checking profile status:', error)
          router.replace('/profile')
        }
      }

      void loadPage()
    } else {
      setLoading(false)
    }
  }, [user, fetchMatchForms, router])

  const handleDelete = (flightId: string) => {
    setModalFlightId(flightId) // ✅ Set the specific flight ID
  }

  const confirmDelete = async () => {
    if (!modalFlightId) return // Ensure there is a flight ID

    console.log('Deleting flight with ID:', modalFlightId)
    try {
      await deleteJson(`/api/flights/${modalFlightId}`)
      setMatchForms((prevForms) =>
        prevForms.filter((form) => form.flight_id !== modalFlightId),
      )
      console.log(`Flight ${modalFlightId} deleted successfully.`)
    } catch (error) {
      console.error('Error deleting match form:', error)
      setMessage('Error deleting form.')
    }

    setModalFlightId(null) // ✅ Close modal after deletion
  }

  // Filter flights by date and matching status
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize to midnight to avoid timezone issues

  // Filter out flights that have already happened
  const upcomingForms = matchForms.filter((form) => {
    const formDate = new Date(form.date)
    formDate.setHours(0, 0, 0, 0)
    return formDate >= today
  })

  // Upcoming forms: submitted - batch matcher has not run yet
  const upcomingUnmatchedForms = upcomingForms.filter((form) =>
    isSubmitted(form.matching_status),
  )

  // Unmatched forms: matcher ran but no group was found
  const unmatchedForms = upcomingForms.filter((form) =>
    isUnmatched(form.matching_status),
  )

  if (!isAuthenticated) {
    return (
      <PageContainer width="narrow">
        <PageHeader
          eyebrow="Your flights"
          title="Your match forms"
          description="Sign in to view and manage your flight match requests."
        />
        <SignInPrompt />
      </PageContainer>
    )
  }

  if (loading)
    return (
      <PageContainer width="narrow">
        <div className="flex items-center justify-center gap-3 py-24 text-stone">
          <Spinner label="Loading match forms" />
          <span className="text-[15px]">Loading match forms...</span>
        </div>
      </PageContainer>
    )

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Your flights"
        title="Your match forms"
        description="Manage your flight requests and find travel companions."
        actions={
          <ButtonLink href="/matchForm">
            <Plus aria-hidden className="h-[18px] w-[18px]" />
            Request match
          </ButtonLink>
        }
      />

      <div className="space-y-10">
        {!profileBannerDismissed && (
          <div className="relative rounded-lg border border-sage/25 bg-sage-tint px-5 py-4">
            <button
              onClick={() => setProfileBannerDismissed(true)}
              className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-md text-sage-strong transition-colors hover:bg-sage/10"
              aria-label="Dismiss banner"
            >
              <X aria-hidden className="h-[18px] w-[18px]" />
            </button>
            <div className="flex items-start gap-3 pr-8">
              <Mail
                aria-hidden
                className="mt-0.5 hidden h-5 w-5 shrink-0 text-sage sm:block"
              />
              <div>
                <h2 className="font-semibold text-navy">
                  Update your contact info and get text notifications
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-ink/90">
                  Make sure your preferred email is up to date and opt in to
                  receive important text updates about your rides from ASPC.
                </p>
                <ButtonLink
                  href="/profile"
                  variant="accent"
                  size="sm"
                  className="mt-3"
                >
                  Update profile
                </ButtonLink>
              </div>
            </div>
          </div>
        )}

        {message && <Alert tone="danger">{message}</Alert>}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-navy">
              Your upcoming flights
            </h2>
            <p className="mt-0.5 text-sm text-stone">
              {upcomingUnmatchedForms.length > 0
                ? 'Flights awaiting match results'
                : 'No upcoming flights - check deadlines for each service period'}
            </p>
          </div>

          {upcomingUnmatchedForms.length > 0 ? (
            <div className="space-y-4">
              {upcomingUnmatchedForms.map((form) => {
                const canEdit = canEditFlight(form.date)
                return (
                  <RideTicket
                    key={form.flight_id}
                    date={form.date}
                    time={null}
                    airport={form.airport}
                    toAirport={form.to_airport}
                    status="waiting"
                    statusLabel={canEdit ? 'Awaiting match' : 'Locked'}
                    stub={
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span>
                          {canEdit
                            ? 'You can edit until the deadline'
                            : 'Deadline passed - awaiting match results'}
                        </span>
                        <div className="flex gap-2">
                          {canEdit ? (
                            <>
                              <ButtonLink
                                href={`/editForm/${form.flight_id}`}
                                variant="secondary"
                                size="sm"
                              >
                                <Pencil aria-hidden className="h-4 w-4" />
                                Edit
                              </ButtonLink>
                              <Button
                                variant="danger-ghost"
                                size="sm"
                                onClick={() => handleDelete(form.flight_id)}
                              >
                                Delete
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="secondary" size="sm" disabled>
                                <Lock aria-hidden className="h-4 w-4" />
                                Edit
                              </Button>
                              <Button variant="danger-ghost" size="sm" disabled>
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    }
                  >
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-stone">Flight</dt>
                        <dd className="mt-0.5 font-medium text-ink">
                          {form.airline_iata}
                          {form.flight_no}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone">Leaving between</dt>
                        <dd className="mt-0.5 font-medium text-ink">
                          {formatTime12Hour(form.earliest_time)} -{' '}
                          {formatTime12Hour(form.latest_time)}
                        </dd>
                      </div>
                    </dl>
                  </RideTicket>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={PlaneTakeoff}
              title="No upcoming flights"
              description="Request a match to get started!"
              action={<ButtonLink href="/matchForm">Request match</ButtonLink>}
            />
          )}
        </section>

        {unmatchedForms.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-navy">
                Unmatched flights
              </h2>
              <p className="mt-0.5 text-sm text-stone">
                We couldn&apos;t find matches for these flights
              </p>
            </div>
            <div className="space-y-4">
              {unmatchedForms.map((form) => (
                <RideTicket
                  key={form.flight_id}
                  date={form.date}
                  time={null}
                  airport={form.airport}
                  toAirport={form.to_airport}
                  status="unmatched"
                  statusLabel="No match found"
                  stub={
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span>
                        Flight {form.airline_iata} {form.flight_no}
                      </span>
                      <ButtonLink
                        href="/unmatched"
                        variant="secondary"
                        size="sm"
                      >
                        Find others
                      </ButtonLink>
                    </div>
                  }
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <ConfirmCancel
        isOpen={modalFlightId !== null}
        onClose={() => setModalFlightId(null)}
        onConfirm={confirmDelete}
      />
    </PageContainer>
  )
}
