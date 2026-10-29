'use client'

import { useState } from 'react'
import type { DelayReasonKey } from './types'
import { REASON_FOR_DELAY_LABELS } from './types'

const REASON_DESCRIPTIONS: Record<DelayReasonKey, string> = {
  airline_delay: 'Flight delayed by airline',
  missed_connection: 'Missed a connecting flight',
  baggage_delay: 'Waiting for luggage',
  custom: 'Other - enter your reason below',
}

const ReasonIcon = ({ reason }: { reason: DelayReasonKey }) => {
  const className = 'h-5 w-5 shrink-0 text-sage sm:h-6 sm:w-6'
  switch (reason) {
    case 'airline_delay':
      return (
        <svg
          className={className}
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
      )
    case 'missed_connection':
      return (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      )
    case 'baggage_delay':
      return (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      )
    case 'custom':
      return (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )
    default:
      return null
  }
}

interface ReasonForDelayStepProps {
  selectedReason: DelayReasonKey | null
  customReasonText: string
  onSelect: (reason: DelayReasonKey) => void
  onCustomTextChange: (text: string) => void
  onContinue: () => void
}

export default function ReasonForDelayStep({
  selectedReason,
  customReasonText,
  onSelect,
  onCustomTextChange,
  onContinue,
}: ReasonForDelayStepProps) {
  const [showCustomInput, setShowCustomInput] = useState(
    selectedReason === 'custom',
  )

  const handleSelect = (reason: DelayReasonKey) => {
    onSelect(reason)
    if (reason === 'custom') setShowCustomInput(true)
    else setShowCustomInput(false)
  }

  const canContinue =
    selectedReason &&
    (selectedReason !== 'custom' || customReasonText.trim().length > 0)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-navy">3. Reason for delay</h2>

      <p className="text-sm text-stone">
        Select the reason that best describes your delay.
      </p>

      <div className="space-y-3">
        {(
          [
            'airline_delay',
            'missed_connection',
            'baggage_delay',
            'custom',
          ] as const
        ).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleSelect(key)}
            className={`flex w-full flex-col gap-1 rounded-lg border p-4 text-left transition-[border-color,background-color,box-shadow] duration-150 sm:flex-row sm:items-center sm:gap-4 ${
              selectedReason === key
                ? 'border-sage bg-sage-tint ring-1 ring-sage'
                : 'border-line-strong bg-card hover:border-navy-300'
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-tint">
              <ReasonIcon reason={key} />
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="font-semibold text-ink">
                {REASON_FOR_DELAY_LABELS[key]}
              </span>
              <span className="text-sm text-stone">
                {REASON_DESCRIPTIONS[key]}
              </span>
            </span>
          </button>
        ))}
      </div>

      {showCustomInput && (
        <div className="rounded-md border border-line bg-paper p-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Custom reason
            </span>
            <textarea
              value={customReasonText}
              onChange={(e) => onCustomTextChange(e.target.value)}
              placeholder="Describe your delay..."
              rows={3}
              className="w-full rounded-md border border-line-strong bg-card px-3.5 py-2.5 text-[15px] text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-stone-light hover:border-navy-300 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25 focus-visible:ring-offset-0"
            />
          </label>
        </div>
      )}

      {canContinue && (
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-navy px-4 text-[15px] font-medium text-white transition-[background-color,transform] duration-150 hover:bg-navy-700 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
        >
          Continue
        </button>
      )}
    </div>
  )
}
