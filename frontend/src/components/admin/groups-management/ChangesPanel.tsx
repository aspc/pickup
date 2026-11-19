'use client'

import { Copy, Flag, Mail, Phone } from 'lucide-react'
import { useState } from 'react'
import {
  fetchAdminContacts,
  type AdminContact,
} from '@/components/admin/services/adminLookupService'

import {
  confirmChangeLogEntries,
  sendAllMatchEmailsBatch,
} from './services/groupsWriteService'
import {
  useGroupsActionsContext,
  useGroupsDataContext,
  useGroupsUiContext,
} from './context'
import type { ChangedGroup, UnmatchedIndividual } from './types'

function ChangedGroupCard({
  changedGroup,
  onConfirmEmail,
  onEmailGroup,
  isConfirming = false,
}: {
  changedGroup: ChangedGroup
  onConfirmEmail: () => Promise<void>
  onEmailGroup?: (rideId: number) => Promise<void>
  isConfirming?: boolean
}) {
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [contactView, setContactView] = useState<'emails' | 'phones'>('emails')
  const [memberEmails, setMemberEmails] = useState<string[]>([])
  const [memberPhones, setMemberPhones] = useState<AdminContact[]>([])
  const [loadingEmails, setLoadingEmails] = useState(false)
  const [loadingPhones, setLoadingPhones] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const fetchMemberEmails = async () => {
    if (memberEmails.length > 0) {
      if (contactView === 'emails' && showContactInfo) {
        setShowContactInfo(false)
      } else {
        setContactView('emails')
        setShowContactInfo(true)
      }
      return
    }

    setLoadingEmails(true)
    try {
      const userIds = changedGroup.group.riders.map((r) => r.user_id)
      const { contacts } = await fetchAdminContacts(userIds)
      const emails = contacts
        .map((contact) => contact.email)
        .filter((email): email is string => Boolean(email))
      setMemberEmails(emails)
      setContactView('emails')
      setShowContactInfo(true)
    } catch (error) {
      console.error('Error fetching emails:', error)
    } finally {
      setLoadingEmails(false)
    }
  }

  const fetchMemberPhones = async () => {
    if (memberPhones.length > 0) {
      if (contactView === 'phones' && showContactInfo) {
        setShowContactInfo(false)
      } else {
        setContactView('phones')
        setShowContactInfo(true)
      }
      return
    }

    setLoadingPhones(true)
    try {
      const userIds = changedGroup.group.riders.map((r) => r.user_id)
      const { contacts } = await fetchAdminContacts(userIds)
      const phones = contacts.filter((contact) => Boolean(contact.phonenumber))
      setMemberPhones(phones)
      setContactView('phones')
      setShowContactInfo(true)
    } catch (error) {
      console.error('Error fetching phone numbers:', error)
    } finally {
      setLoadingPhones(false)
    }
  }

  const copyToClipboard = async () => {
    const textToCopy =
      contactView === 'emails'
        ? memberEmails.join('\n')
        : memberPhones
            .map((contact) => contact.phonenumber)
            .filter((phone): phone is string => Boolean(phone))
            .join('\n')

    if (textToCopy.length === 0) return

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  return (
    <div
      className={`rounded-lg border ${
        changedGroup.emailsSent
          ? 'border-line bg-paper'
          : 'border-warning/30 bg-warning-tint'
      } ${showContactInfo ? 'p-0' : 'p-3'}`}
    >
      <div
        className={`flex items-start justify-between ${showContactInfo ? 'p-3 pb-0' : ''}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-ink">
              Group #{changedGroup.group.ride_id}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                changedGroup.changeType === 'deleted'
                  ? 'bg-danger-tint text-danger'
                  : 'bg-navy-100 text-navy'
              }`}
            >
              {changedGroup.changeType === 'deleted' ? 'Deleted' : 'Modified'}
            </span>
            {changedGroup.emailsSent && (
              <span className="rounded-full bg-sage-tint px-2 py-0.5 text-xs font-semibold text-sage-strong">
                Emailed
              </span>
            )}
          </div>
          {changedGroup.changeDescriptions &&
            changedGroup.changeDescriptions.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {changedGroup.changeDescriptions.map((description, index) => (
                  <p key={index} className="text-xs text-ink">
                    {description}
                  </p>
                ))}
              </div>
            )}
          <p className="mt-1 text-xs text-stone">
            {changedGroup.group.riders.length} rider
            {changedGroup.group.riders.length !== 1 ? 's' : ''} •{' '}
            {new Date(changedGroup.changedAt).toLocaleString()}
          </p>
        </div>
        <div className="ml-4 flex flex-shrink-0 flex-col gap-1">
          <div className="flex gap-0.5">
            <button
              onClick={fetchMemberEmails}
              disabled={loadingEmails}
              className={`rounded p-0.5 text-stone hover:bg-line ${
                showContactInfo && contactView === 'emails' ? 'bg-line' : ''
              }`}
              title="View member emails"
            >
              <Mail className="h-4 w-4" />
            </button>
            <button
              onClick={fetchMemberPhones}
              disabled={loadingPhones}
              className={`rounded p-0.5 text-stone hover:bg-line ${
                showContactInfo && contactView === 'phones' ? 'bg-line' : ''
              }`}
              title="View member phone numbers"
            >
              <Phone className="h-4 w-4" />
            </button>
          </div>
          {!changedGroup.emailsSent && (
            <div className="flex flex-col gap-1">
              {onEmailGroup && (
                <button
                  onClick={() => setShowEmailModal(true)}
                  disabled={isConfirming}
                  className={`rounded px-2 py-1 text-xs font-medium transition-all ${
                    isConfirming
                      ? 'cursor-not-allowed bg-stone-light text-white/80'
                      : 'bg-navy text-white hover:bg-navy-700'
                  }`}
                >
                  {isConfirming ? 'Sending...' : 'Email group'}
                </button>
              )}
              <button
                onClick={onConfirmEmail}
                disabled={isConfirming}
                className={`rounded px-2 py-1 text-xs font-medium transition-all ${
                  isConfirming
                    ? 'cursor-not-allowed bg-stone-light text-white/80'
                    : 'bg-sage text-white hover:bg-sage-strong'
                }`}
              >
                {isConfirming ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showEmailModal && onEmailGroup && (
        <div className="fixed inset-0 z-50 flex animate-overlay-in items-center justify-center bg-navy-900/40 p-4">
          <div className="max-w-sm rounded-lg bg-card p-4 shadow-overlay">
            <h3 className="text-lg font-semibold text-ink">
              Send match emails
            </h3>
            <p className="mt-2 text-sm text-stone">
              Send match notification emails to all{' '}
              {changedGroup.group.riders.length} rider
              {changedGroup.group.riders.length !== 1 ? 's' : ''} in Group #
              {changedGroup.group.ride_id}?
            </p>
            {emailError && (
              <p className="mt-2 text-sm text-danger">{emailError}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowEmailModal(false)
                  setEmailError(null)
                }}
                disabled={isConfirming}
                className="rounded border border-line-strong bg-card px-3 py-1.5 text-sm text-ink hover:bg-paper"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setEmailError(null)
                  try {
                    await onEmailGroup(changedGroup.group.ride_id)
                    setShowEmailModal(false)
                  } catch (error) {
                    setEmailError(
                      error instanceof Error
                        ? error.message
                        : 'Failed to send emails',
                    )
                  }
                }}
                disabled={isConfirming}
                className="rounded bg-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-navy-700 disabled:opacity-50"
              >
                {isConfirming ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showContactInfo && (
        <div className="mt-3 w-full rounded-b-lg bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-ink">
              {contactView === 'emails'
                ? 'Member Emails:'
                : 'Member Phone Numbers:'}
            </p>
            {(contactView === 'emails'
              ? memberEmails.length > 0
              : memberPhones.length > 0) && (
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-stone hover:bg-sunken"
                title={`Copy ${contactView === 'emails' ? 'emails' : 'phone numbers'} to clipboard`}
              >
                <Copy className="h-3 w-3" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {contactView === 'emails' ? (
              memberEmails.length > 0 ? (
                <div className="space-y-1">
                  {memberEmails.map((email, index) => (
                    <p key={index} className="break-words text-xs text-stone">
                      {email}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone">No emails found</p>
              )
            ) : memberPhones.length > 0 ? (
              <div className="space-y-1">
                {memberPhones.map((contact) => (
                  <p
                    key={contact.user_id}
                    className="break-words text-xs text-stone"
                  >
                    {contact.phonenumber}
                    {contact.sms_opt_in !== true && (
                      <span className="text-danger"> (SMS opt-out)</span>
                    )}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone">No phone numbers found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function UnmatchedIndividualCard({
  item,
  onConfirmEmail,
  isConfirming = false,
}: {
  item: UnmatchedIndividual
  onConfirmEmail: () => Promise<void>
  isConfirming?: boolean
}) {
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [contactView, setContactView] = useState<'emails' | 'phones'>('emails')
  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [smsOptIn, setSmsOptIn] = useState<boolean | null>(null)
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingPhone, setLoadingPhone] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchEmail = async () => {
    if (email) {
      if (contactView === 'emails' && showContactInfo) {
        setShowContactInfo(false)
      } else {
        setContactView('emails')
        setShowContactInfo(true)
      }
      return
    }

    setLoadingEmail(true)
    try {
      const { contacts } = await fetchAdminContacts([item.rider.user_id])
      setEmail(contacts[0]?.email || 'No email found')
      setContactView('emails')
      setShowContactInfo(true)
    } catch (error) {
      console.error('Error fetching email:', error)
    } finally {
      setLoadingEmail(false)
    }
  }

  const fetchPhone = async () => {
    if (phone) {
      if (contactView === 'phones' && showContactInfo) {
        setShowContactInfo(false)
      } else {
        setContactView('phones')
        setShowContactInfo(true)
      }
      return
    }

    setLoadingPhone(true)
    try {
      const { contacts } = await fetchAdminContacts([item.rider.user_id])
      setPhone(contacts[0]?.phonenumber || 'No phone number found')
      setSmsOptIn(contacts[0]?.sms_opt_in ?? null)
      setContactView('phones')
      setShowContactInfo(true)
    } catch (error) {
      console.error('Error fetching phone number:', error)
    } finally {
      setLoadingPhone(false)
    }
  }

  const copyToClipboard = async () => {
    const textToCopy = contactView === 'emails' ? email : phone
    if (
      !textToCopy ||
      textToCopy === 'No email found' ||
      textToCopy === 'No phone number found'
    ) {
      return
    }

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  return (
    <div
      className={`rounded-lg border ${
        item.emailSent
          ? 'border-line bg-paper'
          : 'border-warning/30 bg-warning-tint'
      } ${showContactInfo ? 'p-0' : 'p-3'}`}
    >
      <div
        className={`flex items-start justify-between ${showContactInfo ? 'p-3 pb-0' : ''}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="flex items-center gap-1.5 font-semibold text-ink">
              {item.rider.name}
              {item.rider.original_unmatched && (
                <span title="Originally unmatched">
                  <Flag className="h-3 w-3 flex-shrink-0 text-warning" />
                </span>
              )}
            </p>
            {item.emailSent && (
              <span className="rounded-full bg-sage-tint px-2 py-0.5 text-xs font-semibold text-sage-strong">
                Emailed
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-stone">
            Became unmatched:{' '}
            {new Date(item.becameUnmatchedAt).toLocaleString()}
          </p>
        </div>
        <div className="ml-4 flex flex-shrink-0 flex-col gap-1">
          <div className="flex gap-0.5">
            <button
              onClick={fetchEmail}
              disabled={loadingEmail}
              className={`rounded p-0.5 text-stone hover:bg-line ${
                showContactInfo && contactView === 'emails' ? 'bg-line' : ''
              }`}
              title="View email"
            >
              <Mail className="h-4 w-4" />
            </button>
            <button
              onClick={fetchPhone}
              disabled={loadingPhone}
              className={`rounded p-0.5 text-stone hover:bg-line ${
                showContactInfo && contactView === 'phones' ? 'bg-line' : ''
              }`}
              title="View phone number"
            >
              <Phone className="h-4 w-4" />
            </button>
          </div>
          {!item.emailSent && (
            <button
              onClick={onConfirmEmail}
              disabled={isConfirming}
              className={`rounded px-2 py-1 text-xs font-medium transition-all ${
                isConfirming
                  ? 'cursor-not-allowed bg-stone-light text-white/80'
                  : 'bg-sage text-white hover:bg-sage-strong'
              }`}
            >
              {isConfirming ? 'Confirming...' : 'Confirm'}
            </button>
          )}
        </div>
      </div>
      {showContactInfo && (
        <div className="mt-3 w-full rounded-b-lg bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-ink">
              {contactView === 'emails' ? 'Email:' : 'Phone Number:'}
            </p>
            {((contactView === 'emails' &&
              email &&
              email !== 'No email found') ||
              (contactView === 'phones' &&
                phone &&
                phone !== 'No phone number found')) && (
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-stone hover:bg-sunken"
                title={`Copy ${contactView === 'emails' ? 'email' : 'phone number'} to clipboard`}
              >
                <Copy className="h-3 w-3" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            <p className="break-words text-xs text-stone">
              {contactView === 'emails' ? (
                email
              ) : (
                <>
                  {phone}
                  {phone &&
                    phone !== 'No phone number found' &&
                    smsOptIn !== true && (
                      <span className="text-danger"> (SMS opt-out)</span>
                    )}
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChangesPanel({
  loading = false,
}: {
  loading?: boolean
}) {
  const {
    fetchChangeLog,
    loadUnconfirmedChanges,
    logToChangeLog,
    setChangedGroups,
    setUnmatchedIndividuals,
    supabase,
  } = useGroupsActionsContext()
  const { changedGroups, unmatchedIndividuals } = useGroupsDataContext()
  const {
    confirmingGroups,
    confirmingIndividuals,
    setConfirmingGroups,
    setConfirmingIndividuals,
    setErrorMessage,
  } = useGroupsUiContext()

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-3 p-6 text-sm text-stone">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-sage/30 border-t-sage"></span>
        Loading pending changes...
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      <div className="space-y-4">
        {changedGroups.filter(
          (changedGroup: ChangedGroup) => !changedGroup.emailsSent,
        ).length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">
              Changed Groups (
              {
                changedGroups.filter(
                  (changedGroup: ChangedGroup) => !changedGroup.emailsSent,
                ).length
              }
              )
            </h3>
            <div className="space-y-2">
              {changedGroups
                .filter(
                  (changedGroup: ChangedGroup) => !changedGroup.emailsSent,
                )
                .map((changedGroup: ChangedGroup) => {
                  const runConfirmFlow = async () => {
                    setConfirmingGroups((prev: Set<number>) =>
                      new Set(prev).add(changedGroup.group.ride_id),
                    )
                    try {
                      const changeLogIds =
                        changedGroup.changeLogIds &&
                        changedGroup.changeLogIds.length > 0
                          ? changedGroup.changeLogIds
                          : changedGroup.changeLogId
                            ? [changedGroup.changeLogId]
                            : []

                      if (changeLogIds.length > 0) {
                        await confirmChangeLogEntries({
                          supabase,
                          changeLogIds,
                        })
                      }

                      try {
                        await logToChangeLog(
                          'EMAIL_CONFIRMED',
                          {
                            email_confirmed: true,
                            ride_id: changedGroup.group.ride_id,
                            change_type: changedGroup.changeType,
                            rider_count: changedGroup.group.riders.length,
                            rider_names: changedGroup.group.riders.map(
                              (rider: any) => rider.name,
                            ),
                            rider_user_ids: changedGroup.group.riders.map(
                              (rider: any) => rider.user_id,
                            ),
                          },
                          changedGroup.group.ride_id,
                          undefined,
                          true,
                        )
                      } catch (error) {
                        console.error(
                          '[onConfirmEmail] Error creating email confirmation entry:',
                          error,
                        )
                      }

                      setChangedGroups((prev: ChangedGroup[]) =>
                        prev.map((currentGroup) =>
                          currentGroup.group.ride_id ===
                          changedGroup.group.ride_id
                            ? { ...currentGroup, emailsSent: true }
                            : currentGroup,
                        ),
                      )

                      await fetchChangeLog()

                      setTimeout(() => {
                        loadUnconfirmedChanges()
                      }, 500)
                    } catch (confirmError) {
                      const error =
                        confirmError instanceof Error
                          ? confirmError
                          : new Error(String(confirmError))
                      console.error(
                        '[runConfirmFlow] Confirmation error:',
                        error,
                      )
                      setErrorMessage(
                        'Confirmation sync failed. Refresh the page to see the latest state.',
                      )
                      setTimeout(() => setErrorMessage(null), 5000)
                    } finally {
                      setConfirmingGroups((prev: Set<number>) => {
                        const next = new Set(prev)
                        next.delete(changedGroup.group.ride_id)
                        return next
                      })
                    }
                  }

                  const onEmailGroup = async () => {
                    setConfirmingGroups((prev: Set<number>) =>
                      new Set(prev).add(changedGroup.group.ride_id),
                    )
                    try {
                      await sendAllMatchEmailsBatch(changedGroup.group.ride_id)
                      await runConfirmFlow()
                    } catch (error) {
                      const message =
                        error instanceof Error
                          ? error.message
                          : 'Failed to send emails'
                      setErrorMessage(message)
                      setTimeout(() => setErrorMessage(null), 5000)
                      throw error
                    } finally {
                      setConfirmingGroups((prev: Set<number>) => {
                        const next = new Set(prev)
                        next.delete(changedGroup.group.ride_id)
                        return next
                      })
                    }
                  }

                  return (
                    <ChangedGroupCard
                      key={changedGroup.group.ride_id}
                      changedGroup={changedGroup}
                      isConfirming={confirmingGroups.has(
                        changedGroup.group.ride_id,
                      )}
                      onConfirmEmail={runConfirmFlow}
                      onEmailGroup={onEmailGroup}
                    />
                  )
                })}
            </div>
          </div>
        )}

        {changedGroups.filter(
          (changedGroup: ChangedGroup) => changedGroup.emailsSent,
        ).length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-sage-strong">
              Confirmed/Emailed Groups (
              {
                changedGroups.filter(
                  (changedGroup: ChangedGroup) => changedGroup.emailsSent,
                ).length
              }
              )
            </h3>
            <div className="space-y-2">
              {changedGroups
                .filter((changedGroup: ChangedGroup) => changedGroup.emailsSent)
                .map((changedGroup: ChangedGroup) => (
                  <ChangedGroupCard
                    key={`confirmed-${changedGroup.group.ride_id}`}
                    changedGroup={changedGroup}
                    onConfirmEmail={async () => {}}
                  />
                ))}
            </div>
          </div>
        )}

        {unmatchedIndividuals.filter(
          (item: UnmatchedIndividual) => !item.emailSent,
        ).length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">
              Unmatched Individuals (
              {
                unmatchedIndividuals.filter(
                  (item: UnmatchedIndividual) => !item.emailSent,
                ).length
              }
              )
            </h3>
            <div className="space-y-2">
              {unmatchedIndividuals
                .filter((item: UnmatchedIndividual) => !item.emailSent)
                .map((item: UnmatchedIndividual) => (
                  <UnmatchedIndividualCard
                    key={`${item.rider.user_id}-${item.rider.flight_id}`}
                    item={item}
                    isConfirming={confirmingIndividuals.has(
                      `${item.rider.user_id}-${item.rider.flight_id}`,
                    )}
                    onConfirmEmail={async () => {
                      const individualKey = `${item.rider.user_id}-${item.rider.flight_id}`
                      setConfirmingIndividuals((prev: Set<string>) =>
                        new Set(prev).add(individualKey),
                      )

                      try {
                        const changeLogIds =
                          item.changeLogIds && item.changeLogIds.length > 0
                            ? item.changeLogIds
                            : item.changeLogId
                              ? [item.changeLogId]
                              : []

                        if (changeLogIds.length > 0) {
                          await confirmChangeLogEntries({
                            supabase,
                            changeLogIds,
                          })
                        }

                        await logToChangeLog(
                          'EMAIL_CONFIRMED',
                          {
                            rider_name: item.rider.name,
                            rider_user_id: item.rider.user_id,
                            rider_flight_id: item.rider.flight_id,
                            date: item.rider.date,
                          },
                          undefined,
                          item.rider.user_id,
                          true,
                        )

                        setUnmatchedIndividuals((prev: UnmatchedIndividual[]) =>
                          prev.map((currentItem) =>
                            currentItem.rider.flight_id === item.rider.flight_id
                              ? { ...currentItem, emailSent: true }
                              : currentItem,
                          ),
                        )

                        await fetchChangeLog()

                        setTimeout(async () => {
                          await loadUnconfirmedChanges()
                          setUnmatchedIndividuals(
                            (prev: UnmatchedIndividual[]) =>
                              prev.map((currentItem) => {
                                const wasEmailed = unmatchedIndividuals.find(
                                  (candidate: UnmatchedIndividual) =>
                                    candidate.rider.flight_id ===
                                    currentItem.rider.flight_id,
                                )?.emailSent

                                if (wasEmailed) {
                                  return { ...currentItem, emailSent: true }
                                }

                                return currentItem
                              }),
                          )
                        }, 500)
                      } finally {
                        setConfirmingIndividuals((prev: Set<string>) => {
                          const next = new Set(prev)
                          next.delete(individualKey)
                          return next
                        })
                      }
                    }}
                  />
                ))}
            </div>
          </div>
        )}

        {unmatchedIndividuals.filter(
          (item: UnmatchedIndividual) => item.emailSent,
        ).length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-sage-strong">
              Confirmed/Emailed Unmatched Individuals (
              {
                unmatchedIndividuals.filter(
                  (item: UnmatchedIndividual) => item.emailSent,
                ).length
              }
              )
            </h3>
            <div className="space-y-2">
              {unmatchedIndividuals
                .filter((item: UnmatchedIndividual) => item.emailSent)
                .map((item: UnmatchedIndividual) => (
                  <UnmatchedIndividualCard
                    key={`confirmed-${item.rider.user_id}-${item.rider.flight_id}`}
                    item={item}
                    onConfirmEmail={async () => {}}
                  />
                ))}
            </div>
          </div>
        )}

        {changedGroups.length === 0 && unmatchedIndividuals.length === 0 && (
          <p className="text-center text-sm text-stone">No changes to track</p>
        )}
      </div>
    </div>
  )
}
