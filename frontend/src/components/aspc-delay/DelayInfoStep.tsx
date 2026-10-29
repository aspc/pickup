'use client'

import { useState } from 'react'

interface DelayFormNewFlight {
  airport: string
  flight_no: string
  date: string
  time: string
}

interface DelayInfoStepProps {
  /** When true, user came from "No, it changed" - show new flight summary + Try to look for a new group */
  flightChanged?: boolean
  newFlight?: DelayFormNewFlight | null
  newFlightTimeEarliest?: string
  newFlightTimeLatest?: string
  defaultDate: string
  newEtaDate: string
  newEtaTime: string
  newEtaTimeEarliest: string
  newEtaTimeLatest: string
  /** Show earliest/latest range (e.g. different day OR user changed flight) */
  showTimeRange: boolean
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
  onEarliestChange: (time: string) => void
  onLatestChange: (time: string) => void
  onFindNewMatch: () => void
  isFindNewMatchLoading?: boolean
}

export default function DelayInfoStep({
  flightChanged = false,
  newFlight = null,
  newFlightTimeEarliest = '',
  newFlightTimeLatest = '',
  defaultDate,
  newEtaDate,
  newEtaTime,
  newEtaTimeEarliest,
  newEtaTimeLatest,
  onDateChange,
  onTimeChange,
  showTimeRange,
  onEarliestChange,
  onLatestChange,
  onFindNewMatch,
  isFindNewMatchLoading = false,
}: DelayInfoStepProps) {
  const [showModal, setShowModal] = useState(false)

  const isFilled =
    flightChanged ||
    (showTimeRange
      ? Boolean(newEtaDate && newEtaTimeEarliest && newEtaTimeLatest)
      : Boolean(newEtaDate && newEtaTime))

  const handleOpenModal = () => {
    if (!isFilled) return
    setShowModal(true)
  }

  const handleConfirmFindNewMatch = () => {
    setShowModal(false)
    onFindNewMatch()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-navy">4. Delay information</h2>

      {flightChanged && newFlight ? (
        <>
          <p className="text-sm text-stone">
            Here are your new flight details. When you&apos;re ready, we&apos;ll
            remove you from your current group and try to find you a new one.
          </p>
          <div className="rounded-md border border-line bg-paper p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage-tint">
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
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">
                  {newFlight.airport} {newFlight.flight_no}
                </p>
                <p className="text-sm text-stone">
                  {new Date(newFlight.date + 'T00:00:00').toLocaleDateString(
                    'en-US',
                    {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    },
                  )}
                </p>
                <p className="text-sm text-stone">
                  {newFlightTimeEarliest && newFlightTimeLatest
                    ? `${newFlightTimeEarliest} – ${newFlightTimeLatest}`
                    : newFlight.time}
                </p>
              </div>
            </div>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenModal}
              disabled={isFindNewMatchLoading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-navy px-4 text-[15px] font-medium text-white transition-[background-color,transform] duration-150 hover:bg-navy-700 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
            >
              {isFindNewMatchLoading
                ? 'Processing…'
                : 'Try to look for a new group'}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-stone">
            When do you expect to arrive? We&apos;ll use this to find you a new
            match.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink after:ml-0.5 after:text-danger after:content-['*']">
                New estimated date
              </span>
              <input
                type="date"
                value={newEtaDate || defaultDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full rounded-md border border-line-strong bg-card px-3.5 py-2.5 text-[15px] text-ink transition-[border-color,box-shadow] duration-150 hover:border-navy-300 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25 focus-visible:ring-offset-0"
                required
              />
            </label>
            {!showTimeRange ? (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink after:ml-0.5 after:text-danger after:content-['*']">
                  New estimated time
                </span>
                <input
                  type="time"
                  value={newEtaTime}
                  onChange={(e) => onTimeChange(e.target.value)}
                  className="w-full rounded-md border border-line-strong bg-card px-3.5 py-2.5 text-[15px] text-ink transition-[border-color,box-shadow] duration-150 hover:border-navy-300 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25 focus-visible:ring-offset-0"
                  required
                />
              </label>
            ) : null}
          </div>

          {showTimeRange && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink after:ml-0.5 after:text-danger after:content-['*']">
                  Earliest Pickup Time
                </span>
                <input
                  type="time"
                  value={newEtaTimeEarliest}
                  onChange={(e) => onEarliestChange(e.target.value)}
                  className="w-full rounded-md border border-line-strong bg-card px-3.5 py-2.5 text-[15px] text-ink transition-[border-color,box-shadow] duration-150 hover:border-navy-300 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25 focus-visible:ring-offset-0"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink after:ml-0.5 after:text-danger after:content-['*']">
                  Latest Pickup Time
                </span>
                <input
                  type="time"
                  value={newEtaTimeLatest}
                  onChange={(e) => onLatestChange(e.target.value)}
                  className="w-full rounded-md border border-line-strong bg-card px-3.5 py-2.5 text-[15px] text-ink transition-[border-color,box-shadow] duration-150 hover:border-navy-300 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25 focus-visible:ring-offset-0"
                  required
                />
              </label>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenModal}
              disabled={!isFilled || isFindNewMatchLoading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-navy px-4 text-[15px] font-medium text-white transition-[background-color,transform] duration-150 hover:bg-navy-700 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
            >
              {isFindNewMatchLoading ? 'Processing…' : 'Find a new Match'}
            </button>
          </div>
        </>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex animate-overlay-in items-center justify-center bg-navy-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="find-new-match-title"
        >
          <div className="w-full max-w-sm animate-dialog-in rounded-lg bg-card p-6 shadow-overlay">
            <h3
              id="find-new-match-title"
              className="mb-3 text-lg font-semibold text-navy"
            >
              Find a new match
            </h3>
            <p className="mb-6 text-sm text-stone">
              You will be unmatched from your current group and we will try to
              find you a new matching group.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-line-strong bg-card px-4 text-[15px] font-medium text-ink transition-[background-color,transform] duration-150 hover:bg-sunken active:scale-[0.97] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmFindNewMatch}
                disabled={isFindNewMatchLoading}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-navy px-4 text-[15px] font-medium text-white transition-[background-color,transform] duration-150 hover:bg-navy-700 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
              >
                {isFindNewMatchLoading ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
