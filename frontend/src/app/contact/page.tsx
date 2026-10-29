import { LifeBuoy, Mail, MessageSquare } from 'lucide-react'

import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageContainer, PageHeader } from '@/components/ui/PageHeader'

const SUPPORT_EMAIL = 'pickup.pai.47@gmail.com'

export default function Contact() {
  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Help"
        title="Contact us"
        description="We're here to help! Get in touch with our team for support or feedback."
      />

      <h2 className="text-lg font-semibold text-navy">How can we help you?</h2>
      <p className="mt-1 text-[15px] text-stone">
        Choose the option that best fits your needs
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Card padded className="flex flex-col">
          <LifeBuoy aria-hidden className="h-6 w-6 text-sage" />
          <h3 className="mt-3 font-semibold text-navy">Service help</h3>
          <p className="mt-1 flex-1 text-sm text-stone">
            Something wrong with a form, a match or your ride.
          </p>
          <ButtonLink
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-5 self-start"
          >
            Email support
          </ButtonLink>
        </Card>
        <Card padded className="flex flex-col">
          <MessageSquare aria-hidden className="h-6 w-6 text-sage" />
          <h3 className="mt-3 font-semibold text-navy">Share feedback</h3>
          <p className="mt-1 flex-1 text-sm text-stone">
            Tell us how your ride went so we can improve matching.
          </p>
          <ButtonLink
            href="/feedback"
            variant="secondary"
            className="mt-5 self-start"
          >
            Leave feedback
          </ButtonLink>
        </Card>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-lg border border-line bg-sunken p-5">
        <Mail aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-stone" />
        <div>
          <h3 className="font-semibold text-navy">Email support</h3>
          <p className="mt-1 text-sm text-stone">
            For technical issues or general questions:
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-1 inline-block break-all text-[15px] font-medium text-navy underline underline-offset-2 hover:text-sage"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>
    </PageContainer>
  )
}
