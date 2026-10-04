import { NextResponse } from 'next/server'
import { getServerServices } from '@/lib/api/server'
import { readJson, toApiErrorResponse } from '@/lib/api/response'
import { paymentMethodSchema } from '@/lib/validation/checkout'
import type { ConfirmBookingInput } from '@/types/booking'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

/**
 * Shape the settlement endpoint accepts.
 *
 * Deliberately not the form's `billingSchema`: that one carries card fields and
 * a terms checkbox which belong to the browser only. Reusing it here would invite
 * card data onto the wire, so the wire contract is stated separately and the
 * server only ever sees who is being billed.
 */
const confirmBookingSchema = z.object({
  bookingId: z.string().min(1),
  paymentMethod: paymentMethodSchema,
  billing: z.object({
    fullName: z.string().trim().min(2).max(80),
    email: z.email(),
    phone: z.string().trim().regex(/^[6-9]\d{9}$/),
  }),
})

/** POST /api/bookings/[bookingId]/confirm — FR-BOOK-04. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  try {
    const { bookingId } = await params
    const body = await readJson<ConfirmBookingInput>(request, confirmBookingSchema)
    const booking = await getServerServices().bookings.confirm(bookingId, body)
    return NextResponse.json(booking)
  } catch (error) {
    return toApiErrorResponse(error)
  }
}