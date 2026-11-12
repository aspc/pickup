'use client'

import {
  Briefcase,
  Clock,
  Flag,
  Lock,
  Luggage,
  Pencil,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Unlock,
} from 'lucide-react'
import type { DragEvent } from 'react'

import { noShowTooltip } from '@/utils/adminMatchNoShows'

import {
  useGroupsActionsContext,
  useGroupsDataContext,
  useGroupsUiContext,
} from './context'
import {
  calculateBagUnits,
  calculateGroupTimeRange,
  formatTime,
  formatTimeRange,
  formatUberTypeDisplay,
  formatVoucher,
  getCapacityBarColor,
  getMaxBagUnits,
  getUberType,
  isDatePassed,
  isGroupSubsidized,
  validateTimeCompatibility,
} from './utils'

export default function MatchedGroupsPanel() {
  const {
    handleAddFromCorral,
    handleAddToCorral,
    handleRemoveFromGroupToUnmatched,
    handleSelectFromCorral,
    openEditGroupOverrides,
    openEditRider,
    openEditTime,
    openEditVoucher,
    setCorralRiders,
    setUnmatchedRiders,
    toggleGroupExpanded,
  } = useGroupsActionsContext()
  const { corralRiders, groups, sortedGroups, unmatchedRiders } =
    useGroupsDataContext()
  const {
    dragOverGroupId,
    draggedRider,
    expandedGroups,
    recentlyAddedToNewGroup,
    selectedRidersForNewGroup,
    setDragOverGroupId,
    setDraggedRider,
    setTimeConflictModal,
  } = useGroupsUiContext()

  const clearDragState = () => {
    setDraggedRider(null)
    setDragOverGroupId(null)
  }

  const handleDropToGroup = async (group: any) => {
    setDragOverGroupId(null)
    if (!draggedRider) return

    const riderAlreadyInGroup = group.riders.some(
      (rider: any) => rider.flight_id === draggedRider.flight_id,
    )

    if (riderAlreadyInGroup) {
      setDraggedRider(null)
      return
    }

    const corralRider = corralRiders.find(
      (rider: any) => rider.flight_id === draggedRider.flight_id,
    )
    const isFromCorral = !!corralRider
    const isFromUnmatched = unmatchedRiders.some(
      (rider: any) => rider.flight_id === draggedRider.flight_id,
    )

    const addDraggedRiderToGroup = async (skipValidation = false) => {
      const sourceGroup = groups.find((candidateGroup: any) =>
        candidateGroup.riders.some(
          (rider: any) => rider.flight_id === draggedRider.flight_id,
        ),
      )
      const isFromGroup = !!sourceGroup && sourceGroup.ride_id !== group.ride_id

      if (isFromGroup) {
        await handleSelectFromCorral(
          draggedRider,
          group,
          skipValidation,
          sourceGroup.ride_id,
        )
      } else if (isFromCorral) {
        const isOriginalGroup =
          corralRider?.originGroupId === group.ride_id &&
          corralRider?.originType === 'group'

        if (isOriginalGroup) {
          setCorralRiders((prev: any[]) =>
            prev.filter((rider) => rider.flight_id !== draggedRider.flight_id),
          )
          clearDragState()
          return
        }

        await handleSelectFromCorral(draggedRider, group, skipValidation)
      } else if (isFromUnmatched) {
        await handleSelectFromCorral(draggedRider, group, skipValidation)
        setUnmatchedRiders((prev: any[]) =>
          prev.filter((rider) => rider.flight_id !== draggedRider.flight_id),
        )
      }

      setDraggedRider(null)
    }

    const timeCompatible = validateTimeCompatibility(group, draggedRider)
    if (!timeCompatible) {
      setTimeConflictModal({
        rider: draggedRider,
        group,
        onConfirm: async () => {
          await addDraggedRiderToGroup(true)
          clearDragState()
          setTimeConflictModal(null)
        },
      })
      return
    }

    await addDraggedRiderToGroup()
    clearDragState()
  }

  const handleGroupDragLeave = (
    event: DragEvent<HTMLDivElement>,
    rideId: number,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      if (dragOverGroupId === rideId) {
        setDragOverGroupId(null)
      }
    }
  }

  if (sortedGroups.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-line-strong bg-card p-12 text-center">
        <p className="text-stone">No groups found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedGroups.map((group: any) => {
        const isExpanded = expandedGroups.has(group.ride_id)
        const totalBagUnits = calculateBagUnits(group.riders)
        const riderCount = group.riders.length
        const datePassed = isDatePassed(group.date)
        const hasManualOverrides =
          group.subsidized_override || group.uber_type_override

        return (
          <div
            key={group.ride_id}
            className={`overflow-hidden rounded-lg bg-card shadow-card transition-colors ${
              dragOverGroupId === group.ride_id && draggedRider
                ? 'bg-sage-tint ring-2 ring-sage/40'
                : ''
            }`}
            onDragOver={(event) => {
              event.preventDefault()
              if (draggedRider) {
                event.dataTransfer.dropEffect = 'move'
                setDragOverGroupId(group.ride_id)
              } else {
                event.dataTransfer.dropEffect = 'none'
              }
            }}
            onDragLeave={(event) => handleGroupDragLeave(event, group.ride_id)}
            onDrop={async (event) => {
              event.preventDefault()
              event.stopPropagation()
              await handleDropToGroup(group)
            }}
          >
            <div
              className="flex cursor-pointer items-center justify-between border-b border-line bg-card p-4 transition-colors hover:bg-paper"
              onClick={() => toggleGroupExpanded(group.ride_id)}
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="font-semibold text-ink">
                      Group #{group.ride_id}
                    </p>
                    {datePassed && (
                      <span className="rounded-full bg-danger-tint px-2 py-0.5 text-xs font-semibold text-danger">
                        Past Date
                      </span>
                    )}
                    {(() => {
                      const flaggedRiders = group.riders.filter(
                        (rider: any) => rider.no_show,
                      )
                      if (flaggedRiders.length === 0) return null

                      const reporterIds = new Set<string>()
                      for (const rider of flaggedRiders) {
                        for (const id of rider.no_show?.reporterUserIds ?? []) {
                          reporterIds.add(id)
                        }
                      }

                      const distinctReporterCount = reporterIds.size
                      const flaggedCount = flaggedRiders.length

                      return (
                        <span
                          className="max-w-[20rem] rounded-full bg-danger-tint px-2.5 py-0.5 text-xs font-medium text-danger ring-1 ring-danger/40"
                          title={`${flaggedCount} rider(s) in this group were reported missing on ASPC Ready. ${distinctReporterCount} distinct rider(s) filed those reports. Red/orange flags on names = delay log status.`}
                        >
                          {flaggedCount} rider{flaggedCount === 1 ? '' : 's'}{' '}
                          reported missing (By {distinctReporterCount})
                        </span>
                      )
                    })()}
                  </div>
                  <p className="hidden text-sm text-stone md:block">
                    {group.date} •{' '}
                    {group.match_time ? (
                      <>
                        {formatTime(group.match_time)}
                        <span className="ml-1 text-xs italic text-stone">
                          ({formatTimeRange(group.time_range)})
                        </span>
                      </>
                    ) : (
                      formatTimeRange(calculateGroupTimeRange(group.riders))
                    )}
                  </p>
                  <div className="space-y-0.5 text-sm text-stone md:hidden">
                    <p>{group.date}</p>
                    <p>
                      {group.match_time ? (
                        <>
                          {formatTime(group.match_time)}
                          <span className="ml-1 text-xs italic text-stone">
                            ({formatTimeRange(group.time_range)})
                          </span>
                        </>
                      ) : (
                        formatTimeRange(calculateGroupTimeRange(group.riders))
                      )}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <p className="text-xs text-stone">
                      Uber Voucher:{' '}
                      {group.group_voucher ? (
                        <span className="font-bold text-ink">
                          {formatVoucher(group.group_voucher)}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </p>
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        openEditVoucher(group)
                      }}
                      className="flex items-center text-stone transition-colors hover:text-sage"
                      title="Edit voucher"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center gap-2">
                <div className="hidden items-center gap-2 md:flex">
                  <span className="rounded-full bg-sage-tint px-3 py-1 text-xs font-semibold text-sage-strong">
                    {riderCount} {riderCount === 1 ? 'rider' : 'riders'}
                  </span>
                  <span
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      group.to_airport
                        ? 'bg-navy-50 text-navy'
                        : 'bg-navy-50 text-navy'
                    }`}
                  >
                    {group.to_airport ? (
                      <>
                        <PlaneTakeoff className="h-3 w-3" />
                        TO {group.airport}
                      </>
                    ) : (
                      <>
                        <PlaneLanding className="h-3 w-3" />
                        FROM {group.airport}
                      </>
                    )}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      (group.is_subsidized ??
                      isGroupSubsidized(group.airport, riderCount))
                        ? 'bg-sage-tint text-sage-strong'
                        : 'bg-sunken text-ink'
                    }`}
                  >
                    {(group.is_subsidized ??
                    isGroupSubsidized(group.airport, riderCount))
                      ? 'Subsidized'
                      : 'Not Subsidized'}
                  </span>
                  <span className="rounded-full bg-navy-100 px-3 py-1 text-xs font-semibold text-navy">
                    {formatUberTypeDisplay(
                      group.uber_type,
                      getUberType(riderCount),
                    )}
                  </span>
                </div>

                <div className="flex flex-col gap-1 md:hidden">
                  <div className="flex flex-col gap-1">
                    <span className="w-fit rounded-full bg-sage-tint px-2 py-0.5 text-xs font-semibold text-sage-strong">
                      {riderCount} {riderCount === 1 ? 'rider' : 'riders'}
                    </span>
                    <span
                      className={`flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        group.to_airport
                          ? 'bg-navy-50 text-navy'
                          : 'bg-navy-50 text-navy'
                      }`}
                    >
                      {group.to_airport ? (
                        <>
                          <PlaneTakeoff className="h-3 w-3" />
                          TO {group.airport}
                        </>
                      ) : (
                        <>
                          <PlaneLanding className="h-3 w-3" />
                          FROM {group.airport}
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span
                      className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${
                        (group.is_subsidized ??
                        isGroupSubsidized(group.airport, riderCount))
                          ? 'bg-sage-tint text-sage-strong'
                          : 'bg-sunken text-ink'
                      }`}
                    >
                      {(group.is_subsidized ??
                      isGroupSubsidized(group.airport, riderCount))
                        ? 'Subsidized'
                        : 'Not Subsidized'}
                    </span>
                    <span className="w-fit rounded-full bg-navy-100 px-2 py-0.5 text-xs font-semibold text-navy">
                      {formatUberTypeDisplay(
                        group.uber_type,
                        getUberType(riderCount),
                      )}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    if (!datePassed) {
                      openEditTime(group)
                    }
                  }}
                  className="rounded p-1.5 text-stone hover:bg-line hover:text-ink"
                  title="Edit group time"
                >
                  <Clock className="h-5 w-5" />
                </button>

                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    openEditGroupOverrides(group)
                  }}
                  className={`rounded p-1.5 transition-colors ${
                    hasManualOverrides
                      ? 'text-warning hover:bg-warning-tint hover:text-warning'
                      : 'text-stone hover:bg-line hover:text-ink'
                  }`}
                  title={
                    hasManualOverrides
                      ? 'Locked: manual values (click to unlock or change)'
                      : 'Unlocked: auto-updates on add/move (click to lock)'
                  }
                >
                  {hasManualOverrides ? (
                    <Lock className="h-5 w-5" />
                  ) : (
                    <Unlock className="h-5 w-5" />
                  )}
                </button>

                <svg
                  className={`h-5 w-5 flex-shrink-0 text-stone transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            <div className="border-b border-line bg-card px-4 py-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-stone">
                  Bag Units: {totalBagUnits}/
                  {group.uber_type?.toLowerCase() === 'connect'
                    ? 'unlimited'
                    : getMaxBagUnits(riderCount)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full ${getCapacityBarColor(totalBagUnits, group.uber_type)} transition-all`}
                  style={{
                    width:
                      group.uber_type?.toLowerCase() === 'connect'
                        ? '25%'
                        : `${Math.min((totalBagUnits / getMaxBagUnits(riderCount)) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            {isExpanded && (
              <div
                className={`p-4 transition-colors ${
                  dragOverGroupId === group.ride_id && draggedRider
                    ? 'bg-sage-tint'
                    : ''
                }`}
                onDragOver={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  if (draggedRider) {
                    event.dataTransfer.dropEffect = 'move'
                    setDragOverGroupId(group.ride_id)
                  } else {
                    event.dataTransfer.dropEffect = 'none'
                  }
                }}
                onDragLeave={(event) =>
                  handleGroupDragLeave(event, group.ride_id)
                }
                onDrop={async (event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  await handleDropToGroup(group)
                }}
              >
                <button
                  onClick={() => handleAddFromCorral(group)}
                  disabled={corralRiders.length === 0}
                  className={`mb-3 text-sm ${
                    corralRiders.length === 0
                      ? 'cursor-not-allowed text-stone-light'
                      : 'text-sage underline hover:text-sage-strong'
                  }`}
                >
                  Add from corral
                </button>
                {(() => {
                  const activeRiders = group.riders
                  const corralRidersForGroup = corralRiders.filter(
                    (rider: any) =>
                      rider.originGroupId === group.ride_id &&
                      rider.originType === 'group',
                  )
                  const allRiders = [...activeRiders, ...corralRidersForGroup]

                  if (allRiders.length === 0) {
                    return (
                      <div className="rounded-lg border-2 border-dashed border-line-strong p-8 text-center">
                        <p className="text-stone">Drop riders here</p>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-2">
                      {allRiders.map((rider: any) => {
                        const isBeingDragged =
                          draggedRider?.flight_id === rider.flight_id
                        const isInCorral = corralRiders.some(
                          (candidateRider: any) =>
                            candidateRider.flight_id === rider.flight_id,
                        )
                        const riderDatePassed = isDatePassed(rider.date)
                        const isSelectedForNewGroup =
                          selectedRidersForNewGroup.some(
                            (selectedRider: any) =>
                              selectedRider.flight_id === rider.flight_id,
                          )
                        const isRecentlyAdded = recentlyAddedToNewGroup.has(
                          String(rider.flight_id),
                        )

                        return (
                          <div
                            key={`${rider.user_id}-${rider.flight_id}`}
                            className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
                              riderDatePassed
                                ? 'border border-danger/30 bg-line hover:bg-line'
                                : 'border-line bg-card'
                            } ${
                              isBeingDragged
                                ? 'bg-sunken opacity-30'
                                : isInCorral ||
                                    isSelectedForNewGroup ||
                                    isRecentlyAdded
                                  ? 'cursor-not-allowed bg-sunken opacity-40'
                                  : !riderDatePassed
                                    ? 'hover:bg-paper'
                                    : ''
                            }`}
                            draggable={!isInCorral}
                            onDragStart={() => {
                              if (!isInCorral) {
                                setDraggedRider(rider)
                              }
                            }}
                            onDragEnd={() => {
                              if (draggedRider?.flight_id === rider.flight_id) {
                                setDraggedRider(null)
                              }
                            }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <p className="flex items-center gap-1.5 font-medium text-ink">
                                    {rider.name}
                                    {rider.original_unmatched && (
                                      <span title="Originally unmatched">
                                        <Flag className="h-3.5 w-3.5 flex-shrink-0 text-warning" />
                                      </span>
                                    )}
                                    {rider.no_show && (
                                      <span
                                        title={noShowTooltip(rider.no_show)}
                                        className="inline-flex items-center"
                                      >
                                        <Flag
                                          className={`h-3.5 w-3.5 flex-shrink-0 ${
                                            rider.no_show.flag === 'orange'
                                              ? 'text-warning'
                                              : 'text-danger'
                                          }`}
                                        />
                                      </span>
                                    )}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <div className="group relative flex items-center gap-1">
                                      <Luggage className="h-4 w-4 text-stone" />
                                      <span className="text-sm text-stone">
                                        {rider.checked_bags}
                                      </span>
                                      <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform whitespace-nowrap rounded bg-navy px-2 py-1 text-xs text-white group-hover:block">
                                        Checked Bags (2 Units Each)
                                        <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-navy"></div>
                                      </div>
                                    </div>
                                    <div className="group relative flex items-center gap-1">
                                      <Briefcase className="h-4 w-4 text-stone" />
                                      <span className="text-sm text-stone">
                                        {rider.carry_on_bags}
                                      </span>
                                      <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform whitespace-nowrap rounded bg-navy px-2 py-1 text-xs text-white group-hover:block">
                                        Carry-On Bags (1 Unit Each)
                                        <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-navy"></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-sm text-stone">
                                  {rider.phone}
                                  {rider.phone !== '[Hidden]' &&
                                    rider.sms_opt_in !== true && (
                                      <span className="text-danger">
                                        {' '}
                                        (SMS opt-out)
                                      </span>
                                    )}
                                </p>
                                <div className="mt-1 flex items-center gap-3 text-sm text-stone">
                                  {rider.airline_iata && rider.flight_no && (
                                    <span className="flex items-center gap-1 text-xs font-medium text-ink">
                                      <Plane className="h-3 w-3 text-stone" />
                                      {rider.airline_iata} {rider.flight_no}
                                    </span>
                                  )}
                                  <span
                                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                      rider.to_airport
                                        ? 'bg-navy-50 text-navy'
                                        : 'bg-navy-50 text-navy'
                                    }`}
                                  >
                                    {rider.to_airport ? (
                                      <>
                                        <PlaneTakeoff className="h-3 w-3" />
                                        TO {rider.airport}
                                      </>
                                    ) : (
                                      <>
                                        <PlaneLanding className="h-3 w-3" />
                                        FROM {rider.airport}
                                      </>
                                    )}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-stone">
                                  {rider.date} •{' '}
                                  {formatTimeRange(rider.time_range)}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={(event) => {
                                  event.stopPropagation()
                                  if (!datePassed) {
                                    openEditRider(rider)
                                  }
                                }}
                                disabled={datePassed}
                                className={`rounded p-1 ${
                                  datePassed
                                    ? 'cursor-not-allowed text-stone-light'
                                    : 'text-stone hover:bg-line hover:text-ink'
                                }`}
                                title={
                                  datePassed
                                    ? 'Cannot modify past groups'
                                    : 'Edit rider details'
                                }
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => {
                                  handleAddToCorral(rider, group.ride_id)
                                }}
                                className="rounded p-1 text-sage hover:bg-sage-tint"
                                title="Move to corral"
                              >
                                <svg
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  handleRemoveFromGroupToUnmatched(
                                    rider,
                                    group.ride_id,
                                  )
                                }}
                                className="rounded p-1 text-danger hover:bg-danger-tint"
                                title="Remove from group and make unmatched"
                              >
                                <svg
                                  className="h-5 w-5"
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
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
