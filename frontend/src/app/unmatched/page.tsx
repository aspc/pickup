'use client'

import { ChevronDown, Inbox, Users } from 'lucide-react'
import { postJson, requestJson } from '@/utils/api'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { SignInPrompt } from '@/components/SignInPrompt'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'
import { RideTicket } from '@/components/ui/RideTicket'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/utils/tailwind'
import type {
  OwnUnmatchedFlightDto,
  UnmatchedFlightDto,
  UnmatchedGroupDto,
  UnmatchedOptionsResponseDto,
} from '@/contracts/readModels'
import { useUnmatchedInitialData } from '@/providers/InitialPageDataProvider'

const matchRequestsEnabled =
  process.env.NEXT_PUBLIC_ENABLE_MATCH_REQUESTS === 'true'

export default function UnmatchedPage() {
  const initialData = useUnmatchedInitialData()
  const initialDataRef = useRef(initialData)
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [flights, setFlights] = useState<UnmatchedFlightDto[]>([])
  const [groups, setGroups] = useState<UnmatchedGroupDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedFlight, setSelectedFlight] =
    useState<UnmatchedFlightDto | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [userEligible, setUserEligible] = useState(false)
  const [myFlights, setMyFlights] = useState<OwnUnmatchedFlightDto[]>([])
  const [selectedMyFlightId, setSelectedMyFlightId] = useState<number | null>(
    null,
  )
  const [showGroups, setShowGroups] = useState(false)
  const [showIndividuals, setShowIndividuals] = useState(false)

  // Function to convert military time to 12-hour format
  const formatTime = (militaryTime: string | null | undefined) => {
    if (!militaryTime) return 'N/A'

    const [hours, minutes] = militaryTime.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours

    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }

  const fetchData = useCallback(async () => {
    setLoading(true)

    if (!user) {
      setLoading(false)
      return
    }

    try {
      const result =
        initialDataRef.current ??
        (await requestJson<UnmatchedOptionsResponseDto>(
          '/api/unmatched/options',
        ))
      initialDataRef.current = null

      setFlights(result.flights)
      setGroups(result.groups)
      setMyFlights(result.myFlights)
      setUserEligible(result.userEligible)
      setLoading(false)
      return
    } catch (fetchError) {
      console.error('Error fetching data:', fetchError)
      setError('Error fetching flight or match data.')
      setLoading(false)
      return
    }
  }, [user])

  useEffect(() => {
    if (user) {
      void fetchData()
    } else {
      setLoading(false)
    }
  }, [user, fetchData])

  const sendMatchRequest = async (
    receiverId: string,
    receiverFlightId: number,
  ) => {
    if (selectedMyFlightId === null) {
      alert('Please select a flight before confirming.')
      return
    }

    if (!user) {
      alert('You must be logged in to send requests.')
      return
    }

    try {
      await postJson('/api/match-requests/send', {
        receiverId,
        senderFlightId: selectedMyFlightId,
        receiverFlightId,
      })
    } catch (error) {
      console.error('Failed to send match request:', error)
      alert('Failed to send request.')
      return
    }

    alert('Match request sent!')

    // Refresh page data immediately
    await fetchData()

    setShowConfirmation(false)
    setSelectedFlight(null)
    setSelectedMyFlightId(null)
  }

  // Show loading state while checking authentication
  if (authLoading || (isAuthenticated && loading)) {
    return (
      <PageContainer width="narrow">
        <div className="flex items-center justify-center gap-3 py-24 text-stone">
          <Spinner label="Loading unmatched flights" />
          <span className="text-[15px]">
            {authLoading ? 'Loading...' : 'Loading unmatched flights...'}
          </span>
        </div>
      </PageContainer>
    )
  }

  if (!isAuthenticated) {
    return (
      <PageContainer width="narrow">
        <PageHeader
          eyebrow="Find a group"
          title="Unmatched flights"
          description="Sign in to find other travelers who need rides."
        />
        <SignInPrompt />
      </PageContainer>
    )
  }

  if (error)
    return (
      <PageContainer width="narrow">
        <Alert tone="danger">{error}</Alert>
      </PageContainer>
    )

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Find a group"
        title="Unmatched flights"
        description="Find other travelers who need rides."
        actions={
          <ButtonLink href="/MatchRequestsPage" variant="secondary">
            <Inbox aria-hidden className="h-[18px] w-[18px]" />
            View incoming requests
          </ButtonLink>
        }
      />

      <div className="space-y-4">
        {groups.length > 0 && (
          <CollapsibleSection
            id="groups"
            title={`Groups looking for riders (${groups.length})`}
            description="These groups have been matched but need more people to split costs (not ASPC subsidized)"
            open={showGroups}
            onToggle={() => setShowGroups(!showGroups)}
          >
            {groups.map((group) => {
              const firstFlight = group.flights[0]
              return (
                <RideTicket
                  key={group.ride_id}
                  date={firstFlight?.date ?? null}
                  time={group.time}
                  timeLabel="Ride"
                  airport={firstFlight?.airport ?? ''}
                  toAirport={Boolean(firstFlight?.to_airport)}
                  status="waiting"
                  statusLabel="Needs riders"
                  stub="Contact members directly to coordinate joining this ride"
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-stone">
                    Current members ({group.flights.length})
                  </p>
                  <ul className="divide-y divide-line rounded-md border border-line">
                    {group.flights.map((flight, index) => (
                      <li key={index} className="px-3 py-2.5 text-sm">
                        {flight.opt_in ? (
                          <>
                            <p className="font-medium text-ink">
                              {flight.Users?.firstname} {flight.Users?.lastname}
                            </p>
                            <p className="text-stone">
                              {flight.Users?.email && (
                                <span className="break-all">
                                  {flight.Users.email} ·{' '}
                                </span>
                              )}
                              Available {formatTime(flight.earliest_time)} -{' '}
                              {formatTime(flight.latest_time)}
                            </p>
                          </>
                        ) : (
                          <p className="italic text-stone">Anonymous rider</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </RideTicket>
              )
            })}
          </CollapsibleSection>
        )}

        <CollapsibleSection
          id="individuals"
          title={`Individual travelers (${flights.length})`}
          description="Individuals with upcoming flights looking for ride shares"
          open={showIndividuals}
          onToggle={() => setShowIndividuals(!showIndividuals)}
        >
          {flights.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No individual flights"
              description="All available flights are already in groups"
            />
          ) : (
            flights.map((flight) => (
              <RideTicket
                key={flight.flight_id}
                date={flight.date}
                time={null}
                airport={flight.airport}
                toAirport={flight.to_airport}
                status="unmatched"
                statusLabel="Looking for riders"
                stub={
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>Contact directly to coordinate ride sharing</span>
                    {matchRequestsEnabled && (
                      <Button
                        size="sm"
                        variant="accent"
                        disabled={!userEligible}
                        onClick={() => {
                          setSelectedFlight(flight)
                          setShowConfirmation(true)
                        }}
                      >
                        {userEligible
                          ? 'Send request'
                          : 'All your flights are matched'}
                      </Button>
                    )}
                  </div>
                }
              >
                <div className="text-sm">
                  <p className="font-medium text-ink">
                    {flight.Users
                      ? `${flight.Users.firstname} ${flight.Users.lastname}`
                      : 'Unknown user'}
                  </p>
                  <p className="text-stone">
                    {flight.Users?.email && (
                      <span className="break-all">{flight.Users.email} · </span>
                    )}
                    Available {formatTime(flight.earliest_time)} -{' '}
                    {formatTime(flight.latest_time)}
                  </p>
                </div>
              </RideTicket>
            ))
          )}
        </CollapsibleSection>
      </div>

      {matchRequestsEnabled && (
        <ConfirmationModal
          open={showConfirmation && selectedFlight !== null}
          title={`Send a match request to ${selectedFlight?.Users ? `${selectedFlight.Users.firstname} ${selectedFlight.Users.lastname}` : 'this user'}?`}
          onConfirm={() => {
            if (!selectedFlight?.user_id) {
              alert('Could not determine the rider for this flight.')
              return
            }
            sendMatchRequest(selectedFlight.user_id, selectedFlight.flight_id)
          }}
          onCancel={() => {
            setShowConfirmation(false)
            setSelectedFlight(null)
            setSelectedMyFlightId(null)
          }}
          myFlights={myFlights}
          selectedMyFlightId={selectedMyFlightId}
          setSelectedMyFlightId={setSelectedMyFlightId}
        />
      )}
    </PageContainer>
  )
}

function CollapsibleSection({
  id,
  title,
  description,
  open,
  onToggle,
  children,
}: {
  id: string
  title: string
  description: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-line bg-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-paper focus-visible:ring-inset focus-visible:ring-offset-0"
      >
        <span>
          <span className="block font-semibold text-navy">{title}</span>
          <span className="mt-0.5 block text-sm text-stone">{description}</span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            'h-5 w-5 shrink-0 text-stone transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div
          id={`${id}-panel`}
          className="space-y-4 border-t border-line bg-paper px-3 py-4 [--ticket-notch:theme(colors.paper)] sm:px-5"
        >
          {children}
        </div>
      )}
    </section>
  )
}

