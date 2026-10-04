import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { ROUTES } from '@/lib/constants'
import { EVENT_CATEGORY_LABEL, EVENT_CATEGORIES } from '@/types/event'

const RESOURCE_LINKS = [
  { href: ROUTES.events, label: 'All events' },
  { href: ROUTES.howItWorks, label: 'How it works' },
  { href: ROUTES.bookings, label: 'My bookings' },
  { href: ROUTES.profile, label: 'Profile' },
] as const

/**
 * Site footer.
 *
 * Sitemap-shaped rather than decorative: every category links to a pre-filtered
 * catalogue with a canonical query string, which is both a genuine convenience
 * and a clean internal-linking structure.
 */
export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-white/8 bg-carbon/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo size={30} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-mute">
              Real-time seat selection with concurrency-safe holds. Choose your exact
              seat, pay once, arrive with the ticket already on your phone.
            </p>
          </div>

          <nav aria-labelledby="footer-explore">
            <h2
              id="footer-explore"
              className="font-mono text-2xs uppercase tracking-[0.18em] text-ink-faint"
            >
              Explore
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded-xs text-sm text-ink-mute transition-colors hover:text-gold-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-categories">
            <h2
              id="footer-categories"
              className="font-mono text-2xs uppercase tracking-[0.18em] text-ink-faint"
            >
              Categories
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {EVENT_CATEGORIES.map((category) => (
                <li key={category}>
                  <Link
                    href={`${ROUTES.events}?category=${category}`}
                    className="rounded-xs text-sm text-ink-mute transition-colors hover:text-gold-200"
                  >
                    {EVENT_CATEGORY_LABEL[category]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-mono text-2xs uppercase tracking-[0.18em] text-ink-faint">
              Fair-play policy
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-ink-mute">
              <li>Seats held for 10 minutes while you pay.</li>
              <li>Maximum 6 seats per booking.</li>
              <li>Refunds issued to the original instrument.</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-2xs uppercase tracking-[0.16em] text-ink-faint">
            © {year} Ticket Flow — demonstration build
          </p>
          <p className="text-xs text-ink-faint">
            Payments run in test mode. No real money moves and no real seats are sold.
          </p>
        </div>
      </div>
    </footer>
  )
}