import { withAdminRoute } from '@/lib/server/auth'
import { NextResponse } from 'next/server'

export const GET = withAdminRoute(async () => {
  const serviceUrl = process.env.ALGORITHM_SERVICE_URL

  if (!serviceUrl) {
    return NextResponse.json({
      configured: false,
      reachable: false,
      message: 'ALGORITHM_SERVICE_URL is not set on the server.',
    })
  }

  const apiKey = process.env.ALGORITHM_SERVICE_API_KEY

  try {
    const response = await fetch(serviceUrl, {
      headers: apiKey ? { 'X-API-Key': apiKey } : undefined,
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      return NextResponse.json({
        configured: true,
        reachable: false,
        message: `Algorithm service responded with ${response.status}.`,
      })
    }

    const data = await response.json()

    return NextResponse.json({
      configured: true,
      reachable: true,
      supabaseConfigured: Boolean(data?.supabase_configured),
    })
  } catch (error) {
    console.error('Algorithm service unreachable:', error)
    return NextResponse.json({
      configured: true,
      reachable: false,
      message: 'Could not reach the algorithm service.',
    })
  }
})
