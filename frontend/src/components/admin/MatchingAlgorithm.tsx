'use client'

import SimpleRedirectButton from '@/components/buttons/SimpleRedirectButton'
import { postJson, requestJson } from '@/utils/api'
import { useEffect, useState } from 'react'

interface RideMatchServiceStatus {
  configured: boolean
  reachable: boolean
  supabaseConfigured?: boolean
  message?: string
}

interface RideMatchRider {
  user_id: string
  flight_id: number
  name: string | null
}

interface RideMatchGroup {
  ride_id: number
  bucket_key: string
  date: string
  num_riders: number
  suggested_time: string
  earliest_time: string
  latest_time: string
  considered_bags: number
  bags_total: number
  riders: RideMatchRider[]
  subsidized: boolean
  ride_type: string | null
  uber_type: string | null
}

interface UnmatchedRider {
  user_id: string
  flight_id: number
  name: string | null
  airport: string
  to_airport: boolean
  date: string
  earliest_time: string
  latest_time: string
  bucket_key: string
  reason: string
  details: Record<string, unknown>
}

interface CommitResult {
  run_id: string
  groups_inserted: number
  matches_inserted: number
  matched_flights_updated: number
  unmatched_flights_updated: number
  group_vouchers_used: number
  contingency_vouchers_used: number
  connect_cleanup_flights: number
  connect_cleanup_rides_touched: number
  idempotent_replay: boolean
}

interface RideMatchResponse {
  status: string
  run_id: string | null
  commit: CommitResult | null
  summary: {
    buckets: number
    groups: number
    matched_riders: number
    unmatched_riders: number
  }
  matches: RideMatchGroup[]
  unmatched: UnmatchedRider[]
}

const REASON_LABELS: Record<string, string> = {
  no_time_overlap: "No time overlap with other riders' windows",
  terminal_mismatch: 'Terminal mismatch with nearby riders',
  bag_capacity: 'Group would exceed bag capacity',
  dominated_by_better_pair: 'A better-matching pair took priority',
  singleton_bucket:
    'No other riders in the same airport/direction/school group',
  unknown: 'No reason recorded',
}

const humanizeReason = (reason: string): string =>
  REASON_LABELS[reason] ?? reason.replaceAll('_', ' ')

