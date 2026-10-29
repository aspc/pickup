import { NavLink } from '@/components/NavLink'

const FOOTER_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/faq', label: 'FAQ' },
  { href: '/aspc-info', label: 'ASPC Info' },
]

export default function PickupFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-stone">
          <span className="font-semibold tracking-[0.06em] text-navy">
            PICKUP
          </span>{' '}
          is a service of the Associated Students of Pomona College.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} variant="footer">
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </footer>
  )
}
