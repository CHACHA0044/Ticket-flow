import { NextResponse } from 'next/server'
import { getServerServices } from '@/lib/api/server'
import { toApiErrorResponse } from '@/lib/api/response'

export const dynamic = 'force-dynamic'

/** GET /api/events/[eventId]/seats — FR-SEAT-03 live availability snapshot. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  try {
    const { eventId } = await params
    const snapshot = await getServerServices().seats.getSnapshot(eventId)
    if (!snapshot) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Event not found.' }, { status: 404 })
    }
    return NextResponse.json({ snapshot })
  } catch (error) {
    return toApiErrorResponse(error)
  }
}