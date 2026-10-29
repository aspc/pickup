'use client'

import { postJson, requestJson } from '@/utils/api'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Inbox } from 'lucide-react'

import { SignInPrompt } from '@/components/SignInPrompt'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'
import { RideTicket } from '@/components/ui/RideTicket'
import { Spinner } from '@/components/ui/Spinner'
import { formatTime12Hour } from '@/utils/formatTime'

type IncomingMatchRequest = {
  id: string
  sender_flight?: {
    flight_id: number
    airport: string | null
    earliest_time: string | null
    latest_time: string | null
    date: string | null
    user_id: string | null
    to_airport: boolean | null
    Users?: {
      firstname: string | null
      lastname: string | null
    } | null
  } | null
}

export default function MatchRequestsPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [requests, setRequests] = useState<IncomingMatchRequest[]>([])

  const load = useCallback(async () => {
    if (!user) {
      console.error('User not authenticated')
      return
    }

    try {
      const result = await requestJson<{
        success: boolean
        requests: IncomingMatchRequest[]
      }>('/api/match-requests/incoming')

      setRequests(result.requests || [])
    } catch (fetchError) {
      console.error('Error fetching match requests:', fetchError)
      return
    }
  }, [user])

  useEffect(() => {
    if (user) {
      void load()
    }
  }, [user, load])

  const handleAccept = async (req: any) => {
    try {
      await postJson('/api/match-requests/accept', { id: req.id })
      setRequests((prev) => prev.filter((r) => r.id !== req.id))
    } catch (error) {
      console.error('Failed to accept request:', error)
    }
  }

  const handleReject = async (id: string) => {
    try {
      await postJson('/api/match-requests/reject', { id })
      setRequests((prev) => prev.filter((r) => r.id !== id))
    } catch (error) {
      console.error('Failed to reject request:', error)
    }
  }

  const header = (
    <PageHeader
      eyebrow="Find a group"
      title="Incoming match requests"
      description="Students who want to share a ride with you."
    />
  )

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <PageContainer width="narrow">
        {header}
        <div className="flex items-center justify-center gap-3 py-16 text-stone">
          <Spinner />
          <span className="text-[15px]">Loading...</span>
        </div>
      </PageContainer>
    )
  }

  // Show login prompt for unauthenticated users
  if (!isAuthenticated || !user) {
    return (
      <PageContainer width="narrow">
        {header}
        <SignInPrompt />
      </PageContainer>
    )
  }

  return (
    <PageContainer width="narrow">
      {header}
      {requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No new requests."
          action={
            <ButtonLink href="/unmatched" variant="secondary">
              Browse unmatched flights
            </ButtonLink>
          }
        />
      ) : (
        <ul className="space-y-4">
          {requests.map((req) => (
            <li key={req.id}>
              <RideTicket
                date={req.sender_flight?.date ?? null}
                time={null}
                airport={req.sender_flight?.airport ?? ''}
                toAirport={Boolean(req.sender_flight?.to_airport)}
                status="waiting"
                statusLabel="Request"
                stub={
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="accent"
                      onClick={() => handleAccept(req)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="danger-ghost"
                      onClick={() => handleReject(req.id)}
                    >
                      Reject
                    </Button>
                  </div>
                }
              >
                <p className="font-semibold text-navy">
                  {req.sender_flight?.Users?.firstname}{' '}
                  {req.sender_flight?.Users?.lastname} wants to ride with you.
                </p>
                <p className="mt-1 text-sm text-stone">
                  Earliest{' '}
                  {formatTime12Hour(req.sender_flight?.earliest_time ?? '')} ·
                  Latest{' '}
                  {formatTime12Hour(req.sender_flight?.latest_time ?? '')}
                </p>
              </RideTicket>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  )
}
