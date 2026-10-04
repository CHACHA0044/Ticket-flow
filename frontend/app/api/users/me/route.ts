import { NextResponse } from 'next/server'
import { getServerServices } from '@/lib/api/server'
import { readJson, toApiErrorResponse } from '@/lib/api/response'
import type { BookingPreferences } from '@/types/user'

export const dynamic = 'force-dynamic'

/** GET /api/users/me — FR-AUTH-05 */
export async function GET() {
  try {
    const user = await getServerServices().users.me()
    return NextResponse.json({ user })
  } catch (error) {
    return toApiErrorResponse(error)
  }
}

/** PATCH /api/users/me — booking preferences */
export async function PATCH(request: Request) {
  try {
    const patch = await readJson<Partial<BookingPreferences>>(request)
    const preferences = await getServerServices().users.updatePreferences(patch)
    return NextResponse.json({ preferences })
  } catch (error) {
    return toApiErrorResponse(error)
  }
}