import { NextResponse } from 'next/server'
import { getServerServices } from '@/lib/api/server'
import { readJson, toApiErrorResponse } from '@/lib/api/response'

export const dynamic = 'force-dynamic'

/** POST /api/bookings/[bookingId]/cancel — FR-BOOK-06. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  try {
    const { bookingId } = await params
    await readJson<Record<string, never>>(request).catch(() => ({}) as Record<string, never>)
    const booking = await getServerServices().bookings.cancel(bookingId)
    return NextResponse.json(booking)
  } catch (error) {
    return toApiErrorResponse(error)
  }
}