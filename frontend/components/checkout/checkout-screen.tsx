'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeftIcon, TicketIcon, XCircleIcon } from 'lucide-react'
import { HoldTimer } from '@/components/checkout/hold-timer'
import { useHoldCountdown } from '@/hooks/use-hold-countdown'
import { SEAT_HOLD_TTL_SECONDS } from '@/lib/constants'
import { PaymentForm } from '@/components/checkout/payment-form'
import { PriceBreakdown } from '@/components/checkout/price-breakdown'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from '@/components/providers/session-provider'
import { formatDate, formatPreciseCurrency, formatTime, toDateTimeAttr } from '@/lib/format'
import type { CheckoutValues } from '@/lib/validation/checkout'
import type { Booking } from '@/types/booking'
import { ApiError } from '@/types/api'

/**
 * Checkout.
 *
 * The booking is already PENDING by the time this screen exists — the seat hold
 * was acquired on the previous screen, so this page never has to negotiate for
 * inventory. Its only jobs are to count the hold down honestly, take payment, and
 * hand off to the confirmation screen.
 */
export function CheckoutScreen({ booking }: { booking: Booking }) {
  const router = useRouter()
  const { user } = useSession()
  const [pending, setPending] = React.useState(false)

  // The countdown is owned here rather than inside <HoldTimer> so a single timer
// drives both the digits and this screen's state. Previously `expired` was
// computed once during render, so a hold that lapsed while the customer sat on
// the page left the payment form live and payable against released seats.
const countdown = useHoldCountdown(booking.expiresAt, SEAT_HOLD_TTL_SECONDS)
const expired = booking.status === 'EXPIRED' || countdown.expired

  const cancel = async () => {
    setPending(true)
    try {
      const { getClientServices } = await import('@/lib/api')
      await getClientServices().bookings.cancel(booking.id)
      toast.info('Booking cancelled', { description: 'Your seats are back on sale.' })
      router.push(`/events/${booking.eventId}/seats`)
    } catch {
      toast.error('Could not cancel that booking. Try again in a moment.')
      setPending(false)
    }
  }

  const pay = async (values: CheckoutValues) => {
    setPending(true)
    try {
      const { getClientServices } = await import('@/lib/api')
      const confirmed = await getClientServices().bookings.confirm(booking.id, {
        bookingId: booking.id,
        paymentMethod: values.paymentMethod,
        billing: {
          // Card fields are deliberately dropped — the sandbox gateway does not
          // need them and they must never travel further than the form.
          fullName: values.billing.fullName,
          email: values.billing.email,
          phone: values.billing.phone,
        },
      })
      toast.success('Payment successful', {
        description: `Booking ${confirmed.bookingNumber} is confirmed.`,
      })
      router.push(`/booking/${confirmed.id}/success`)
    } catch (error) {
      if (error instanceof ApiError && error.code === 'LOCK_EXPIRED') {
        toast.error('Your hold expired', {
          description: 'The seats went back on sale. Please choose again.',
        })
        router.refresh()
      } else if (error instanceof ApiError && error.isSeatConflict) {
        toast.error('Those seats were taken', { description: error.message })
        router.push(`/events/${booking.eventId}/seats`)
      } else {
        toast.error('Payment could not be completed', {
          description:
            error instanceof Error ? error.message : 'Please try again in a moment.',
        })
        setPending(false)
      }
    }
  }

  const seatLabels = booking.items.map(
    (item) => `${item.section} · ${item.row}${item.seatNumber}`,
  )

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
      <div className="flex min-w-0 flex-col gap-6">
        {booking.status === 'CONFIRMED' ? (
          <Alert variant="success">
            <AlertTitle>This booking is already paid for</AlertTitle>
            <AlertDescription>
              <Link
                href={`/booking/${booking.id}/success`}
                className="rounded-xs text-gold-300 underline-offset-4 hover:underline"
              >
                View your tickets
              </Link>
            </AlertDescription>
          </Alert>
        ) : booking.status === 'CANCELLED' ? (
          <Alert variant="warning">
            <AlertTitle>This booking was cancelled</AlertTitle>
            <AlertDescription>The seats were released back to other buyers.</AlertDescription>
          </Alert>
        ) : expired ? (
          <Alert variant="danger" role="alert">
            <AlertTitle>Your seat hold has expired</AlertTitle>
            <AlertDescription>
              The ten-minute window closed, so these seats went back on sale. You can start
              a fresh selection.
            </AlertDescription>
          </Alert>
        ) : (
          <HoldTimer countdown={countdown} />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your order</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{booking.eventTitle}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-mute">
                  <time dateTime={toDateTimeAttr(booking.eventStartTime)}>
                    {formatDate(booking.eventStartTime)} · {formatTime(booking.eventStartTime)}
                  </time>
                  <span className="text-ink-faint">
                    {booking.venueName}, {booking.venueLocality}
                  </span>
                </p>
              </div>
              <span className="shrink-0 rounded-xs border border-white/10 px-2 py-1 font-mono text-2xs uppercase tracking-[0.12em] text-ink-mute">
                {booking.bookingNumber}
              </span>
            </div>

            <ul className="flex flex-col gap-2 border-t border-white/8 pt-4">
              {booking.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-2 text-ink-soft">
                    <TicketIcon className="size-3.5 text-ink-faint" aria-hidden />
                    <span className="font-mono">
                      {item.section} · Row {item.row} · Seat {item.seatNumber}
                    </span>
                    <span className="text-ink-faint">{item.tierName}</span>
                  </span>
                  <span className="tabular-nums text-ink-mute">
                    {formatPreciseCurrency(item.unitPrice)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {!expired && booking.status === 'PENDING' && (
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentForm
                total={booking.pricing.total}
                pending={pending}
                defaultBilling={{
                  fullName: user?.fullName ?? '',
                  email: user?.email ?? '',
                  phone: user?.phone ?? '',
                }}
                onSubmit={pay}
              />
            </CardContent>
          </Card>
        )}

        {booking.status === 'PENDING' && (
          <Button variant="ghost" size="sm" onClick={() => void cancel()} disabled={pending}>
            <XCircleIcon aria-hidden />
            Cancel and release these seats
          </Button>
        )}
      </div>

      {/* Invoice */}
      <aside className="lg:sticky lg:top-24">
        <Card>
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceBreakdown breakdown={booking.pricing} seatLabels={seatLabels} />
          </CardContent>
        </Card>

        <Button asChild variant="ghost" size="sm" className="mt-4 w-full">
          <Link href={`/events/${booking.eventId}/seats`}>
            <ArrowLeftIcon aria-hidden />
            Change seats
          </Link>
        </Button>
      </aside>
    </div>
  )
}
