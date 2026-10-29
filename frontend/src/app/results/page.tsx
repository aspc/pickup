'use client'
import CommentSection from '@/components/results/CommentSection'
import { CalendarClock, ChevronDown, History } from 'lucide-react'
import { SignInPrompt } from '@/components/SignInPrompt'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/utils/tailwind'
import MatchCard from '@/components/results/MatchCard'
import { postJson, requestJson } from '@/utils/api'
import { useResultsInitialData } from '@/providers/InitialPageDataProvider'
import { isGroupReady } from '@/utils/groupReadiness'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type {
  MarkGroupsReadyResponseDto,
  ResultMatchDto,
  ResultsResponseDto,
} from '@/contracts/readModels'

interface GroupedMatches {
  upcoming: {
    [ride_id: number]: ResultMatchDto[]
  }
  previous: {
    [ride_id: number]: ResultMatchDto[]
  }
}

const groupMatchesByRideId = (matches: ResultMatchDto[]) => {
  const grouped: { [key: number]: ResultMatchDto[] } = {}

  matches.forEach((match) => {
    const rideId = match.ride_id
    if (!grouped[rideId]) {
      grouped[rideId] = []
    }
    grouped[rideId].push(match)
  })

  return grouped
}

export default function Results() {
  const initialData = useResultsInitialData()
  const initialDataRef = useRef(initialData)
  const [matches, setMatches] = useState<GroupedMatches>({
    upcoming: {},
    previous: {},
  })
  const [rideReadiness, setRideReadiness] = useState<
    Record<number, { isReady: boolean; matchDateTime: Date | null }>
  >({})
  const [showPrevious, setShowPrevious] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pendingReadyRideIds, setPendingReadyRideIds] = useState<number[]>([])
  const { user, isAuthenticated } = useAuth()

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true)

      if (!user) {
        console.error('No authenticated user found')
        return
      }

      const result =
        initialDataRef.current ??
        (await requestJson<ResultsResponseDto>('/api/results'))
      initialDataRef.current = null

      if (!result.matches || result.matches.length === 0) {
        setMatches({ upcoming: {}, previous: {} })
        setRideReadiness({})
        setPendingReadyRideIds([])
        return
      }

      const matchesWithDetails = result.matches

      // Group into upcoming and previous, and then by ride_id
      const now = new Date()
      const grouped = matchesWithDetails.reduce<GroupedMatches>(
        (acc, match) => {
          // Use match date and time if available, otherwise fall back to flight date
          let matchDateTime: Date

          if (match.date && match.time) {
            // Parse date manually to avoid timezone issues
            const [year, month, day] = match.date.split('-').map(Number)
            const [hours, minutes] = match.time.split(':').map(Number)
            matchDateTime = new Date(year, month - 1, day, hours, minutes)
          } else if (match.Flights?.date) {
            // Fallback to flight date if match date/time not available
            const [year, month, day] = match.Flights.date.split('-').map(Number)
            matchDateTime = new Date(year, month - 1, day)
          } else {
            // Skip matches without meaningful date information
            return acc
          }
          const rideId = match.ride_id

          // Determine if upcoming or previous (keep in upcoming with comment section for 1hr after match time)
          const oneHourAfterMatch = new Date(
            matchDateTime.getTime() + 60 * 60 * 1000,
          )
          const category = oneHourAfterMatch > now ? 'upcoming' : 'previous'

          // Initialize the ride_id array if it doesn't exist
          if (!acc[category][rideId]) {
            acc[category][rideId] = []
          }

          // Add the match to the appropriate group
          acc[category][rideId].push(match)

          return acc
        },
        { upcoming: {}, previous: {} },
      )

      const readiness: Record<
        number,
        { isReady: boolean; matchDateTime: Date | null }
      > = {}
      const readyRideIdsToPersist: number[] = []
      const rideIds = Array.from(
        new Set(matchesWithDetails.map((match) => match.ride_id)),
      )
      for (const rideId of rideIds) {
        const rideMatches = matchesWithDetails.filter(
          (match) => match.ride_id === rideId,
        )
        const firstMatch = rideMatches[0]
        let matchDateTime: Date | null = null
        if (firstMatch?.date && firstMatch?.time) {
          const [y, mo, d] = firstMatch.date.split('-').map(Number)
          const [h, min] = firstMatch.time.split(':').map(Number)
          matchDateTime = new Date(y, mo - 1, d, h, min)
        } else if (firstMatch?.Flights?.date) {
          const [y, mo, d] = firstMatch.Flights.date.split('-').map(Number)
          matchDateTime = new Date(y, mo - 1, d)
        }
        const groupReadyAt = rideMatches[0]?.group_ready_at
        const computedReady = isGroupReady(rideMatches)
        const timePassed =
          matchDateTime != null &&
          matchDateTime.getTime() + 15 * 60 * 1000 < Date.now()
        const isReady = groupReadyAt != null || computedReady || timePassed

        if (computedReady && groupReadyAt == null) {
          readyRideIdsToPersist.push(rideId)
        }

        readiness[rideId] = { isReady, matchDateTime }
      }
      setRideReadiness(readiness)
      setMatches(grouped)
      setPendingReadyRideIds(readyRideIdsToPersist)
    } catch (error) {
      console.error('Error details:', error)
      setMatches({ upcoming: {}, previous: {} })
      setRideReadiness({})
      setPendingReadyRideIds([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      void fetchMatches()
    } else {
      setLoading(false)
    }
  }, [user, fetchMatches])

  useEffect(() => {
    if (loading || pendingReadyRideIds.length === 0) return

    const rideIds = pendingReadyRideIds
    setPendingReadyRideIds([])

    void postJson<MarkGroupsReadyResponseDto>('/api/matches/mark-group-ready', {
      rideIds,
    }).catch((updateError) => {
      console.error(
        `[results] Failed to persist readiness for rides ${rideIds.join(', ')}:`,
        updateError,
      )
    })
  }, [loading, pendingReadyRideIds])

  const deleteMatch = async (rideId: number) => {
    if (!user) {
      console.error('No authenticated user found')
      return
    }

    try {
      await postJson('/api/matches/cancel', { rideId })
      await fetchMatches()
    } catch (error) {
      console.error('Error in delete operation:', error)
      throw error
    }
  }

  if (!isAuthenticated) {
    return (
      <PageContainer width="narrow">
        <PageHeader
          eyebrow="Your rides"
          title="Your matches"
          description="Sign in to view your travel matches and companions."
        />
        <SignInPrompt />
      </PageContainer>
    )
  }

  if (loading)
    return (
      <PageContainer width="narrow">
        <div className="flex items-center justify-center gap-3 py-24 text-stone">
          <Spinner label="Loading matches" />
          <span className="text-[15px]">Loading matches...</span>
        </div>
      </PageContainer>
    )

  const groupedUpcoming = groupMatchesByRideId(
    Object.values(matches.upcoming).flat(),
  )
  const groupedPrevious = groupMatchesByRideId(
    Object.values(matches.previous).flat(),
  )

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Your rides"
        title="Your matches"
        description="Connect with your travel companions and plan your journey together."
      />

      <section aria-labelledby="upcoming-heading">
        <h2
          id="upcoming-heading"
          className="mb-4 text-lg font-semibold text-navy"
        >
          Upcoming matches
        </h2>
        {Object.keys(matches.upcoming).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedUpcoming).map(([rideId, matchesForRide]) => (
              <div key={rideId} className="space-y-3">
                <MatchCard
                  matches={matchesForRide}
                  upcoming={true}
                  onDelete={deleteMatch}
                  rideId={parseInt(rideId)}
                  isGroupReady={
                    rideReadiness[parseInt(rideId)]?.isReady ?? false
                  }
                />
                <CommentSection rideId={parseInt(rideId)} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarClock}
            title="No upcoming matches found"
            description="You don't have any upcoming matches. Create a new match to get started!"
            action={<ButtonLink href="/matchForm">Request match</ButtonLink>}
          />
        )}
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        <ButtonLink href="/unmatched" variant="secondary">
          View unmatched flights
        </ButtonLink>
        <Button
          variant="ghost"
          onClick={() => setShowPrevious(!showPrevious)}
          aria-expanded={showPrevious}
          aria-controls="previous-matches"
        >
          {showPrevious ? 'Hide' : 'Show'} previous matches
          <ChevronDown
            aria-hidden
            className={cn(
              'h-[18px] w-[18px] transition-transform duration-200',
              showPrevious && 'rotate-180',
            )}
          />
        </Button>
      </div>

      {showPrevious && (
        <section id="previous-matches" className="mt-6">
          <h2 className="mb-4 text-lg font-semibold text-navy">
            Previous matches
          </h2>
          {Object.keys(matches.previous).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedPrevious).map(
                ([rideId, matchesForRide]) => (
                  <MatchCard
                    key={rideId}
                    matches={matchesForRide}
                    upcoming={false}
                    rideId={parseInt(rideId)}
                    isGroupReady={
                      rideReadiness[parseInt(rideId)]?.isReady ?? false
                    }
                  />
                ),
              )}
            </div>
          ) : (
            <EmptyState
              icon={History}
              title="No previous matches found"
              description="You haven't completed any rides yet."
            />
          )}
        </section>
      )}
    </PageContainer>
  )
}
