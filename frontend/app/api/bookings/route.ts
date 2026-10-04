import { NextResponse } from 'next/server'
import { getServerServices } from '@/lib/api/server'
import { readJson, toApiErrorResponse } from '@/lib/api/response'
import type { CreateBookingInput } from '@/types/booking'

export const dynamic = 'force-dynamic'

/** GET /api/bookings — FR-AUTH-05 booking history. */
export async function GET() {
  try {
    const bookings = await getServerServices().bookings.list()
    return NextResponse.json({ bookings })
  } catch (error) {
    return toApiErrorResponse(error)
  }
}

/** POST /api/bookings — FR-BOOK-02 seat hold. Returns 409 on contention. */
export async function POST(request: Request) {
  try {
    const body = await readJson<CreateBookingInput>(request)
    const result = await getServerServices().bookings.create(body)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return toApiErrorResponse(error)
  }
}