const formatTime = (value: string): string => {
  if (!value) return '—'
  const [h, m] = value.split(':')
  const hour = parseInt(h, 10)
  if (Number.isNaN(hour)) return value
  const period = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${m} ${period}`
}

const spinner = (
  <svg
    className="h-5 w-5 animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
)

export default function MatchingAlgorithm() {
  const [status, setStatus] = useState<RideMatchServiceStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<RideMatchResponse | null>(null)

  const [daysAheadStart, setDaysAheadStart] = useState('')
  const [daysAhead, setDaysAhead] = useState('10')

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await requestJson<RideMatchServiceStatus>(
          '/api/admin/matching/status',
        )
        setStatus(data)
      } catch (err) {
        console.error('Error checking algorithm service status:', err)
      } finally {
        setStatusLoading(false)
      }
    }
    loadStatus()
  }, [])

  const handleRun = async () => {
    const fromLabel = daysAheadStart
      ? `${daysAheadStart} days from today`
      : 'tomorrow'
    if (
      !confirm(
        `Run matching for riders from ${fromLabel} through ${daysAhead} days from today? This writes real ride groups to the database and consumes vouchers — it cannot be previewed or undone from here.`,
      )
    ) {
      return
    }

    setError('')
    setResult(null)

    try {
      setIsLoading(true)
      const data = await postJson<RideMatchResponse>(
        '/api/admin/matching/run',
        {
          daysAhead: daysAhead ? Number(daysAhead) : undefined,
          daysAheadStart: daysAheadStart ? Number(daysAheadStart) : undefined,
        },
      )
      setResult(data)
    } catch (err) {
      console.error('Error running matching algorithm:', err)
      setError(
        err instanceof Error ? err.message : 'Matching algorithm run failed',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const canRun =
    !!status?.configured && !!status?.reachable && !!status?.supabaseConfigured

  const fromDescription = daysAheadStart ? `${daysAheadStart}` : 'tomorrow (0)'

  if (statusLoading) {
    return (
      <div className="from-slate-50 relative min-h-screen overflow-hidden bg-gradient-to-br via-blue-50 to-indigo-100">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        <div className="relative flex min-h-screen items-center justify-center p-4">
          <div
            className="flex items-center space-x-4 rounded-2xl bg-white/80 p-8 shadow-xl backdrop-blur-sm"
            role="status"
            aria-live="polite"
          >
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-500"></div>
            <span className="text-lg font-medium text-gray-700">
              Checking algorithm service...
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Run Matching</h1>
          <SimpleRedirectButton
            label="Back to Dashboard"
            route="/admin"
            variant="cta"
          />
        </div>

        <p className="mb-8 text-sm text-gray-600">
          Match all the riders from {fromDescription} to {daysAhead} days.
        </p>

        {status && !status.configured && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            The algorithm service isn&apos;t configured on the server yet. Set{' '}
            <code>ALGORITHM_SERVICE_URL</code> and redeploy.
          </div>
        )}
        {status?.configured && !status.reachable && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {status.message || 'Could not reach the algorithm service.'}
          </div>
        )}
        {status?.configured &&
          status.reachable &&
          !status.supabaseConfigured && (
            <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              Connected to the algorithm service, but it has no database
              credentials configured, so there are no riders to match.
            </div>
          )}

        <div className="mb-8 rounded-lg bg-white shadow-md">
          <div className="border-b border-cyan-300/90 bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Match &amp; commit</h2>
            <p className="mt-1 text-sm text-teal-50">
              This writes real ride groups and consumes vouchers — there is no
              dry-run from here.
            </p>
          </div>

          <div className="p-6">
            <div className="mb-6 flex flex-wrap items-end gap-4">
              <div className="min-w-[200px]">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  From (days from today)
                </label>
                <input
                  type="number"
                  min={0}
                  value={daysAheadStart}
                  onChange={(e) => setDaysAheadStart(e.target.value)}
                  placeholder="tomorrow"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="min-w-[200px]">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Through (days from today)
                </label>
                <input
                  type="number"
                  min={0}
                  value={daysAhead}
                  onChange={(e) => setDaysAhead(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleRun}
              disabled={isLoading || !canRun}
              className={`flex items-center gap-2 rounded-lg px-6 py-3 font-medium text-white transition-all ${
                isLoading || !canRun
                  ? 'cursor-not-allowed bg-gray-400 opacity-50'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
              }`}
            >
              {isLoading ? (
                <>
                  {spinner}
                  Running...
                </>
              ) : (
                'Run Matching'
              )}
            </button>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </div>
        </div>

        {result && (
          <div>
            {!result.run_id ? (
              <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600 shadow-md">
                No unmatched riders found in this window — nothing to commit.
              </div>
            ) : (
              <div className="mb-8 rounded-lg bg-white shadow-md">
                <div className="to-emerald-500 border-b border-green-300/90 bg-gradient-to-r from-green-500 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">
                    Committed{' '}
                    {result.commit?.idempotent_replay &&
                      '(already committed — safe replay)'}
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-6">
                  {[
                    ['Groups inserted', result.commit?.groups_inserted],
                    ['Matches inserted', result.commit?.matches_inserted],
                    ['Flights matched', result.commit?.matched_flights_updated],
                    [
                      'Flights left unmatched',
                      result.commit?.unmatched_flights_updated,
                    ],
                    ['Group vouchers used', result.commit?.group_vouchers_used],
                    [
                      'Contingency vouchers used',
                      result.commit?.contingency_vouchers_used,
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {value ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8 rounded-lg bg-white shadow-md">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Committed groups ({result.matches.length})
                </h2>
              </div>
              <div className="overflow-x-auto p-6 pt-0">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Bucket</th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Pickup time</th>
                      <th className="px-3 py-2 text-left">Riders</th>
                      <th className="px-3 py-2 text-left">Bags</th>
                      <th className="px-3 py-2 text-left">Uber type</th>
                      <th className="px-3 py-2 text-left">Subsidized</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {result.matches.map((m) => (
                      <tr key={m.ride_id}>
                        <td className="px-3 py-2">{m.ride_id}</td>
                        <td className="px-3 py-2">{m.bucket_key}</td>
                        <td className="px-3 py-2">{m.date}</td>
                        <td className="px-3 py-2">
                          {formatTime(
                            m.suggested_time.includes('T')
                              ? m.suggested_time.split('T')[1]
                              : m.suggested_time,
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {m.riders.map((r) => r.name || r.user_id).join(', ')}
                        </td>
                        <td className="px-3 py-2">{m.bags_total}</td>
                        <td className="px-3 py-2">
                          {m.ride_type || m.uber_type || '—'}
                        </td>
                        <td className="px-3 py-2">
                          {m.subsidized ? (
                            <span className="font-medium text-green-700">
                              Yes
                            </span>
                          ) : (
                            'No'
                          )}
                        </td>
                      </tr>
                    ))}
                    {result.matches.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-3 py-6 text-center text-gray-500"
                        >
                          No groups formed.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg bg-white shadow-md">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Left unmatched ({result.unmatched.length})
                </h2>
              </div>
              <div className="overflow-x-auto p-6 pt-0">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Rider</th>
                      <th className="px-3 py-2 text-left">Airport</th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Window</th>
                      <th className="px-3 py-2 text-left">Why unmatched</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {result.unmatched.map((r) => (
                      <tr key={r.flight_id}>
                        <td className="px-3 py-2">{r.name || r.user_id}</td>
                        <td className="px-3 py-2">
                          {r.airport} {r.to_airport ? '(to)' : '(from)'}
                        </td>
                        <td className="px-3 py-2">{r.date}</td>
                        <td className="px-3 py-2">
                          {formatTime(r.earliest_time)} –{' '}
                          {formatTime(r.latest_time)}
                        </td>
                        <td className="px-3 py-2">
                          {humanizeReason(r.reason)}
                        </td>
                      </tr>
                    ))}
                    {result.unmatched.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-6 text-center text-gray-500"
                        >
                          Everyone was matched.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