function ConfirmationModal({
  open,
  title,
  onConfirm,
  onCancel,
  myFlights,
  selectedMyFlightId,
  setSelectedMyFlightId,
}: {
  open: boolean
  title: string
  onConfirm: () => void
  onCancel: () => void
  myFlights: OwnUnmatchedFlightDto[]
  selectedMyFlightId: number | null
  setSelectedMyFlightId: (id: number) => void
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description="Choose one of your flights."
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Send request</Button>
        </>
      }
    >
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium text-ink">
          Select your flight:
        </legend>
        {myFlights.map((flight) => (
          <label
            key={flight.flight_id}
            className="has-[:checked]:border-sage has-[:checked]:bg-sage-tint flex cursor-pointer items-center gap-3 rounded-md border border-line p-3 transition-colors hover:bg-paper"
          >
            <input
              type="radio"
              name="selectedFlight"
              value={flight.flight_id}
              checked={selectedMyFlightId === flight.flight_id}
              onChange={() => setSelectedMyFlightId(flight.flight_id)}
              className="h-4 w-4 accent-sage"
            />
            <span className="flex-1">
              <span className="block font-medium text-ink">{flight.date}</span>
              <span className="block text-sm text-stone">
                {flight.airport} ({flight.earliest_time} - {flight.latest_time})
              </span>
            </span>
          </label>
        ))}
      </fieldset>
    </Modal>
  )
}
