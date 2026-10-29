'use client'

import { addUnmatchedFlight } from '@/components/admin/groups-management/services/groupsWriteService'
import {
  checkAdminFlightExists,
  fetchAdminSchools,
  fetchAdminUsers,
  type AdminLookupUser,
} from '@/components/admin/services/adminLookupService'
import { Plane, Search, User, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getFlightDateBounds,
  isValidFlightTime,
  MAX_BAG_COUNT,
  validateAirlineCode,
  validateFlightNumber,
} from '@/utils/flightValidation'

type ChangeLogAction =
  | 'RUN_ALGORITHM'
  | 'ADD_TO_GROUP'
  | 'REMOVE_FROM_GROUP'
  | 'CREATE_GROUP'
  | 'DELETE_GROUP'
  | 'IGNORE_ERROR'
  | 'UPDATE_GROUP_TIME'
  | 'UPDATE_VOUCHER'
  | 'UPDATE_RIDER_DETAILS'
  | 'EMAIL_CONFIRMED'
  | 'ADD_FLIGHT'

interface AddRiderProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  logToChangeLog?: (
    action: ChangeLogAction,
    metadata?: any,
    targetGroupId?: number,
    targetUserId?: string,
    confirmed?: boolean,
  ) => Promise<void>
}

type User = AdminLookupUser

