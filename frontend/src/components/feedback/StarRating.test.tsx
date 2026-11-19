import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import StarRating from './StarRating'

function Harness({ initial = 0 }: { initial?: number }) {
  const [rating, setRating] = useState(initial)
  return <StarRating rating={rating} onChange={setRating} label="Driver" />
}

describe('StarRating', () => {
  it('exposes the stars as a labelled radio group', () => {
    render(<Harness initial={3} />)
    expect(
      screen.getByRole('radiogroup', { name: 'Driver' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '3 stars' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '1 star' })).not.toBeChecked()
  })

  it('changes the rating with arrow keys', async () => {
    const user = userEvent.setup()
    render(<Harness initial={2} />)

    screen.getByRole('radio', { name: '2 stars' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: '3 stars' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '3 stars' })).toHaveFocus()

    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(screen.getByRole('radio', { name: '1 star' })).toBeChecked()
  })

  it('sets the rating on click', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('radio', { name: '5 stars' }))
    expect(screen.getByRole('radio', { name: '5 stars' })).toBeChecked()
  })
})
