import {
  ExternalLink,
  Info,
  HelpCircle,
  FileText,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'

import { PageContainer, PageHeader } from '@/components/ui/PageHeader'
import { PRIVACY_URL } from '@/config/legalDocuments'

interface ASPCLink {
  title: string
  description: string
  url: string
  icon: LucideIcon
  isInternal: boolean
}

export default function ASPCInfoPage() {
  const aspcLinks: ASPCLink[] = [
    {
      title: 'Quick Guide',
      description: 'Essential information for using ASPC RideLink',
      url: 'https://docs.google.com/document/d/e/2PACX-1vSEkEcvV6-2Fq9bb_F8-wqLrAAPi3fSBSCIGddqMlz2Zcdy6Z6AtDNBWU1cTEK7CbjnWW7anKUWrNY0/pub',
      icon: Info,
      isInternal: false,
    },
    {
      title: 'Frequently Asked Questions',
      description: 'Common questions and answers about the rideshare program',
      url: 'https://nam10.safelinks.protection.outlook.com/?url=https%3A%2F%2Fdocs.google.com%2Fdocument%2Fd%2Fe%2F2PACX-1vQCaNGg8mk5Pq7zqTLnz0lH7gZ7iI9mrEPdh3_LqpjpsgObauHmuow7ltqlrPPd--EEa2jDKffhZpXI%2Fpub&data=05%7C02%7Cjljz2022%40mymail.pomona.edu%7C50c1d711755241b1d90908ddfae05489%7C817f590439044ee8b3a5a65d4746ff70%7C0%7C0%7C638942563626043986%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=QefDaOTdSzIlUBAGv%2BSSgaXvTyyCm5q6rZ3GSnI0IwQ%3D&reserved=0',
      icon: HelpCircle,
      isInternal: false,
    },
    {
      title: 'Terms and Conditions',
      description: 'Official terms and conditions for ASPC RideLink',
      url: 'https://nam10.safelinks.protection.outlook.com/?url=https%3A%2F%2Fdocs.google.com%2Fdocument%2Fd%2Fe%2F2PACX-1vSnd4UeEvul3M6_L5rPr3z1Shzlccuqa0aP-O5eifF7p_BIzfc-lKrNwAG95lCb4LnOWDeZ-Zz2YRa9%2Fpub&data=05%7C02%7Cjljz2022%40mymail.pomona.edu%7C50c1d711755241b1d90908ddfae05489%7C817f590439044ee8b3a5a65d4746ff70%7C0%7C0%7C638942563626080129%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=AjkV%2BM0VA9lvyyIxGxI9%2Bnd5s8BKGrG3yOJJBxY3teY%3D&reserved=0',
      icon: FileText,
      isInternal: false,
    },
    {
      title: 'Delay Verification Form',
      description:
        'Required if you arrived late and had to be regrouped or used a contingency voucher',
      url: 'https://nam10.safelinks.protection.outlook.com/?url=https%3A%2F%2Fdocs.google.com%2Fforms%2Fd%2Fe%2F1FAIpQLSfmAK5eeJK1Z-zgH-5f3YLpD4sywjpsjYZwgiZPGlis5a-04A%2Fviewform%3Fusp%3Dheader&data=05%7C02%7Cjljz2022%40mymail.pomona.edu%7C50c1d711755241b1d90908ddfae05489%7C817f590439044ee8b3a5a65d4746ff70%7C0%7C0%7C638942563626061093%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=5bdAVhz3iu9YStgPNvKjEqLRB0wGEamZSfoD4xWEaYk%3D&reserved=0',
      icon: FileText,
      isInternal: false,
    },
    {
      title: 'Comments, Concerns & Feedback',
      description: 'Share your experience or report issues directly to ASPC',
      url: 'https://nam10.safelinks.protection.outlook.com/?url=https%3A%2F%2Fdocs.google.com%2Fforms%2Fd%2Fe%2F1FAIpQLSdQIA8K23k7M6O9X3KDQYHmM5GovKikVftZIV5m2QDqUFr2aA%2Fviewform%3Fusp%3Dheader&data=05%7C02%7Cjljz2022%40mymail.pomona.edu%7C50c1d711755241b1d90908ddfae05489%7C817f590439044ee8b3a5a65d4746ff70%7C0%7C0%7C638942563626096897%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=oQ7n8K5rUcvoD9BVd1n5dagWKQbOFI1nm3a1nHmizjY%3D&reserved=0',
      icon: MessageSquare,
      isInternal: false,
    },
  ]

  const policyLinks = [
    {
      title: 'Subsidy policy',
      description: 'PICKUP-specific subsidy information and guidelines',
      href: '/aspc-policy',
    },
    {
      title: 'Cancellation & change fees',
      description: 'Fee structure for cancellations and changes',
      href: '/aspc-fees',
    },
  ]

  const textLink =
    'font-medium text-navy underline underline-offset-2 hover:text-sage'

  return (
    <PageContainer width="prose">
      <PageHeader
        eyebrow="Pomona College"
        title="ASPC RideLink"
        description="Information & Resources for Pomona College Students"
      />

      <div className="rounded-lg bg-navy p-6 text-white">
        <p className="text-sm font-medium text-navy-200">
          Need day-of-travel RideLink support?
        </p>
        <p className="mt-1 text-lg font-semibold">
          Call/text:{' '}
          <a
            href="tel:9093475295"
            className="text-2xl underline decoration-sage-soft underline-offset-4"
          >
            909-347-5295
          </a>
        </p>
        <div className="mt-4 space-y-1 border-t border-navy-600 pt-4 text-sm text-navy-100">
          <p>
            <strong className="text-white">Email:</strong>{' '}
            <a
              href="mailto:ridelink@aspc.pomona.edu"
              className="text-white underline underline-offset-2"
            >
              ridelink@aspc.pomona.edu
            </a>
          </p>
          <p>For questions about ASPC&apos;s RideLink Program</p>
          <p>
            View our{' '}
            <a
              href={PRIVACY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline underline-offset-2"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {policyLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-start gap-4 rounded-lg border border-line bg-card p-5 shadow-card transition-colors hover:border-navy-300"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-sage-tint text-sage">
              <FileText aria-hidden className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-navy group-hover:underline">
                {link.title}
              </span>
              <span className="mt-0.5 block text-sm text-stone">
                {link.description}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-navy">Resources</h2>
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line bg-card">
        {aspcLinks.map((link) => {
          const IconComponent = link.icon
          return (
            <li key={link.title}>
              <a
                href={link.url}
                {...(link.isInternal
                  ? {}
                  : { target: '_blank', rel: 'noopener noreferrer' })}
                className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-paper"
              >
                <IconComponent
                  aria-hidden
                  className="mt-0.5 h-5 w-5 shrink-0 text-stone"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 font-medium text-navy">
                    {link.title}
                    {!link.isInternal && (
                      <ExternalLink
                        aria-label="Opens in a new tab"
                        className="h-3.5 w-3.5 shrink-0 text-stone-light"
                      />
                    )}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-stone">
                    {link.description}
                  </span>
                </span>
              </a>
            </li>
          )
        })}
      </ul>

      <h2 className="mt-10 text-lg font-semibold text-navy">
        Important information
      </h2>
      <ul className="mt-4 list-disc space-y-3 pl-5 text-[15px] leading-relaxed text-ink marker:text-sage">
        <li>
          <strong className="font-semibold text-navy">Pickup Location:</strong>{' '}
          647 College Way (in front of Lincoln Hall east entrance)
        </li>
        <li>
          <strong className="font-semibold text-navy">Uber Vouchers:</strong>{' '}
          Geofenced to only allow pickup within 250 ft of the designated
          location
        </li>
        <li>
          <strong className="font-semibold text-navy">Safety:</strong> For
          emergencies, call 911 (off-campus) or Campus Safety at (909) 607-2000
          (on-campus)
        </li>
      </ul>

      <p className="mt-10 text-sm text-stone">
        This page provides quick access to ASPC&apos;s official RideLink
        resources. External links open in new tabs. Questions about PICKUP
        itself?{' '}
        <Link href="/contact" className={textLink}>
          Contact us
        </Link>
        .
      </p>
    </PageContainer>
  )
}
