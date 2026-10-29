'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export type SubmitSuccessVariant = 'success' | 'legal_log_failed'

interface SubmitSuccessProps {
  isOpen: boolean
  onClose: () => void
  route: string
  variant?: SubmitSuccessVariant
  /** Shown when variant is legal_log_failed so support can locate the flight row */
  reportFlightId?: number | null
}

const RIDELINK_EMAIL = 'ridelink@aspc.pomona.edu'

const SubmitSuccess: React.FC<SubmitSuccessProps> = ({
  isOpen,
  onClose,
  route,
  variant = 'success',
  reportFlightId = null,
}) => {
  const router = useRouter()

  if (!isOpen) return null

  const handleOkay = () => {
    onClose()
    router.push(route)
  }

  if (variant === 'legal_log_failed') {
    const idLine =
      reportFlightId != null && Number.isFinite(reportFlightId)
        ? `Please include this flight ID in your email: ${reportFlightId}`
        : 'Please include your name and flight details in your email so we can locate your request.'

    const mailHref =
      reportFlightId != null && Number.isFinite(reportFlightId)
        ? `mailto:${RIDELINK_EMAIL}?subject=${encodeURIComponent(
            `RideLink: T&C log error - flight ${reportFlightId}`,
          )}&body=${encodeURIComponent(
            `Hello,\n\nMy ride request was saved, but the app reported an error logging my acceptance of the Terms & Conditions and Privacy Notice.\n\nFlight ID: ${reportFlightId}\n\n`,
          )}`
        : `mailto:${RIDELINK_EMAIL}?subject=${encodeURIComponent(
            'RideLink: T&C log error',
          )}&body=${encodeURIComponent(
            'Hello,\n\nMy ride request was saved, but the app reported an error logging my acceptance of the Terms & Conditions and Privacy Notice.\n\n',
          )}`

    return (
      <Modal
        open
        onClose={handleOkay}
        title="Ride request saved, one more step"
        footer={<Button onClick={handleOkay}>Continue to my forms</Button>}
      >
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            Your flight details were saved, but we hit an error while recording
            your acceptance of the Terms & Conditions and Privacy Notice in our
            system. That log is required for your records.
          </p>
          <p className="font-medium text-navy">{idLine}</p>
          <p>
            Email{' '}
            <a
              href={mailHref}
              className="font-medium text-navy underline underline-offset-2 hover:text-sage"
            >
              {RIDELINK_EMAIL}
            </a>{' '}
            so we can complete the acceptance log for your account.
          </p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={handleOkay}
      size="sm"
      title="Flight details submitted successfully!"
      footer={<Button onClick={handleOkay}>Okay</Button>}
    >
      You may edit or delete this form up to 7 days before your requested ride
      share. You will receive an email with your match details at least 3 days
      before your requested ride share date.
    </Modal>
  )
}

export default SubmitSuccess
