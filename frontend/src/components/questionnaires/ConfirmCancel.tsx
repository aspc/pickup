import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface ConfirmCancelProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function ConfirmCancel({
  isOpen,
  onClose,
  onConfirm,
}: ConfirmCancelProps) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="sm"
      title="Confirm cancellation"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Confirm
          </Button>
        </>
      }
    >
      Are you sure you want to cancel this form? This action cannot be undone.
    </Modal>
  )
}
