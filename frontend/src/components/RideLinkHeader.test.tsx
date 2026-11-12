import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import PickupHeader from './PickupHeader'

const mockAuth = jest.fn()
let mockPathname = '/'

jest.mock('@/hooks/useAuth', () => ({ useAuth: () => mockAuth() }))
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}))

const authState = (overrides: Record<string, unknown> = {}) => ({
  user: null,
  avatarUrl: null,
  isAdmin: false,
  isLoading: false,
  signOut: jest.fn().mockResolvedValue({ error: null }),
  signInWithGoogle: jest.fn(),
  ...overrides,
})

const student = { id: 'u1', email: 'ana@pickup.dev' }

describe('PickupHeader', () => {
  beforeEach(() => {
    mockPathname = '/'
  })

  it('offers sign in to signed-out visitors and opens the sign-in dialog', async () => {
    const user = userEvent.setup()
    mockAuth.mockReturnValue(authState())
    render(<PickupHeader />)

    expect(screen.queryByRole('link', { name: 'Dashboard' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('dialog', { name: /sign in/i })).toBeInTheDocument()
  })

  it('never renders the Dashboard link for students', () => {
    mockAuth.mockReturnValue(authState({ user: student }))
    render(<PickupHeader />)
    expect(screen.queryByRole('link', { name: 'Dashboard' })).toBeNull()
  })

  it('shows the Dashboard link to admins', () => {
    mockAuth.mockReturnValue(authState({ user: student, isAdmin: true }))
    render(<PickupHeader />)
    const links = screen.getAllByRole('link', { name: 'Dashboard' })
    expect(links[0]).toHaveAttribute('href', '/admin')
  })

  it('marks the current page in the navigation', () => {
    mockPathname = '/results'
    mockAuth.mockReturnValue(authState({ user: student }))
    render(<PickupHeader />)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).getByRole('link', { name: 'Results' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('opens the mobile menu and closes it with Escape', async () => {
    const user = userEvent.setup()
    mockAuth.mockReturnValue(authState({ user: student }))
    render(<PickupHeader />)

    const toggle = screen.getByRole('button', { name: 'Menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const menu = screen.getByRole('navigation', { name: 'Mobile' })
    expect(within(menu).getByRole('link', { name: 'Results' })).toBeVisible()

    await user.keyboard('{Escape}')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).toBeNull()
    expect(toggle).toHaveFocus()
  })
})
