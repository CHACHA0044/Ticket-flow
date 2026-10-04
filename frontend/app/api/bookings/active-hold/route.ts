import { NextResponse } from 'next/server'
import { getServerServices } from '@/lib/api/server'
import { toApiErrorResponse } from '@/lib/api/response'

export const dynamic = 'force-dynamic'

/** GET /api/bookings/active-hold — resumes an interrupted checkout. */
export async function GET() {
  try {
    const hold = await getServerServices().bookings.activeHold()
    return NextResponse.json({ hold })
  } catch (error) {
    return toApiErrorResponse(error)
  }
}