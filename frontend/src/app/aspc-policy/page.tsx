import { Lightbulb } from 'lucide-react'
import Link from 'next/link'

import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'
import {
  formatDeadlineForDisplay,
  formatSubsidizedWindowsForDisplay,
} from '@/config/servicePeriodHelpers'
import { SERVICE_PERIODS } from '@/config/servicePeriods'

const textLink =
  'font-medium text-navy underline underline-offset-2 hover:text-sage'

export default function ASPCPolicy() {
  const activePeriod = SERVICE_PERIODS[SERVICE_PERIODS.length - 1]

  return (
    <PageContainer width="prose">
      <PageHeader
        eyebrow="ASPC RideLink"
        title="ASPC RideLink policy"
        description="2025-2026 Operational Guidelines"
      />

      <Alert tone="info">
        <strong>Questions?</strong> Contact{' '}
        <a href="mailto:ridelink@aspc.pomona.edu" className={textLink}>
          ridelink@aspc.pomona.edu
        </a>
        . View{' '}
        <Link href="/aspc-fees" className={textLink}>
          Cancellation & Change Fees
        </Link>
        .
      </Alert>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-navy">
          Operational periods
        </h2>
        {activePeriod && (
          <Card padded className="mt-4">
            <h3 className="text-lg font-semibold text-navy">
              {activePeriod.name}
            </h3>
            <dl className="mt-4 space-y-4 text-[15px]">
              <div>
                <dt className="font-medium text-ink">Deadline to request:</dt>
                <dd className="mt-0.5 text-stone">
                  {formatDeadlineForDisplay(activePeriod.deadline)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-ink">Service window:</dt>
                <dd>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-stone marker:text-sage">
                    {formatSubsidizedWindowsForDisplay(activePeriod).map(
                      (line) => (
                        <li key={line}>{line}</li>
                      ),
                    )}
                  </ul>
                </dd>
              </div>
            </dl>
          </Card>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-navy">
          How matching works
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink">
          RideLink covers rides only when groups can be formed:{' '}
          <strong className="font-semibold">2+ riders to ONT</strong> or{' '}
          <strong className="font-semibold">3+ riders to LAX</strong>.
        </p>
        <div className="mt-4 rounded-lg border border-line bg-card p-5">
          <p className="flex items-center gap-2 font-semibold text-navy">
            <Lightbulb aria-hidden className="h-5 w-5 text-sage" />
            Tips to increase your matching odds
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink marker:text-sage">
            <li>
              <strong className="font-semibold">
                Travel during common times:
              </strong>{' '}
              Daytime hours and within ±1 day of the start or end of the break
            </li>
            <li>
              <strong className="font-semibold">Be flexible:</strong> Provide a
              wide range of availability and be willing to arrive at the airport
              earlier than necessary
            </li>
            <li>
              <strong className="font-semibold">Encourage friends:</strong> More
              riders = more matches! Get your friends to sign up
            </li>
          </ul>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-stone">
          If a sufficient group cannot be formed, RideLink will be unable to
          cover the ride. However, you may still use RideLink to coordinate
          non-subsidized carpools.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-navy">
          Important notes
        </h2>
        <ul className="mt-3 list-disc space-y-3 pl-5 text-[15px] leading-relaxed text-ink marker:text-sage">
          <li>
            <strong className="font-semibold">Ride Scheduling:</strong> Ride
            times are assigned to increase shared ridership and ensure efficient
            use of the program&apos;s budget.
          </li>
          <li>
            Your scheduled ride may depart earlier than the latest possible time
            you could leave for your flight. Students should plan accordingly
            when booking flights.
          </li>
        </ul>
      </section>
    </PageContainer>
  )
}
