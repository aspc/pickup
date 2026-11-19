import { render, screen } from '@testing-library/react'

import { RideTicket } from './RideTicket'

describe('RideTicket', () => {
  it('reads campus to airport for rides to the airport', () => {
    render(
      <RideTicket
        date="2026-12-12"
        time="06:40"
        airport="LAX"
        toAirport
        status="matched"
      />,
    )
    const codes = screen.getAllByTestId('ride-code').map((el) => el.textContent)
    expect(codes).toEqual(['CLA', 'LAX'])
    expect(screen.getByLabelText('Claremont to LAX')).toBeInTheDocument()
    expect(screen.getByText('6:40 AM')).toBeInTheDocument()
  })

  it('reads airport to campus for rides back to campus', () => {
    render(
      <RideTicket
        date="2026-01-18"
        time={null}
        airport="ONT"
        toAirport={false}
        status="waiting"
      />,
    )
    const codes = screen.getAllByTestId('ride-code').map((el) => el.textContent)
    expect(codes).toEqual(['ONT', 'CLA'])
    expect(screen.getByLabelText('ONT to Claremont')).toBeInTheDocument()
  })

  it('shows the calendar date without shifting it across time zones', () => {
    render(
      <RideTicket
        date="2026-12-12"
        time={null}
        airport="LAX"
        toAirport
        status="matched"
      />,
    )
    expect(screen.getByText('Sat, Dec 12')).toBeInTheDocument()
  })

  it('shows the ride status and the stub', () => {
    render(
      <RideTicket
        date="2026-12-12"
        time={null}
        airport="LAX"
        toAirport
        status="matched"
        stub="Group of 4"
      />,
    )
    expect(screen.getByText('Matched')).toBeInTheDocument()
    expect(screen.getByText('Group of 4')).toBeInTheDocument()
  })
})
