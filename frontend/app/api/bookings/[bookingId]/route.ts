import { NextResponse } from 'next/server'
import { getServerServices } from '@/lib/api/server'
import { toApiErrorResponse } from '@/lib/api/response'

export const dynamic = 'force-dynamic'

/** GET /api/bookings/[bookingId] */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  try {
    const { bookingId } = await params
    const booking = await getServerServices().bookings.getById(bookingId)
    if (!booking) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Booking not found.' }, { status: 404 })
    }
    return NextResponse.json({ booking })
  } catch (error) {
    return toApiErrorResponse(error)
  }
}