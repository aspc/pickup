import Image from 'next/image'

import { Card } from '@/components/ui/Card'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'

const TIMELINE = [
  { when: 'Months in advance', what: 'Book your flight.' },
  {
    when: '14 days',
    what: 'Complete RideLink questionnaire.',
    note: 'Anytime between booking and 7 days before',
  },
  { when: '3 days', what: 'Receive your match and contact.' },
  { when: '0 days!', what: 'Get PICKed UP! Fill out feedback.' },
]

export default function About() {
  return (
    <PageContainer width="prose">
      <PageHeader
        eyebrow="About"
        title="About RideLink"
        description="Making airport travel affordable and accessible for the 5C community."
      />

      <div className="space-y-5 text-[17px] leading-relaxed text-ink">
        <p>
          No student should pay $100+ for a solo ride to LAX. While the
          Claremont Colleges sometimes provide shuttles, they&apos;re often
          limited. That&apos;s where RideLink comes in.
        </p>
        <p>
          We&apos;re a student-led team making travel more affordable and
          accessible for the 5C community. Our platform matches students with
          similar flight plans so you can share rides and split costs.
        </p>
        <p>
          The idea for RideLink was born out of personal frustration. After
          struggling to find affordable airport transportation ourselves, we
          realized there was a better solution waiting to be built. With the
          help of our loving and dedicated engineering team, we&apos;ve been
          working on this platform throughout the year.
        </p>
        <p className="font-display text-xl text-navy">
          Whether it&apos;s your first ride or your fiftieth, we hope RideLink
          makes your journey a little easier.
        </p>
      </div>

      <section className="mt-14">
        <h2 className="font-display text-3xl font-semibold text-navy">
          How it works
        </h2>
        <p className="mt-2 text-[15px] text-stone">Countdown to flight:</p>
        <ol className="mt-6 space-y-0">
          {TIMELINE.map((step, index) => (
            <li key={step.when} className="relative flex gap-4 pb-6 last:pb-0">
              {index < TIMELINE.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-[15px] top-9 h-[calc(100%-2.25rem)] w-px bg-line-strong"
                />
              )}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
                {index + 1}
              </span>
              <div className="pt-1">
                <h3 className="font-semibold text-navy">{step.when}</h3>
                <p className="mt-0.5 text-[15px] text-ink">{step.what}</p>
                {step.note && (
                  <p className="mt-1 text-sm text-stone">{step.note}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-3xl font-semibold text-navy">
          Meet our team
        </h2>
        <p className="mt-2 text-[15px] text-stone">
          Built by students, for students. Special thanks to our incredible
          engineering team!
        </p>

        <Card className="mt-6 overflow-hidden">
          <Image
            src="/images/teampic.jpg"
            alt="RideLink Engineering Team"
            width={800}
            height={600}
            className="h-auto w-full object-cover"
          />
          <div className="space-y-4 p-5 sm:p-6">
            <p className="text-sm text-stone">
              Our engineers (top to bottom, left to right):
              <span className="mt-1 block font-medium text-ink">
                Haram Yoon, Henok Dawite, Francisco Morales (Lead ML), Yunju
                Song, Julianne Louie (Lead SWE), Kellie Au, Josh Oyadomari-Chun,
                Melinda Deng
              </span>
            </p>
            <div className="border-t border-line pt-4">
              <p className="text-sm text-stone">Cofounders</p>
              <p className="mt-0.5 font-semibold text-navy">
                Julianne Louie & Francisco Morales
              </p>
            </div>
          </div>
        </Card>

        <p className="mt-6 rounded-lg bg-sage-tint px-5 py-4 text-[15px] leading-relaxed text-ink">
          Thank you to our amazing team for helping us build the foundation of
          RideLink. Your contributions made this platform possible for the 5C
          community!
        </p>
      </section>
    </PageContainer>
  )
}
