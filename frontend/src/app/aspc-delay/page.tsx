'use client'

import { Suspense } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { requestJson } from '@/utils/api'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ButtonLink } from '@/components/ui/Button'

function AspcDelayListContent() {
  const { user, isAuthenticated, signInWithGoogle } = useAuth()

  const [userRides, setUserRides] = useState<
    { ride_id: number; label: string }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchRideData = useCallback(async () => {
    if (!user) return

    try {
      const result = await requestJson<{
        success: boolean
        userRides: { ride_id: number; label: string }[]
      }>('/api/aspc-delay')

      setUserRides(result.userRides || [])
    } catch (rideError) {
      setError(
        rideError instanceof Error
          ? rideError.message
          : 'Failed to load ride data.',
      )
      setUserRides([])
      return
    }
  }, [user])

  useEffect(() => {
    if (user) {
      setLoading(true)
      setError('')
      void fetchRideData().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user, fetchRideData])

  if (!isAuthenticated) {
    return (
      <div className="relative">
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
          <div className="mx-auto max-w-md rounded-lg border border-line bg-card p-8 text-center shadow-card">
            <h1 className="mb-4 font-display text-3xl font-semibold text-navy">
              Report a Delay
            </h1>
            <p className="mb-6 text-stone">
              Sign in to report a flight delay and get rematched or a
              contingency voucher.
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

  if (userRides.length > 0) {
    return (
      <div className="relative">
        <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:pt-12">
          <h1 className="mb-6 font-display text-[32px] font-semibold leading-tight text-navy sm:text-[40px]">
            Report a Delay
          </h1>
          <p className="mb-6 text-stone">
            Select a ride to report a flight delay:
          </p>
          <div className="space-y-3">
            {userRides.map((r) => (
              <Link
                key={r.ride_id}
                href={`/aspc-delay/${r.ride_id}`}
                className="block min-h-[48px] rounded-lg border border-line bg-card p-4 shadow-card transition-colors hover:border-navy-300"
              >
                {r.label}
              </Link>
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

  if (error) {
    return (
      <div className="relative">
        <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:pt-12">
          <h1 className="mb-6 font-display text-[32px] font-semibold leading-tight text-navy sm:text-[40px]">
            Report a Delay
          </h1>
          <p className="mb-6 text-danger">{error}</p>
          <ButtonLink href="/results" variant="secondary">
            Back to Results
          </ButtonLink>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:pt-12">
        <h1 className="mb-6 font-display text-[32px] font-semibold leading-tight text-navy sm:text-[40px]">
          Report a Delay
        </h1>
        <p className="mb-6 text-stone">
          You don&apos;t have any rides. Go to the results page to view your
          matches.
        </p>
        <ButtonLink href="/results" variant="secondary">
          Back to Results
        </ButtonLink>
      </div>
    </div>
  )
}

export default function AspcDelayListPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-sage border-r-transparent" />
        </div>
      }
    >
      <AspcDelayListContent />
    </Suspense>
  )
}
