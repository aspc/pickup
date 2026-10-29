'use client'

import { postJson } from '@/utils/api'
import { createBrowserClient } from '@/utils/supabase'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardFooter } from '@/components/ui/Card'
import { Checkbox, Field, Input, Select } from '@/components/ui/Field'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { PRIVACY_URL } from '@/config/legalDocuments'
import { isProfileExitClick } from '@/utils/profileExitGuard'
import { useAuth } from '@/hooks/useAuth'

export default function ProfilePage() {
  const supabase = useMemo(() => createBrowserClient(), [])
  const {
    user,
    isLoading: authLoading,
    refreshProfile,
    updateAvatarUrl,
  } = useAuth()

  const [firstname, setFirstName] = useState('')
  const [lastname, setLastName] = useState('')
  const [school, setSchool] = useState('')
  const [email, setEmail] = useState('')
  const [phonenumber, setPhoneNumber] = useState('')
  const [smsOptIn, setSmsOptIn] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')
  const [instagram, setInstagram] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUpdateReminder, setShowUpdateReminder] = useState(false)

  const markUnsaved = useCallback(() => {
    setHasUnsavedChanges(true)
    setShowUpdateReminder(false)
  }, [])

  const hasRequiredProfileValue = (value: string) =>
    value.trim() !== '' && value.trim() !== 'Unknown'

  const isProfileFormIncomplete = useCallback(
    () =>
      !hasRequiredProfileValue(firstname) ||
      !hasRequiredProfileValue(lastname) ||
      !hasRequiredProfileValue(school) ||
      !hasRequiredProfileValue(email) ||
      !hasRequiredProfileValue(phonenumber),
    [email, firstname, lastname, phonenumber, school],
  )

  const shouldBlockProfileExit = useCallback(
    () => hasUnsavedChanges || isProfileFormIncomplete(),
    [hasUnsavedChanges, isProfileFormIncomplete],
  )

  useEffect(() => {
    const fetchUserData = async () => {
      if (authLoading) return
      if (!user) {
        setMessage('Error: You must be logged in to fetch data!')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('Users')
        .select(
          'firstname, lastname, school, email, phonenumber, sms_opt_in, instagram, photo_url',
        )
        .eq('user_id', user.id)
        .single()

      if (error) {
        setMessage('Please enter your profile information.')
        console.error('Error fetching user data:', error)
        // Set email from auth user if no profile exists
        setEmail(user.email || '')
      } else if (data) {
        setFirstName(data.firstname || '')
        setLastName(data.lastname || '')
        setSchool(data.school === 'Unknown' ? '' : data.school || '')
        setEmail(data.email || user.email || '')
        setPhoneNumber(data.phonenumber || '')
        setSmsOptIn(data.sms_opt_in || false)
        setInstagram(data.instagram || '')
        setPhotoUrl(data.photo_url || '')
        setHasProfile(true)
      }

      setLoading(false)
    }

    fetchUserData()
  }, [authLoading, supabase, user])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!shouldBlockProfileExit()) return

      setShowUpdateReminder(true)
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [shouldBlockProfileExit])

  useEffect(() => {
    const handleClickAway = (event: MouseEvent) => {
      if (!shouldBlockProfileExit()) return

      if (!isProfileExitClick(event.target as Element | null)) return

      event.preventDefault()
      event.stopPropagation()
      setShowUpdateReminder(true)
    }

    document.addEventListener('click', handleClickAway, true)
    return () => document.removeEventListener('click', handleClickAway, true)
  }, [shouldBlockProfileExit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setMessage('You must be logged in to submit your profile.')
      return
    }
    // Basic US phone number regex: allows (123) 456-7890, 123-456-7890, 1234567890, etc.
    const phoneRegex = /^\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}$/

    if (!phoneRegex.test(phonenumber)) {
      setMessage('Please enter a valid phone number.')
      return
    }

    const updatedPhotoUrl = photoUrl

    try {
      await postJson('/api/profile', {
        profile: {
          email, // User's preferred contact email
          firstname,
          lastname,
          school,
          phonenumber,
          sms_opt_in: smsOptIn,
          photo_url: updatedPhotoUrl,
          instagram: instagram || null,
        },
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage('Something went wrong. Please try again.')
      return
    }

    setMessage(
      hasProfile
        ? 'Profile updated successfully.'
        : 'Profile created successfully.',
    )
    setHasProfile(true)
    setPhotoUrl(updatedPhotoUrl)
    setHasUnsavedChanges(false)
    setShowUpdateReminder(false)
    // Update the avatar URL in the header immediately
    updateAvatarUrl(updatedPhotoUrl)
    await refreshProfile()
  }

  const [saving, setSaving] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    setSaving(true)
    try {
      await handleSubmit(event)
    } finally {
      setSaving(false)
    }
  }

  const isSuccess = message.includes('successfully')

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Your profile"
        title={
          loading ? 'Profile' : hasProfile ? 'Update profile' : 'Create profile'
        }
        description="Your group sees your name and contact details once you are matched."
      />

      {showUpdateReminder && (
        <Alert tone="warning" className="mb-6">
          Don&apos;t forget to save your changes!
        </Alert>
      )}

      {loading ? (
        <Card
          padded
          className="flex items-center justify-center gap-3 py-12 text-stone"
        >
          <Spinner label="Loading profile" />
          <span className="text-[15px]">Loading profile...</span>
        </Card>
      ) : (
        <Card as="form" onSubmit={onSubmit}>
          <CardBody className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First name" htmlFor="firstname" required>
                <Input
                  id="firstname"
                  autoComplete="given-name"
                  value={firstname}
                  onChange={(e) => {
                    setFirstName(e.target.value)
                    markUnsaved()
                  }}
                  placeholder="Enter your first name"
                  required
                />
              </Field>
              <Field label="Last name" htmlFor="lastname" required>
                <Input
                  id="lastname"
                  autoComplete="family-name"
                  value={lastname}
                  onChange={(e) => {
                    setLastName(e.target.value)
                    markUnsaved()
                  }}
                  placeholder="Enter your last name"
                  required
                />
              </Field>
            </div>

            <Field label="School" htmlFor="school" required>
              <Select
                id="school"
                value={school}
                onChange={(e) => {
                  setSchool(e.target.value)
                  markUnsaved()
                }}
                required
              >
                <option value="" disabled>
                  Select your school
                </option>
                <option value="Pomona">Pomona College</option>
                <option value="Claremont McKenna">
                  Claremont McKenna College
                </option>
                <option value="Harvey Mudd">Harvey Mudd College</option>
                <option value="Scripps">Scripps College</option>
                <option value="Pitzer">Pitzer College</option>
              </Select>
            </Field>

            <Field label="Best email to contact" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  markUnsaved()
                }}
                placeholder="your.email@example.com"
                required
              />
            </Field>

            <Field label="Phone number" htmlFor="phonenumber" required>
              <Input
                id="phonenumber"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phonenumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value)
                  markUnsaved()
                }}
                placeholder="(123) 456-7890"
                required
              />
            </Field>

            <Checkbox
              id="sms-opt-in"
              label="Opt in to text messaging with ASPC"
              checked={smsOptIn}
              onChange={(e) => {
                setSmsOptIn(e.target.checked)
                markUnsaved()
              }}
            />

            {message && (
              <Alert tone={isSuccess ? 'success' : 'danger'}>{message}</Alert>
            )}
          </CardBody>

          <CardFooter className="flex-col items-stretch gap-4 sm:items-stretch">
            <Button type="submit" size="lg" fullWidth loading={saving}>
              {hasProfile ? 'Update profile' : 'Create profile'}
            </Button>
            <p className="text-xs leading-relaxed text-stone">
              By submitting this form and signing up for texts, I agree to
              receive conversational text messages from Associated Students of
              Pomona College (ASPC) using the contact information provided. For
              help, reply HELP. Opt out at any time by replying STOP. Message
              and data rates may apply. Message frequency varies. Please view
              our{' '}
              <a
                href={PRIVACY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-navy underline underline-offset-2 hover:text-sage"
              >
                Privacy Policy
              </a>
              .
            </p>
          </CardFooter>
        </Card>
      )}
    </PageContainer>
  )
}
