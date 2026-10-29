'use client'

import { ChevronRight, LogOut, Menu, UserRound, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { NavLink } from '@/components/NavLink'
import SignInModal from '@/components/SignInModal'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { href: '/questionnaires', label: 'Forms' },
  { href: '/results', label: 'Results' },
  { href: '/unmatched', label: 'Unmatched' },
  { href: '/feedback', label: 'Feedback' },
]

const ADMIN_ITEM = { href: '/admin', label: 'Dashboard' }

export default function PickupHeader() {
  const { user, avatarUrl, isAdmin, isLoading, signOut, signInWithGoogle } =
    useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const menuToggleRef = useRef<HTMLButtonElement>(null)

  const navItems = isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMenuOpen) return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsMenuOpen(false)
      menuToggleRef.current?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isMenuOpen])

  const handleSignOut = async () => {
    setIsMenuOpen(false)
    const { error } = await signOut()
    if (!error) {
      router.refresh()
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-navy text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-3 rounded-md"
            aria-label="PICKUP home"
          >
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[10px] bg-white">
              <Image
                src="/favicon.png"
                alt=""
                width={36}
                height={36}
                priority
              />
            </span>
            <span className="leading-none">
              <span className="block text-[17px] font-bold tracking-[0.06em]">
                PICKUP
              </span>
              <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.14em] text-navy-200">
                by ASPC
              </span>
            </span>
          </Link>

          <nav
            aria-label="Main"
            className="hidden flex-1 items-center justify-center gap-7 md:flex"
          >
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} variant="header">
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {isLoading ? (
              <span aria-hidden className="h-9 w-9 rounded-full bg-navy-700" />
            ) : user ? (
              <>
                <Link
                  href="/profile"
                  aria-label="Profile"
                  className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-navy-500 transition-shadow hover:ring-sage-soft"
                >
                  {avatarUrl ? (
                    <Image
                      key={avatarUrl}
                      src={avatarUrl}
                      alt=""
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-navy-700 text-navy-100">
                      <UserRound aria-hidden className="h-5 w-5" />
                    </span>
                  )}
                </Link>
                <Button
                  variant="on-navy"
                  size="sm"
                  onClick={handleSignOut}
                  className="hidden md:inline-flex"
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                variant="on-navy"
                size="sm"
                onClick={() => setIsSignInOpen(true)}
              >
                Sign in
              </Button>
            )}
            <button
              ref={menuToggleRef}
              type="button"
              aria-label="Menu"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-md text-white transition-colors hover:bg-navy-700 md:hidden"
            >
              {isMenuOpen ? (
                <X aria-hidden className="h-6 w-6" />
              ) : (
                <Menu aria-hidden className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-16 z-30 animate-overlay-in overflow-y-auto bg-paper md:hidden"
        >
          <nav aria-label="Mobile" className="space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} variant="mobile">
                {item.label}
                <ChevronRight
                  aria-hidden
                  className="h-5 w-5 text-stone-light"
                />
              </NavLink>
            ))}
          </nav>
          <div className="mx-6 border-t border-line pt-4">
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="min-h-12 flex items-center gap-2 text-base font-medium text-danger"
              >
                <LogOut aria-hidden className="h-5 w-5" />
                Sign out
              </button>
            ) : (
              <Button
                fullWidth
                onClick={() => {
                  setIsMenuOpen(false)
                  setIsSignInOpen(true)
                }}
              >
                Sign in
              </Button>
            )}
          </div>
        </div>
      )}

      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSignIn={signInWithGoogle}
      />
    </>
  )
}
