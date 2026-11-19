'use client'

import type { DelayFormCurrentFlight } from './types'

interface FlightConfirmStepProps {
  currentFlight: DelayFormCurrentFlight | null
  onConfirmSame: () => void
  onConfirmChanged: () => void
}

export default function FlightConfirmStep({
  currentFlight,
  onConfirmSame,
  onConfirmChanged,
}: FlightConfirmStepProps) {
  const direction = currentFlight?.to_airport
    ? 'Departing (School → Airport)'
    : 'Arriving (Airport → School)'
  const displayDate = currentFlight?.date
    ? new Date(currentFlight.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-navy">
        1. Confirm your flight
      </h2>

      {currentFlight && (
        <div className="flex flex-col gap-4 rounded-md border border-line bg-paper p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage-tint">
              <svg
                className="h-6 w-6 text-sage sm:h-7 sm:w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">
                {currentFlight.airline_iata} {currentFlight.flight_no}
              </p>
              <p className="text-sm text-stone">{direction}</p>
              <p className="mt-1 text-sm text-stone">
                {currentFlight.airport} · {displayDate}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={onConfirmSame}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-navy px-4 text-[15px] font-medium text-white transition-[background-color,transform] duration-150 hover:bg-navy-700 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 sm:w-auto sm:flex-1"
            >
              Yes, it is still my flight
            </button>
            <button
              type="button"
              onClick={onConfirmChanged}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-warning/30 bg-warning-tint px-4 text-[15px] font-medium text-warning transition-[background-color,transform] duration-150 hover:border-warning/60 active:scale-[0.97] sm:w-auto sm:flex-1"
            >
              No, it changed
            </button>
          </div>
        </div>
      )}

      {!currentFlight && (
        <p className="rounded-md border border-warning/20 bg-warning-tint p-4 text-sm text-ink">
          Unable to load your flight. Please go back to Results and try again.
        </p>
      )}
    </div>
  )
}
