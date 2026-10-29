'use client'

import Link from 'next/link'

import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface ConfirmCancelMatchProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isDeleting?: boolean
}

export default function ConfirmCancelMatch({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}: ConfirmCancelMatchProps) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Cancel match"
      description="Are you sure you want to cancel this match? This will remove you from your ride group."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            Keep match
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={isDeleting}>
            {isDeleting ? 'Cancelling...' : 'Yes, cancel match'}
          </Button>
        </>
      }
    >
      <Alert
        tone="warning"
        title="Fee policy reminder"
        action={
          <Link
            href="/aspc-fees"
            className="text-sm font-medium text-navy underline underline-offset-2 hover:text-sage"
          >
            View full fee policy
          </Link>
        }
      >
        <ul className="list-disc space-y-1 pl-4">
          <li>
            Cancellations after the matching deadline may incur a fee ($8 ONT /
            $20 LAX).
          </li>
          <li>
            To avoid a no-show fee ($15 ONT / $40 LAX), you must notify RideLink
            at least 1 hour before your scheduled ride.
          </li>
          <li>Cancelling here counts as proper notification to RideLink.</li>
        </ul>
      </Alert>
    </Modal>
  )
}
