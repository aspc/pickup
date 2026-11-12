'use client'

import {
  ArrowRight,
  Check,
  PiggyBank,
  PlaneTakeoff,
  ShieldCheck,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { GoogleSignInButton } from '@/components/SignInModal'
import { Button } from '@/components/ui/Button'
import { RideTicket } from '@/components/ui/RideTicket'
import { PRIVACY_URL, TERMS_URL } from '@/config/legalDocuments'
import { useAuth } from '@/hooks/useAuth'
import { validateUserProfile } from '@/utils/profileValidation'

const FEATURES = [
  {
    icon: Users,
    title: 'Smart matching',
    body: 'Our algorithm matches you with fellow travelers heading to the same airport at similar times.',
  },
  {
    icon: PiggyBank,
    title: 'Split costs',
    body: 'Share the fare with your group and save up to 70% on airport transportation, while making new connections.',
  },
  {
    icon: ShieldCheck,
    title: 'Safe and reliable',
    body: 'All users are verified through Google authentication, ensuring a safe and trustworthy experience for everyone.',
  },
]

const STEPS = [
  'Complete your profile',
  'Submit your flight details',
  'Get matched 3 days before you fly',
]

export default function Index() {
  const { user, signInWithGoogle } = useAuth()
  const router = useRouter()

  const handleGetStarted = async () => {
    if (!user) {
      // If not logged in, redirect to sign in
      await signInWithGoogle()
      return
    }

    try {
      // Check if profile is complete
      const profileStatus = await validateUserProfile(user)

      if (profileStatus.hasCompleteProfile) {
        // Profile is complete, go to questionnaire
        router.push('/questionnaires')
      } else {
        // Profile is incomplete, go to profile page
        router.push('/profile')
      }
    } catch (error) {
      console.error('Error checking profile status:', error)
      // Fallback to profile page if there's an error
      router.push('/profile')
    }
  }

  const primaryAction = (size: 'md' | 'lg') =>
    user ? (
      <Button size={size} onClick={handleGetStarted}>
        Get started
        <ArrowRight aria-hidden className="h-[18px] w-[18px]" />
      </Button>
    ) : (
      <GoogleSignInButton
        onSignIn={handleGetStarted}
        size={size}
        fullWidth={false}
      />
    )

  const legalLink =
    'font-medium text-navy underline underline-offset-2 hover:text-sage'

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-24">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-sage">
            ASPC RideLink
          </p>
          <h1 className="font-display text-[42px] font-semibold leading-[1.05] text-navy sm:text-6xl">
            Split the ride to the airport.
          </h1>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-stone sm:text-lg">
            Why pay $100+ for a ride to the airport? Tell us your flight and we
            will group you with fellow students leaving around the same time, so
            you split the cost and share the journey.
          </p>
          <div className="mt-8 flex flex-col items-start gap-4">
            {primaryAction('lg')}
            {!user && (
              <p className="max-w-md text-[13px] leading-relaxed text-stone">
                By signing in, you agree to RideLink&apos;s{' '}
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
            )}
          </div>
        </div>

        {/* Example ride, purely illustrative */}
        <div
          aria-hidden
          className="relative mx-auto w-full max-w-sm lg:max-w-md"
        >
          <div className="absolute -inset-x-2 -inset-y-3 -z-10 rounded-[24px] bg-sage-tint sm:-inset-6 sm:rounded-[28px]" />
          <RideTicket
            date="2026-12-12"
            time="06:40"
            airport="LAX"
            toAirport
            status="matched"
            stub="Group of 4 · Uber XL"
          >
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1">
                {['AK', 'JM', 'SL', 'RT'].map((initials, index) => (
                  <span
                    key={initials}
                    className={
                      index % 2 === 0
                        ? 'flex h-8 w-8 items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-white ring-2 ring-card'
                        : 'flex h-8 w-8 items-center justify-center rounded-full bg-sage text-[11px] font-semibold text-white ring-2 ring-card'
                    }
                  >
                    {initials}
                  </span>
                ))}
              </div>
              <span className="text-sm text-stone">Your ride group</span>
            </div>
          </RideTicket>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold text-navy sm:text-4xl">
              How RideLink works
            </h2>
            <p className="mt-3 text-[17px] leading-relaxed text-stone">
              Simple, safe and affordable airport transportation that connects
              you with fellow travelers.
            </p>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-sage-tint text-sage">
                  <Icon aria-hidden className="h-[22px] w-[22px]" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-navy">
                  {title}
                </h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-stone">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps + CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 rounded-xl bg-navy px-6 py-10 text-white sm:px-10 sm:py-12 lg:grid-cols-2 lg:items-center">
          <div>
            <PlaneTakeoff aria-hidden className="h-8 w-8 text-sage-soft" />
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl">
              Ready to save on your next airport trip?
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-navy-200">
              Free to use. Questions first? Read the{' '}
              <Link
                href="/faq"
                className="font-medium text-white underline underline-offset-2"
              >
                FAQ
              </Link>{' '}
              or the{' '}
              <Link
                href="/aspc-info"
                className="font-medium text-white underline underline-offset-2"
              >
                ASPC program info
              </Link>
              .
            </p>
          </div>
          <div>
            <ol className="space-y-3">
              {STEPS.map((step, index) => (
                <li key={step} className="flex items-center gap-3 text-[15px]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-700 text-[13px] font-semibold text-sage-soft">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-8">
              <Button variant="accent" size="lg" onClick={handleGetStarted}>
                {user ? 'Start your journey' : 'Get started free'}
                <ArrowRight aria-hidden className="h-[18px] w-[18px]" />
              </Button>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-navy-200">
              {['Free to use', 'Secure and verified', 'Save up to 70%'].map(
                (item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check aria-hidden className="h-4 w-4 text-sage-soft" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
