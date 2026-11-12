import { Check, Mail, Phone, FileText, X } from 'lucide-react'

import { Alert } from '@/components/ui/Alert'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'

const textLink =
  'font-medium text-navy underline underline-offset-2 hover:text-sage'

const FEES = [
  {
    label: 'Cancellation fee',
    detail: 'Cancelling after the matching deadline',
    ont: '$8',
    lax: '$20',
  },
  {
    label: 'No-show fee',
    detail:
      'If you do not show up and fail to notify RideLink at least one hour before your scheduled ride',
    ont: '$15',
    lax: '$40',
  },
]

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-2xl font-semibold text-navy">
      {children}
    </h2>
  )
}

export default function ASPCFees() {
  return (
    <PageContainer width="prose">
      <PageHeader
        eyebrow="ASPC RideLink"
        title="Cancellation & change fees"
        description="ASPC RideLink Fee Policy"
      />

      <Alert tone="info">
        <strong>Questions?</strong> Contact{' '}
        <a href="mailto:ridelink@aspc.pomona.edu" className={textLink}>
          ridelink@aspc.pomona.edu
        </a>{' '}
        or call/text{' '}
        <a href="tel:9093475295" className={textLink}>
          (909) 347-5295
        </a>
      </Alert>

      <section className="mt-10">
        <SectionHeading>Airline-initiated changes</SectionHeading>
        <p className="mt-3 text-[17px] font-medium text-ink">
          Airline-initiated changes are never subject to cancellation fees.
        </p>
        <ul className="mt-3 space-y-2 text-[15px] text-ink">
          <li className="flex items-start gap-2">
            <Check aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
            You may take your original ride or cancel with no fee.
          </li>
          <li className="flex items-start gap-2">
            <X aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            Failure to notify RideLink will result in a no-show fee.
          </li>
        </ul>
        <Card padded className="mt-5 space-y-3 text-[15px] leading-relaxed">
          <p className="font-semibold text-navy">
            Important policy differences
          </p>
          <p className="text-ink">
            <strong className="font-semibold">
              Outbound trips (to airport):
            </strong>{' '}
            RideLink cannot accommodate regrouping for delays or cancellations.
          </p>
          <p className="text-ink">
            <strong className="font-semibold">
              Inbound trips (from airport):
            </strong>{' '}
            For delays or cancellations, complete the delay verification form
            and RideLink will:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-ink marker:text-sage">
            <li>Attempt to regroup you, or</li>
            <li>Issue a contingency voucher if regrouping is not possible.</li>
          </ul>
        </Card>
      </section>

      <section className="mt-10">
        <SectionHeading>Student-initiated changes (voluntary)</SectionHeading>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-sage/25 bg-sage-tint p-5">
            <h3 className="font-semibold text-navy">
              Before matching deadline
            </h3>
            <p className="mt-2 text-[15px] text-ink">
              You may update your request or cancel with{' '}
              <strong className="font-semibold">no fee</strong>.
            </p>
            <p className="mt-2 text-sm text-ink/80">
              Make changes freely through the RideLink dashboard before the
              deadline for your break period.
            </p>
          </div>
          <div className="rounded-lg border border-warning/20 bg-warning-tint p-5">
            <h3 className="font-semibold text-navy">After matching deadline</h3>
            <p className="mt-2 text-[15px] text-ink">
              Changes cannot be accommodated; the standard cancellation fees
              apply.
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-lg border border-line bg-card">
          <table className="w-full text-left text-[15px]">
            <thead>
              <tr className="border-b border-line bg-paper text-sm text-stone">
                <th scope="col" className="px-5 py-3 font-medium">
                  Fee
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-right font-medium sm:px-5"
                >
                  <abbr title="Ontario" className="no-underline">
                    ONT
                  </abbr>
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-right font-medium sm:px-5"
                >
                  <abbr title="Los Angeles" className="no-underline">
                    LAX
                  </abbr>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {FEES.map((fee) => (
                <tr key={fee.label}>
                  <th
                    scope="row"
                    className="py-4 pl-5 pr-2 align-top font-normal"
                  >
                    <span className="block font-semibold text-navy">
                      {fee.label}
                    </span>
                    <span className="mt-0.5 block text-sm text-stone">
                      {fee.detail}
                    </span>
                  </th>
                  <td className="px-3 py-4 text-right align-top text-xl font-semibold tabular-nums text-navy sm:px-5">
                    {fee.ont}
                  </td>
                  <td className="px-3 py-4 text-right align-top text-xl font-semibold tabular-nums text-navy sm:px-5">
                    {fee.lax}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <SectionHeading>Important rules</SectionHeading>
        <ul className="mt-3 list-disc space-y-3 pl-5 text-[15px] leading-relaxed text-ink marker:text-sage">
          <li>
            To qualify as a{' '}
            <strong className="font-semibold">cancellation</strong> (rather than
            a no-show), you must notify RideLink directly or complete the online
            form at least{' '}
            <strong className="font-semibold">one hour in advance</strong>.
          </li>
          <li>
            Notifying only your group members{' '}
            <strong className="font-semibold">does not qualify</strong> as
            proper notification to RideLink.
          </li>
          <li>
            All fees must be paid before you can request future RideLink
            services.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <SectionHeading>How to cancel or report changes</SectionHeading>
        <p className="mt-3 text-[15px] font-medium text-ink">
          Contact RideLink as soon as possible:
        </p>
        <ul className="mt-3 space-y-3 text-[15px] text-ink">
          <li className="flex items-start gap-3">
            <Mail aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-stone" />
            <span>
              Email:{' '}
              <a href="mailto:ridelink@aspc.pomona.edu" className={textLink}>
                ridelink@aspc.pomona.edu
              </a>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <Phone aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-stone" />
            <span>
              Call/Text:{' '}
              <a href="tel:9093475295" className={textLink}>
                (909) 347-5295
              </a>{' '}
              <span className="text-sm text-stone">
                (Phone support available from U.S./Canada only)
              </span>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <FileText
              aria-hidden
              className="mt-0.5 h-5 w-5 shrink-0 text-stone"
            />
            <span>
              For inbound flight delays/cancellations: Complete the delay
              verification form (link provided in your match email)
            </span>
          </li>
        </ul>
        <Alert tone="warning" className="mt-5">
          <strong>Remember:</strong> You must notify RideLink at least 1 hour
          before your scheduled ride to avoid no-show fees!
        </Alert>
      </section>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-line pt-6">
        <ButtonLink href="/aspc-policy">View operational policy</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Back to home
        </ButtonLink>
      </div>
    </PageContainer>
  )
}
