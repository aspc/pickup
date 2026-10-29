import { badRequestJson, withAdminRoute } from '@/lib/server/auth'
import { NextResponse } from 'next/server'

export const POST = withAdminRoute(async (request) => {
  const serviceUrl = process.env.ALGORITHM_SERVICE_URL

  if (!serviceUrl) {
    return NextResponse.json(
      { error: 'ALGORITHM_SERVICE_URL is not configured on the server.' },
      { status: 503 },
    )
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return badRequestJson('Invalid JSON body.')
  }

  const { daysAhead, daysAheadStart } = body || {}
  if (daysAhead !== undefined && typeof daysAhead !== 'number') {
    return badRequestJson('daysAhead must be a number.')
  }
  if (daysAheadStart !== undefined && typeof daysAheadStart !== 'number') {
    return badRequestJson('daysAheadStart must be a number.')
  }

  const apiKey = process.env.ALGORITHM_SERVICE_API_KEY

  try {
    // /run matches riders from the database and commits the result to
    // Supabase for real (Rides/Matches, voucher consumption) — unlike the
    // old /match-based preview, this writes production data.
    const response = await fetch(`${serviceUrl}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      },
      body: JSON.stringify({
        days_ahead: daysAhead,
        days_ahead_start: daysAheadStart,
      }),
      signal: AbortSignal.timeout(60000),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.detail || 'The algorithm service rejected the request.',
        },
        { status: response.status },
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Algorithm service run failed:', error)
    return NextResponse.json(
      { error: 'Failed to reach the algorithm service.' },
      { status: 502 },
    )
  }
})
