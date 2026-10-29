'use client'

import {
  Briefcase,
  Flag,
  Luggage,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
} from 'lucide-react'

import ChangesPanel from './ChangesPanel'
import CreateGroupPanel from './CreateGroupPanel'
import {
  useGroupsActionsContext,
  useGroupsDataContext,
  useGroupsUiContext,
} from './context'
import { formatTimeRange } from './utils'

export default function CorralPanel({
  pendingChangesLoading = false,
}: {
  pendingChangesLoading?: boolean
}) {
  const {
    changedGroups,
    corralRiders,
    groups,
    sortedCorralRiders,
    unmatchedIndividuals,
  } = useGroupsDataContext()
  const {
    addRiderToNewGroup,
    handleAddToCorral,
    handleCorralToggle,
    handleRemoveFromCorral,
    handleRemoveFromCorralToUnmatched,
    handleSelectFromCorral,
  } = useGroupsActionsContext()
  const {
    corralCardErrors,
    corralCollapsed,
    corralSelectionMode,
    corralTab,
    draggedRider,
    isDraggingOverCorral,
    leftSidebarTabs,
    newGroupSectionExpanded,
    recentlyAddedToNewGroup,
    selectedRidersForNewGroup,
    setCorralSelectionMode,
    setCorralTab,
    setDragOverGroupId,
    setDraggedRider,
    setIsDraggingOverCorral,
    setNewGroupSectionExpanded,
  } = useGroupsUiContext()

  return (
    <div
      className={`${corralCollapsed ? 'w-0 overflow-hidden md:w-12' : 'w-full md:w-80'} flex flex-col border-l border-line bg-card transition-all duration-300`}
    >
      <div className="flex items-center gap-2 border-b border-line p-4">
        <button
          onClick={handleCorralToggle}
          className="rounded p-1.5 text-stone hover:bg-sunken hover:text-ink"
          title={corralCollapsed ? 'Expand corral' : 'Collapse corral'}
        >
          <svg
            className={`h-5 w-5 transition-transform ${corralCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
        {!corralCollapsed && (
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-ink">Corral</h2>
            <span className="rounded-full bg-sage-tint px-2 py-1 text-xs font-semibold text-sage-strong">
              {corralRiders.length}
            </span>
          </div>
        )}
        {corralCollapsed && (
          <span className="rounded-full bg-sage-tint px-2 py-1 text-xs font-semibold text-sage-strong">
            {corralRiders.length}
          </span>
        )}
      </div>

      {!corralCollapsed && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-shrink-0 border-b border-line">
            <div className="flex">
              <button
                onClick={() => setCorralTab('riders')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  corralTab === 'riders'
                    ? 'border-b-2 border-sage/30 text-sage'
                    : 'text-stone hover:text-ink'
                }`}
              >
                Riders ({corralRiders.length})
              </button>
              <button
                onClick={() => setCorralTab('changes')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  corralTab === 'changes'
                    ? 'border-b-2 border-sage/30 text-sage'
                    : 'text-stone hover:text-ink'
                }`}
              >
                Changes ({changedGroups.length + unmatchedIndividuals.length})
              </button>
            </div>
          </div>

          {corralTab === 'riders' && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="mb-4 flex-shrink-0 p-4 pb-2">
                <p className="text-xs text-stone">
                  {corralSelectionMode
                    ? 'Select a rider to add to the group'
                    : 'Temporary holding area for removed/unmatched riders'}
                </p>
                {corralSelectionMode && (
                  <button
                    onClick={() => setCorralSelectionMode(null)}
                    className="mt-2 text-xs text-stone underline hover:text-ink"
                  >
                    Cancel selection
                  </button>
                )}
              </div>

              <div
                className={`flex-1 overflow-y-auto px-4 pb-4 transition-colors ${
                  isDraggingOverCorral ? 'bg-sage-tint' : ''
                }`}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  if (draggedRider) {
                    setIsDraggingOverCorral(true)
                  }
                }}
                onDragLeave={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = e.clientX
                  const y = e.clientY
                  if (
                    x < rect.left ||
                    x > rect.right ||
                    y < rect.top ||
                    y > rect.bottom
                  ) {
                    setIsDraggingOverCorral(false)
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDraggingOverCorral(false)
                  if (draggedRider) {
                    const isAlreadyInCorral = corralRiders.some(
                      (rider: any) =>
                        rider.flight_id === draggedRider.flight_id,
                    )
                    if (!isAlreadyInCorral) {
                      handleAddToCorral(draggedRider)
                    }
                    setDraggedRider(null)
                  }
                }}
              >
                <div className="space-y-2">
                  {sortedCorralRiders.length === 0 ? (
                    <p className="text-center text-sm text-stone">
                      Corral is empty
                    </p>
                  ) : (
                    sortedCorralRiders.map((rider: any, riderIndex: number) => {
                      const group = corralSelectionMode
                        ? groups.find(
                            (candidateGroup: any) =>
                              candidateGroup.ride_id === corralSelectionMode,
                          )
                        : null
                      const isSelectedForNewGroup =
                        selectedRidersForNewGroup.some(
                          (selectedRider: any) =>
                            selectedRider.flight_id === rider.flight_id,
                        )
                      const isRecentlyAdded = recentlyAddedToNewGroup.has(
                        String(rider.flight_id),
                      )
                      const errorKey = group
                        ? `${rider.user_id}-${group.ride_id}`
                        : null
                      const cardError = errorKey
                        ? corralCardErrors.get(errorKey)
                        : null

                      return (
                        <div
                          key={`corral-${rider.flight_id}-${riderIndex}`}
                          className="space-y-1"
                        >
                          {cardError && (
                            <p className="px-1 text-xs text-danger">
                              {cardError}
                            </p>
                          )}
                          <div
                            className={`rounded-lg border p-3 transition-all duration-300 ${
                              isSelectedForNewGroup || isRecentlyAdded
                                ? 'border-line-strong bg-sunken opacity-60'
                                : corralSelectionMode
                                  ? 'cursor-pointer border-sage/30 bg-sage-tint hover:bg-sage-tint'
                                  : 'border-line bg-paper'
                            } ${isRecentlyAdded ? 'animate-pulse' : ''}`}
                            draggable={!corralSelectionMode}
                            onDragStart={() => {
                              if (!corralSelectionMode) {
                                setDraggedRider(rider)
                              }
                            }}
                            onDragEnd={() => {
                              setDraggedRider(null)
                              setDragOverGroupId(null)
                            }}
                            onClick={() => {
                              if (corralSelectionMode && group) {
                                handleSelectFromCorral(rider, group)
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                                  {rider.name}
                                  {rider.original_unmatched && (
                                    <span title="Originally unmatched">
                                      <Flag className="h-3 w-3 flex-shrink-0 text-warning" />
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-stone">
                                  {rider.phone}
                                  {rider.phone !== '[Hidden]' &&
                                    rider.sms_opt_in !== true && (
                                      <span className="text-danger">
                                        {' '}
                                        (SMS opt-out)
                                      </span>
                                    )}
                                </p>
                                {rider.airline_iata && rider.flight_no && (
                                  <div className="group relative mt-1 flex items-center gap-1">
                                    <Plane className="h-3 w-3 text-stone" />
                                    <span className="text-xs text-stone">
                                      {rider.airline_iata} {rider.flight_no}
                                    </span>
                                    <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform whitespace-nowrap rounded bg-navy px-2 py-1 text-xs text-white group-hover:block">
                                      Flight Number
                                      <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-navy"></div>
                                    </div>
                                  </div>
                                )}
                                <div className="mt-1 flex items-center gap-3 text-xs text-stone">
                                  <div className="group relative flex items-center gap-1">
                                    <Luggage className="h-3 w-3" />
                                    <span>{rider.checked_bags}</span>
                                    <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform whitespace-nowrap rounded bg-navy px-2 py-1 text-xs text-white group-hover:block">
                                      Checked Bags (2 Units Each)
                                      <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-navy"></div>
                                    </div>
                                  </div>
                                  <div className="group relative flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" />
                                    <span>{rider.carry_on_bags}</span>
                                    <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform whitespace-nowrap rounded bg-navy px-2 py-1 text-xs text-white group-hover:block">
                                      Carry-On Bags (1 Unit Each)
                                      <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-navy"></div>
                                    </div>
                                  </div>
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
                              {!corralSelectionMode && (
                                <div className="flex flex-shrink-0 gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      addRiderToNewGroup(rider)
                                    }}
                                    className="rounded p-1 text-navy hover:bg-navy-50"
                                    title="Add to new group"
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
                                        d="M12 4v16m8-8H4"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRemoveFromCorral(rider)
                                    }}
                                    className="rounded p-1 text-navy hover:bg-navy-50"
                                    title="Remove from corral (return to origin)"
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
                                        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRemoveFromCorralToUnmatched(rider)
                                    }}
                                    className="rounded p-1 text-danger hover:bg-danger-tint"
                                    title="Remove from corral and make unmatched"
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
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {corralTab === 'changes' && (
            <ChangesPanel loading={pendingChangesLoading} />
          )}

          {!leftSidebarTabs.includes('createGroup') && (
            <div className="flex flex-1 flex-col overflow-hidden border-t border-line">
              <button
                onClick={() =>
                  setNewGroupSectionExpanded(!newGroupSectionExpanded)
                }
                className="flex w-full flex-shrink-0 items-center justify-between p-4 hover:bg-paper"
              >
                <h3 className="font-semibold text-ink">Create New Group</h3>
                <svg
                  className={`h-5 w-5 text-stone transition-transform ${
                    newGroupSectionExpanded ? 'rotate-180' : ''
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
              </button>

              {newGroupSectionExpanded && (
                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  <CreateGroupPanel />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
