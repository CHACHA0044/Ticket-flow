import { NextResponse } from 'next/server'
import { getServerServices } from '@/lib/api/server'
import { toApiErrorResponse } from '@/lib/api/response'

export const dynamic = 'force-dynamic'

/** GET /api/events/[eventId] — FR-EVENT-04 detail + pricing matrix. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  try {
    const { eventId } = await params
    const event = await getServerServices().events.getById(eventId)
    if (!event) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Event not found.' }, { status: 404 })
    }
    return NextResponse.json({ event })
  } catch (error) {
    return toApiErrorResponse(error)
  }
}