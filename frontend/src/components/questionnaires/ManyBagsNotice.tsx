import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface ManyBagsNoticeProps {
  open: boolean
  onConfirm: () => void // when they choose to proceed
  onCancel: () => void // when they choose to go back and edit
}

export default function ManyBagsNotice({
  open,
  onConfirm,
  onCancel,
}: ManyBagsNoticeProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      title="Extra bags notice"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Edit match form
          </Button>
          <Button onClick={onConfirm}>Okay</Button>
        </>
      }
    >
      You&apos;ve entered 4 or more bags. Please note that you will likely have
      to get an Uber/Lyft XL (which will likely cost more). Please confirm this
      is correct.
    </Modal>
  )
}
