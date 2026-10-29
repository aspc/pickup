'use client'

import { Briefcase, Calendar, Clock, Flag, Info, Luggage } from 'lucide-react'
import type { CSSProperties } from 'react'

import { useGroupsActionsContext, useGroupsUiContext } from './context'
import {
  calculateBagUnits,
  determineUberType,
  formatTimeRange,
  matchDatetimeFromEarliest,
} from './utils'

export default function CreateGroupPanel() {
  const { createNewGroup, removeRiderFromNewGroup } = useGroupsActionsContext()
  const {
    autoCalculateError,
    errorMessage,
    isCreatingGroup,
    isSubsidized,
    newGroupContingencyVoucher,
    newGroupDate,
    newGroupTime,
    newGroupVoucher,
    selectedRidersForNewGroup,
    setAutoCalculateError,
    setIsSubsidized,
    setNewGroupContingencyVoucher,
    setNewGroupDate,
    setNewGroupTime,
    setNewGroupVoucher,
  } = useGroupsUiContext()

  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-medium text-ink">
          Selected Riders ({selectedRidersForNewGroup.length}/6)
        </label>
        <div className="max-h-40 space-y-2 overflow-y-auto">
          {selectedRidersForNewGroup.length === 0 ? (
            <p className="text-sm text-stone">
              No riders selected. Select from Corral or Unmatched.
            </p>
          ) : (
            selectedRidersForNewGroup.map((rider: any) => (
              <div
                key={`${rider.user_id}-${rider.flight_id}`}
                className="flex items-center justify-between rounded border border-line bg-paper p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
                    {rider.name}
                    {rider.original_unmatched && (
                      <span title="Originally unmatched">
                        <Flag className="h-3 w-3 flex-shrink-0 text-warning" />
                      </span>
                    )}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center rounded-full bg-sage-tint px-2 py-0.5 text-xs font-medium text-sage-strong">
                      {rider.to_airport ? 'TO' : 'FROM'} {rider.airport}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="group relative flex items-center gap-1">
                        <Luggage className="h-3 w-3 text-stone" />
                        <span className="text-xs text-stone">
                          {rider.checked_bags}
                        </span>
                        <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform whitespace-nowrap rounded bg-navy px-2 py-1 text-xs text-white group-hover:block">
                          Checked Bags (2 Units Each)
                          <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-navy"></div>
                        </div>
                      </div>
                      <div className="group relative flex items-center gap-1">
                        <Briefcase className="h-3 w-3 text-stone" />
                        <span className="text-xs text-stone">
                          {rider.carry_on_bags}
                        </span>
                        <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform whitespace-nowrap rounded bg-navy px-2 py-1 text-xs text-white group-hover:block">
                          Carry-On Bags (1 Unit Each)
                          <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-navy"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-stone">{rider.date}</p>
                  <p className="text-xs text-stone">
                    {formatTimeRange(rider.time_range)}
                  </p>
                </div>
                <button
                  onClick={() => removeRiderFromNewGroup(rider.flight_id)}
                  className="ml-2 text-danger hover:text-danger"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium text-ink">
            Date <span className="text-danger">*</span>
          </label>
          {selectedRidersForNewGroup.length >= 2 && (
            <div className="flex flex-col items-end">
              <button
                type="button"
                onClick={() => {
                  const calculated = matchDatetimeFromEarliest(
                    selectedRidersForNewGroup,
                  )
                  if (calculated) {
                    setNewGroupDate(calculated.date)
                    const [hours, minutes] = calculated.time.split(':')
                    setNewGroupTime(`${hours}:${minutes || '00'}`)
                    setAutoCalculateError(null)
                  } else {
                    setAutoCalculateError(
                      'No valid time overlap found for selected riders',
                    )
                    setTimeout(() => setAutoCalculateError(null), 3000)
                  }
                }}
                className="text-xs text-sage underline hover:text-sage-strong"
              >
                Auto-calculate from riders
              </button>
              {autoCalculateError && (
                <p className="mt-1 text-xs text-danger">{autoCalculateError}</p>
              )}
            </div>
          )}
        </div>
        <div className="relative">
          <input
            type="date"
            value={newGroupDate}
            onChange={(e) => setNewGroupDate(e.target.value)}
            className="w-full rounded-lg border border-line-strong bg-card px-3 py-2 pr-10 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage/30 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
            style={
              {
                WebkitAppearance: 'none',
              } as CSSProperties
            }
          />
          <button
            type="button"
            onClick={(e) => {
              const input = e.currentTarget
                .previousElementSibling as HTMLInputElement
              input?.showPicker?.()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-light transition-colors hover:text-sage"
            title="Open calendar"
          >
            <Calendar className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Time <span className="text-danger">*</span>
        </label>
        <div className="relative">
          <input
            type="time"
            value={newGroupTime}
            onChange={(e) => setNewGroupTime(e.target.value)}
            className="w-full rounded-lg border border-line-strong bg-card px-3 py-2 pr-10 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage/30 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
            style={
              {
                WebkitAppearance: 'none',
              } as CSSProperties
            }
          />
          <button
            type="button"
            onClick={(e) => {
              const input = e.currentTarget
                .previousElementSibling as HTMLInputElement
              input?.showPicker?.()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-light transition-colors hover:text-sage"
            title="Open time picker"
          >
            <Clock className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Group Voucher
        </label>
        <input
          type="text"
          value={newGroupVoucher}
          onChange={(e) => setNewGroupVoucher(e.target.value)}
          placeholder="Optional"
          className="w-full rounded-lg border border-line-strong bg-card px-3 py-2 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage/30"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center gap-2">
          <label className="block text-sm font-medium text-ink">
            Contingency Vouchers (per rider)
          </label>
          <div className="group relative">
            <Info className="h-4 w-4 text-stone-light" />
            <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden w-64 -translate-x-1/2 transform rounded bg-navy px-3 py-2 text-xs text-white group-hover:block">
              Enter comma-separated vouchers (one per rider). Order should match
              selected riders. Example: &quot;VOUCHER1, VOUCHER2&quot;
              <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-navy"></div>
            </div>
          </div>
        </div>
        <input
          type="text"
          value={newGroupContingencyVoucher}
          onChange={(e) => setNewGroupContingencyVoucher(e.target.value)}
          placeholder={`Optional (e.g., "VOUCHER1, VOUCHER2" for ${selectedRidersForNewGroup.length} riders)`}
          className="w-full rounded-lg border border-line-strong bg-card px-3 py-2 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage/30"
        />
        {selectedRidersForNewGroup.length > 0 && (
          <p className="mt-1 text-xs text-stone">
            {selectedRidersForNewGroup.length} rider
            {selectedRidersForNewGroup.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isSubsidized"
          checked={isSubsidized}
          onChange={(e) => setIsSubsidized(e.target.checked)}
          className="h-4 w-4 rounded border-line-strong text-sage focus:ring-sage/30"
        />
        <label htmlFor="isSubsidized" className="ml-2 text-sm text-ink">
          Is Subsidized
        </label>
      </div>

      {selectedRidersForNewGroup.length > 0 && (
        <div className="rounded border border-line bg-paper p-3">
          <p className="mb-1 text-xs font-medium text-ink">Group Preview:</p>
          <p className="text-xs text-stone">
            Size: {selectedRidersForNewGroup.length} riders
          </p>
          <p className="text-xs text-stone">
            Bag Units: {calculateBagUnits(selectedRidersForNewGroup)}
          </p>
          <p className="text-xs text-stone">
            Uber Type:{' '}
            {determineUberType(
              selectedRidersForNewGroup.length,
              calculateBagUnits(selectedRidersForNewGroup),
            ) || 'Invalid'}
          </p>
        </div>
      )}

      <button
        onClick={createNewGroup}
        disabled={
          isCreatingGroup ||
          selectedRidersForNewGroup.length < 2 ||
          selectedRidersForNewGroup.length > 6 ||
          !newGroupDate ||
          !newGroupTime
        }
        className="w-full rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-700 hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isCreatingGroup ? 'Creating...' : 'Create Group'}
      </button>

      {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}
    </>
  )
}