export default function AddRider({
  isOpen,
  onClose,
  onSuccess,
  logToChangeLog,
}: AddRiderProps) {
  const [step, setStep] = useState<
    'select-school' | 'select-user' | 'flight-info'
  >('select-school')
  const [schools, setSchools] = useState<string[]>([])
  const [selectedSchool, setSelectedSchool] = useState<string>('')
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Flight form state
  const [flightNo, setFlightNo] = useState('')
  const [airlineIata, setAirlineIata] = useState('')
  const [airport, setAirport] = useState<'LAX' | 'ONT'>('LAX')
  const [toAirport, setToAirport] = useState(true)
  const [date, setDate] = useState('')
  const [timeRange, setTimeRange] = useState('')
  const [checkedBags, setCheckedBags] = useState(0)
  const [carryOnBags, setCarryOnBags] = useState(0)
  const [personalItems, setPersonalItems] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const flightDateBounds = useMemo(() => getFlightDateBounds(), [])

  const fetchSchools = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchAdminSchools()
      setSchools(result.schools)
    } catch (err) {
      console.error('Error fetching schools:', err)
      setError('Failed to fetch schools')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUsersBySchool = useCallback(async (school: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchAdminUsers(school)
      setUsers(result.users)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch schools on mount
  useEffect(() => {
    if (isOpen && step === 'select-school') {
      fetchSchools()
    }
  }, [fetchSchools, isOpen, step])

  // Fetch users when school is selected
  useEffect(() => {
    if (selectedSchool && step === 'select-user') {
      fetchUsersBySchool(selectedSchool)
    }
  }, [fetchUsersBySchool, selectedSchool, step])

  const handleSchoolSelect = (school: string) => {
    setSelectedSchool(school)
    setStep('select-user')
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setStep('flight-info')
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchQuery(searchInput)
    }
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
  }

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users
    }

    const query = searchQuery.trim().toLowerCase()

    // Check if query is in quotes (for first name + last name search)
    const quotedMatch = query.match(/^"(.+)"$/)
    if (quotedMatch) {
      const nameQuery = quotedMatch[1].toLowerCase()
      return users.filter((user) => {
        const fullName = `${user.firstname} ${user.lastname}`.toLowerCase()
        return fullName.includes(nameQuery)
      })
    }

    // Search by email, firstname, lastname, or full name
    return users.filter((user) => {
      const email = user.email?.toLowerCase() || ''
      const firstname = user.firstname?.toLowerCase() || ''
      const lastname = user.lastname?.toLowerCase() || ''
      const fullName = `${firstname} ${lastname}`

      return (
        email.includes(query) ||
        firstname.includes(query) ||
        lastname.includes(query) ||
        fullName.includes(query)
      )
    })
  }, [users, searchQuery])

  const handleSubmit = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent default form submission if called from button
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!selectedUser) {
      setError('No user selected')
      return
    }

    // Validate required fields
    if (!date || !timeRange || !airlineIata) {
      setError('Date, time range, and airline code are required')
      return
    }

    const airlineValidation = validateAirlineCode(airlineIata)
    if (!airlineValidation.isValid) {
      setError(airlineValidation.errorMessage || 'Invalid airline code')
      return
    }

    if (flightNo) {
      const flightValidation = validateFlightNumber(flightNo)
      if (!flightValidation.isValid) {
        setError(flightValidation.errorMessage || 'Invalid flight number')
        return
      }
    }

    if (
      personalItems > MAX_BAG_COUNT ||
      carryOnBags > MAX_BAG_COUNT ||
      checkedBags > MAX_BAG_COUNT
    ) {
      setError(`Each luggage count must be between 0 and ${MAX_BAG_COUNT}`)
      return
    }

    // Validate and parse time range format (accepts "HH:MM - HH:MM" or "HH:MM-HH:MM")
    let timeRangeParts: string[] = []
    if (timeRange.includes(' - ')) {
      // Format with spaces: "12:00 - 16:00"
      timeRangeParts = timeRange.split(' - ').map((t) => t.trim())
    } else if (timeRange.includes('-')) {
      // Format without spaces: "12:00-16:00"
      timeRangeParts = timeRange.split('-').map((t) => t.trim())
    } else {
      setError('Time range must be in format: HH:MM - HH:MM or HH:MM-HH:MM')
      return
    }

    if (timeRangeParts.length !== 2) {
      setError('Time range must be in format: HH:MM - HH:MM or HH:MM-HH:MM')
      return
    }

    // Validate time format (HH:MM)
    if (
      !isValidFlightTime(timeRangeParts[0]) ||
      !isValidFlightTime(timeRangeParts[1])
    ) {
      setError('Times must be in 24-hour format: HH:MM (e.g., 12:00, 16:00)')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Parse time range
      const [earliest, latest] = timeRangeParts

      // Generate random flight number if not provided
      let finalFlightNo = flightNo
      if (!finalFlightNo) {
        let attempts = 0
        const maxAttempts = 100

        while (!finalFlightNo && attempts < maxAttempts) {
          // Generate a random 4-digit flight number
          const randomFlightNo = Math.floor(
            1000 + Math.random() * 9000,
          ).toString()

          // Check if this flight number already exists for this user on this date
          const { exists } = await checkAdminFlightExists({
            userId: selectedUser.user_id,
            flightNo: randomFlightNo,
            date,
          })

          if (!exists) {
            // Flight number is available
            finalFlightNo = randomFlightNo
            break
          }

          attempts++
        }

        if (!finalFlightNo) {
          setError(
            'Failed to generate unique flight number. Please try again or provide a flight number.',
          )
          setSubmitting(false)
          return
        }
      }

      // Insert flight (no duplicate check - multiple people can have the same flight on the same date)
      const flightData = await addUnmatchedFlight({
        flight: {
          user_id: selectedUser.user_id,
          flight_no: finalFlightNo,
          airline_iata: airlineIata,
          airport,
          to_airport: toAirport,
          date: date,
          earliest_time: earliest,
          latest_time: latest,
          bag_no: carryOnBags,
          bag_no_large: checkedBags,
          bag_no_personal: personalItems,
          opt_in: true,
        },
      })

      if (!flightData?.flightId) {
        setError('Flight was created but no data was returned')
        setSubmitting(false)
        return
      }

      // Log to ChangeLog for unmatched rider
      if (logToChangeLog && flightData) {
        try {
          const flightIdentifier =
            airlineIata && flightNo
              ? `${airlineIata.toUpperCase()} ${flightNo}`
              : flightNo
                ? `Flight ${flightNo}`
                : 'Flight (no number)'

          await logToChangeLog(
            'ADD_FLIGHT',
            {
              action_description: `Added new unmatched rider: ${selectedUser.firstname} ${selectedUser.lastname} with ${flightIdentifier} on ${date}`,
              rider_name: `${selectedUser.firstname} ${selectedUser.lastname}`,
              rider_user_id: selectedUser.user_id,
              rider_flight_id: flightData.flightId,
              flight_id: flightData.flightId,
              date: date,
              flight_no: finalFlightNo,
              airline_iata: airlineIata,
              airport,
              to_airport: toAirport,
              earliest_time: earliest,
              latest_time: latest,
              source: 'manual_add',
              school: selectedUser.school,
              is_unmatched: true,
            },
            undefined, // No target_group_id for new flights
            selectedUser.user_id,
          )
        } catch (logError) {
          console.error('Error logging to ChangeLog:', logError)
          // Don't fail the operation if ChangeLog fails, but show a warning
          setError(
            'Flight created successfully, but failed to log to ChangeLog. Please refresh the page.',
          )
        }
      }

      // Success - reset and close
      resetForm()
      onSuccess?.()
      onClose()
    } catch (err: any) {
      console.error('Error submitting flight:', err)
      setError(
        `Failed to create flight: ${err?.message || 'Unknown error occurred'}`,
      )
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setStep('select-school')
    setSelectedSchool('')
    setSelectedUser(null)
    setUsers([])
    setSearchInput('')
    setSearchQuery('')
    setFlightNo('')
    setAirlineIata('')
    setAirport('LAX')
    setToAirport(true)
    setDate('')
    setTimeRange('')
    setCheckedBags(0)
    setCarryOnBags(0)
    setPersonalItems(0)
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50">
      <div className="mx-4 w-full max-w-2xl rounded-lg bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-xl font-semibold text-ink">Add New Rider</h2>
          <button
            onClick={handleClose}
            className="rounded p-1 text-stone-light hover:bg-sunken hover:text-stone"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          {error && step !== 'flight-info' && (
            <div className="mb-4 rounded-lg border border-danger/30 bg-danger-tint px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          {/* Step 1: Select School */}
          {step === 'select-school' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-ink">
                <User className="h-5 w-5" />
                <h3 className="text-lg font-medium">Step 1: Select School</h3>
              </div>
              <p className="text-sm text-stone">
                Choose the school to find users from
              </p>
              {loading ? (
                <div className="py-8 text-center text-stone">
                  Loading schools...
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {schools.map((school) => (
                    <button
                      key={school}
                      onClick={() => handleSchoolSelect(school)}
                      className="rounded-lg border border-line-strong bg-card px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-navy-300 hover:bg-paper"
                    >
                      {school}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select User */}
          {step === 'select-user' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-ink">
                <User className="h-5 w-5" />
                <h3 className="text-lg font-medium">
                  Step 2: Select Person from {selectedSchool}
                </h3>
              </div>
              <button
                onClick={() => {
                  setStep('select-school')
                  setSelectedSchool('')
                  setSearchInput('')
                  setSearchQuery('')
                }}
                className="text-sm text-stone underline hover:text-ink"
              >
                ← Change school
              </button>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-light" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder='Search by email, name, or "First Last" (in quotes) - Press Enter'
                  className="w-full rounded-lg border border-line-strong bg-card py-2 pl-10 pr-10 text-sm text-ink placeholder:text-stone-light focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage/30"
                />
                {searchInput && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-stone-light hover:bg-sunken hover:text-stone"
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {loading ? (
                <div className="py-8 text-center text-stone">
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div className="py-8 text-center text-stone">
                  No users found for this school
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-8 text-center text-stone">
                  No users match your search
                </div>
              ) : (
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.user_id}
                      onClick={() => handleUserSelect(user)}
                      className="w-full rounded-lg border border-line-strong bg-card px-4 py-3 text-left transition-colors hover:border-navy-300 hover:bg-paper"
                    >
                      <div className="font-medium text-ink">
                        {user.firstname} {user.lastname}
                      </div>
                      <div className="mt-1 text-sm text-stone">
                        {user.email}
                      </div>
                      {user.phonenumber && (
                        <div className="mt-1 text-xs text-stone">
                          {user.phonenumber}
                          {user.sms_opt_in !== true && (
                            <span className="text-danger"> (SMS opt-out)</span>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Flight Information */}
          {step === 'flight-info' && selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-ink">
                <Plane className="h-5 w-5" />
                <h3 className="text-lg font-medium">
                  Step 3: Flight Information for {selectedUser.firstname}{' '}
                  {selectedUser.lastname}
                </h3>
              </div>
              <button
                onClick={() => {
                  setStep('select-user')
                  setSelectedUser(null)
                }}
                className="text-sm text-stone underline hover:text-ink"
              >
                ← Change person
              </button>

              <div className="space-y-4">
                {/* Date - Required */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink">
                    Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={flightDateBounds.min}
                    max={flightDateBounds.max}
                    required
                    className="w-full rounded-lg border border-line-strong bg-card px-3 py-2 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage/30"
                  />
                </div>

                {/* Time Range - Required */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink">
                    Time Range (HH:MM - HH:MM){' '}
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    placeholder="09:00 - 12:00"
                    required
                    className="w-full rounded-lg border border-line-strong bg-card px-3 py-2 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage/30"
                  />
                  <p className="mt-1 text-xs text-stone">
                    Format: HH:MM - HH:MM (24-hour format)
                  </p>
                </div>

                {/* Airline Code - Required */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink">
                    Airline Code (IATA) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={airlineIata}
                    onChange={(e) =>
                      setAirlineIata(e.target.value.toUpperCase())
                    }
                    maxLength={2}
                    required
                    className="w-full rounded-lg border border-line-strong bg-card px-3 py-2 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage/30"
                  />
                </div>

                {/* Flight Number */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink">
                    Flight Number
                  </label>
                  <input
                    type="text"
                    value={flightNo}
                    onChange={(e) => setFlightNo(e.target.value)}
                    className="w-full rounded-lg border border-line-strong bg-card px-3 py-2 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage/30"
                  />
                </div>

                {/* Airport */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink">
                    Airport
                  </label>
                  <select
                    value={airport}
                    onChange={(e) =>
                      setAirport(e.target.value as 'LAX' | 'ONT')
                    }
                    className="w-full rounded-lg border border-line-strong bg-card px-3 py-2 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage/30"
                  >
                    <option value="LAX">LAX</option>
                    <option value="ONT">ONT</option>
                  </select>
                </div>

                {/* Direction - Optional */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink">
                    Direction
                  </label>
                  <select
                    value={toAirport ? 'to' : 'from'}
                    onChange={(e) => setToAirport(e.target.value === 'to')}
                    className="w-full rounded-lg border border-line-strong bg-card px-3 py-2 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage/30"
                  >
                    <option value="to">To Airport</option>
                    <option value="from">From Airport</option>
                  </select>
                </div>

                {/* Bags */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink">
                      Personal Items
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={MAX_BAG_COUNT}
                      value={personalItems}
                      onChange={(e) =>
                        setPersonalItems(parseInt(e.target.value) || 0)
                      }
                      className="w-full rounded-lg border border-line-strong bg-card px-3 py-2 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage/30"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink">
                      Checked Bags
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={MAX_BAG_COUNT}
                      value={checkedBags}
                      onChange={(e) =>
                        setCheckedBags(parseInt(e.target.value) || 0)
                      }
                      className="w-full rounded-lg border border-line-strong bg-card px-3 py-2 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage/30"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink">
                      Carry-On Bags
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={MAX_BAG_COUNT}
                      value={carryOnBags}
                      onChange={(e) =>
                        setCarryOnBags(parseInt(e.target.value) || 0)
                      }
                      className="w-full rounded-lg border border-line-strong bg-card px-3 py-2 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          {step === 'flight-info' && error ? (
            <p className="text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          ) : (
            <span />
          )}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={submitting}
              className="rounded-lg border border-line-strong bg-card px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper disabled:opacity-50"
            >
              Cancel
            </button>
            {step === 'flight-info' && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !date || !timeRange}
                className="rounded-lg bg-warning px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-warning disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Create Flight'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
