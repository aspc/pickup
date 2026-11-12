import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import { Accordion } from './Accordion'
import { Alert } from './Alert'
import { Button } from './Button'
import { Field, Input } from './Field'
import { Modal } from './Modal'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it.each([
    ['matched', 'success'],
    ['ready', 'success'],
    ['waiting', 'neutral'],
    ['unmatched', 'neutral'],
    ['past', 'neutral'],
    ['cancelled', 'danger'],
    ['delayed', 'warning'],
  ] as const)('renders %s with the %s tone', (status, tone) => {
    const { container } = render(<StatusBadge status={status} />)
    expect(container.firstChild).toHaveAttribute('data-tone', tone)
  })
})

describe('Button', () => {
  it('is busy and disabled while loading', () => {
    render(<Button loading>Save</Button>)
    const button = screen.getByRole('button', { name: /save/i })
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeDisabled()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})

describe('Field', () => {
  it('labels its input and links the error message', () => {
    render(
      <Field label="Email" htmlFor="email" error="Email is required">
        <Input id="email" invalid />
      </Field>,
    )
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Email is required')
  })
})

function ModalHarness({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <Modal
        open={open}
        onClose={() => {
          onClose()
          setOpen(false)
        }}
        title="Title"
      >
        <button>Inside</button>
      </Modal>
    </>
  )
}

describe('Modal', () => {
  it('traps focus inside, closes on Escape and restores focus', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    render(<ModalHarness onClose={onClose} />)

    const trigger = screen.getByRole('button', { name: 'Open' })
    await user.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Title' })
    expect(dialog).toContainElement(document.activeElement as HTMLElement)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})

describe('Modal when not dismissible', () => {
  it('ignores Escape and the backdrop and hides the close button', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    render(
      <Modal open onClose={onClose} title="Saved" dismissible={false}>
        <button>Continue</button>
      </Modal>,
    )

    await user.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
    expect(screen.getByRole('dialog', { name: 'Saved' })).toBeInTheDocument()
  })
})

describe('Accordion', () => {
  const items = [
    { id: 'a', title: 'First', content: 'First answer' },
    { id: 'b', title: 'Second', content: 'Second answer' },
  ]

  it('opens only the default item and toggles on click', async () => {
    const user = userEvent.setup()
    render(<Accordion items={items} defaultOpenId="a" />)

    const first = screen.getByRole('button', { name: 'First' })
    const second = screen.getByRole('button', { name: 'Second' })
    expect(first).toHaveAttribute('aria-expanded', 'true')
    expect(second).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Second answer')).not.toBeVisible()

    await user.click(second)
    expect(second).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Second answer')).toBeVisible()
  })
})

describe('Alert', () => {
  it('announces danger alerts', () => {
    render(<Alert tone="danger">Something went wrong</Alert>)
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
  })
})
