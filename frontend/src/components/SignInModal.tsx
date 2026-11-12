'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PRIVACY_URL, TERMS_URL } from '@/config/legalDocuments'

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  onSignIn: () => void | Promise<unknown>
}

function GoogleMark() {
  return (
    <svg aria-hidden className="h-[18px] w-[18px]" viewBox="0 0 48 48">
      <path
        fill="currentColor"
        d="M24 9.5c3.41 0 6.44 1.19 8.86 3.12l6.58-6.59C34.89 2.23 29.76 0 24 0 14.54 0 6.6 5.86 3.06 14.31l7.91 6.14C13.01 13.73 18.1 9.5 24 9.5z"
      />
      <path
        fill="currentColor"
        d="M46.5 24.42c0-1.55-.14-3.06-.4-4.42H24v8.34h12.91c-.58 3.16-2.18 5.79-4.53 7.57l7.32 5.66c4.27-3.94 6.8-9.73 6.8-16.15z"
      />
      <path
        fill="currentColor"
        d="M10.86 28.49C9.92 26.08 9.5 23.61 9.5 21s.42-5.08 1.36-7.49L3 7.37C.97 11.33 0 16 0 21s.97 9.67 3 13.63l7.86-6.14z"
      />
      <path
        fill="currentColor"
        d="M24 48c6.48 0 11.91-2.14 15.88-5.81l-7.32-5.66c-2.03 1.38-4.61 2.24-7.56 2.24-5.89 0-10.88-4.23-12.7-9.92l-7.91 6.14C6.6 42.14 14.54 48 24 48z"
      />
    </svg>
  )
}

export function GoogleSignInButton({
  onSignIn,
  label = 'Sign in with Google',
  size = 'lg',
  fullWidth = true,
}: {
  onSignIn: () => void | Promise<unknown>
  label?: string
  size?: 'md' | 'lg'
  fullWidth?: boolean
}) {
  return (
    <Button size={size} fullWidth={fullWidth} onClick={() => void onSignIn()}>
      <GoogleMark />
      {label}
    </Button>
  )
}

export default function SignInModal({
  isOpen,
  onClose,
  onSignIn,
}: SignInModalProps) {
  const legalLink =
    'font-medium text-navy underline underline-offset-2 hover:text-sage'

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="sm"
      title="Sign in to PICKUP"
      description="Use your college Google account."
    >
      <div className="space-y-4 pt-2">
        <GoogleSignInButton onSignIn={onSignIn} />
        <p className="text-[13px] leading-relaxed text-stone">
          By signing in, you agree to PICKUP&apos;s{' '}
          <Link
            href={TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={legalLink}
          >
            Terms &amp; Conditions
          </Link>{' '}
          and{' '}
          <Link
            href={PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={legalLink}
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </Modal>
  )
}
