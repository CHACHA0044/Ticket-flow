import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertCircleIcon, LockIcon } from 'lucide-react'
import { PageShell } from '@/components/layout/page-shell'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { CheckoutScreen } from '@/components/checkout/checkout-screen'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/layout/section-heading'
import { getServerServices } from '@/lib/api/server'
import { ROUTES } from '@/lib/constants'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your Ticket Flow booking.',
  robots: { index: false, follow: false },
}

/**
 * Checkout.
 *
 * The booking id arrives as a query parameter rather than a path segment so the
 * URL stays valid if the hold lapses — a confirmed booking is permanent and
 * keeps its own route, a pending one is ephemeral. An unknown id falls back to
 * the catalogue rather than a dead end.
 */
export default async function CheckoutPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const raw = params.booking
  const bookingId = Array.isArray(raw) ? raw[0] : raw

  if (!bookingId) redirect(ROUTES.bookings)

  const booking = await getServerServices().bookings.getById(bookingId)

  if (!booking) {
    return (
      <PageShell width="narrow">
        <div className="py-16">
          <EmptyState
            icon={<AlertCircleIcon className="size-7" aria-hidden />}
            title="We could not find that booking"
            description="It may have expired and been cleaned up. Your bookings list will show anything that is still active."
            action={
              <Button asChild variant="outline">
                <Link href={ROUTES.bookings}>Go to my bookings</Link>
              </Button>
            }
          />
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="py-6 sm:py-8">
        <Breadcrumbs
          items={[
            { label: 'Events', href: ROUTES.events },
            { label: booking.eventTitle, href: `/events/${booking.eventId}` },
            { label: 'Checkout' },
          ]}
        />

        <div className="mt-5 flex flex-col gap-2 border-b border-white/8 pb-6">
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            <LockIcon className="size-5 text-gold-400" aria-hidden />
            Secure checkout
          </h1>
          <p className="text-sm text-ink-mute">
            Your seats are held. Complete payment to confirm them.
          </p>
        </div>

        <div className="mt-8">
          <CheckoutScreen booking={booking} />
        </div>
      </div>
    </PageShell>
  )
}
