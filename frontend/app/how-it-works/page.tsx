import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BadgeCheckIcon,
  CreditCardIcon,
  MapPinIcon,
  MousePointerClickIcon,
  RadioIcon,
  ShieldCheckIcon,
  TimerIcon,
} from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { SectionHeading } from '@/components/layout/section-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MAX_SEATS_PER_BOOKING, ROUTES, SEAT_HOLD_TTL_SECONDS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'From seat map to scanned ticket: how Ticket Flow holds your seat, takes payment in test mode and issues a verifiable ticket.',
  alternates: { canonical: '/how-it-works' },
}

const STEPS = [
  {
    icon: MapPinIcon,
    step: '01',
    title: 'Pick the event and the exact seat',
    body: 'Every event has a real venue plan. Rows, tiers and prices are shown before you commit, so there is no guesswork about what you are paying for.',
    note: 'Up to 6 seats in a single order.',
  },
  {
    icon: MousePointerClickIcon,
    step: '02',
    title: 'We hold the seat for you',
    body: 'Choosing a seat takes a distributed lock rather than a plain database flag. Two people cannot hold the same seat, even if they click at the same instant.',
    note: `${SEAT_HOLD_TTL_SECONDS / 60} minutes to complete payment.`,
  },
  {
    icon: RadioIcon,
    step: '03',
    title: 'Availability stays live',
    body: 'Seats taken by other customers appear greyed out on your map immediately, without refreshing. If someone tries to take a seat you hold, you are told before you pay.',
    note: 'Updates arrive over a WebSocket channel.',
  },
  {
    icon: CreditCardIcon,
    step: '04',
    title: 'Pay in test mode',
    body: 'Card, UPI and net banking all run against sandbox instruments. Nothing is charged and no real card details are ever handled by this frontend.',
    note: 'Test card 4242 4242 4242 4242.',
  },
  {
    icon: BadgeCheckIcon,
    step: '05',
    title: 'Tickets are issued instantly',
    body: 'Payment success turns the hold into a confirmed booking and prints one ticket per seat, each with its own barcode and price tier.',
    note: 'Re-open them any time from My bookings.',
  },
  {
    icon: ShieldCheckIcon,
    step: '06',
    title: 'Scan at the gate',
    body: 'Each ticket carries a unique token. Scanning validates that exact seat for that exact booking, so a duplicated or voided ticket fails at the door.',
    note: 'Used tickets are marked, not deleted.',
  },
] as const

const GUARANTEES = [
  {
    title: 'No double bookings',
    body: 'Seat holds use an atomic compare-and-set with an optimistic concurrency version. If the version moved underneath you, the hold is refused rather than silently overwriting someone else.',
  },
  {
    title: 'Nothing charged on failure',
    body: 'The booking commits only after the payment gateway reports success. If the commit fails, the hold is released and the seat returns to the pool.',
  },
  {
    title: 'Cancelling releases inventory',
    body: 'Cancelled and expired holds return their seats to the live map immediately, so the next customer sees them as available.',
  },
] as const

export default function HowItWorksPage() {
  return (
    <PageShell>
      <div className="py-10 sm:py-12">
        <SectionHeading
          as="h1"
          eyebrow="How Ticket Flow works"
          title="Pick a seat. Pay for that seat. Get a ticket you can scan."
          lede="Six steps from browsing to the gate. The interesting part is step two — a seat hold is a lock, not a flag."
          align="center"
        />

        <div className="mt-12 flex justify-center">
          <Badge variant="gold" className="px-3 py-1.5">
            <TimerIcon aria-hidden />
            {SEAT_HOLD_TTL_SECONDS / 60}-minute hold · {MAX_SEATS_PER_BOOKING} seats max · test mode payments
          </Badge>
        </div>

        {/* Process */}
        <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map(({ icon: Icon, step, title, body, note }) => (
            <li
              key={step}
              className="group relative flex flex-col rounded-lg border border-white/8 bg-carbon p-5 transition-colors hover:border-gold-400/25 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-sm border border-gold-400/25 bg-gold-400/10 text-gold-200 transition-colors group-hover:border-gold-400/45">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span aria-hidden className="font-mono text-2xl font-semibold text-white/6">
                  {step}
                </span>
              </div>

              <h2 className="mt-4 text-base font-medium tracking-tight text-ink">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-mute">{body}</p>
              <p className="mt-4 border-t border-white/8 pt-3 font-mono text-2xs uppercase tracking-[0.12em] text-ink-faint">
                {note}
              </p>
            </li>
          ))}
        </ol>

        {/* Guarantees */}
        <section aria-labelledby="guarantees" className="mt-16">
          <div className="rounded-lg border border-white/8 bg-carbon-2/30 p-6 sm:p-8">
            <h2 id="guarantees" className="flex items-center gap-2 text-xl font-semibold tracking-tight text-ink">
              <ShieldCheckIcon className="size-5 text-gold-300" aria-hidden />
              What we guarantee
            </h2>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {GUARANTEES.map((guarantee) => (
                <div key={guarantee.title}>
                  <h3 className="text-sm font-medium text-ink">{guarantee.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-mute">{guarantee.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          aria-labelledby="how-cta"
          className="relative mt-10 overflow-hidden rounded-lg border border-gold-400/20 bg-carbon px-6 py-10 text-center sm:px-10"
        >
          <div aria-hidden className="tf-grid absolute inset-0 opacity-60" />
          <div
            aria-hidden
            className="absolute left-1/2 top-0 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/8 blur-[120px]"
          />
          <div className="relative">
            <h2 id="how-cta" className="text-balance text-2xl font-semibold tracking-tight text-ink">
              Ready to see the seat map for yourself?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-mute">
              Live availability, real venue plans and no payment required until you pick a seat.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild variant="primary" size="lg">
                <Link href={ROUTES.events}>Browse events</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={ROUTES.register}>Create an account</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
