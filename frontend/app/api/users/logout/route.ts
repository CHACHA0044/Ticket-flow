import { NextResponse } from 'next/server'
import { getServerServices } from '@/lib/api/server'
import { toApiErrorResponse } from '@/lib/api/response'

export const dynamic = 'force-dynamic'

/** POST /api/users/logout — revokes the session cookie. */
export async function POST() {
  try {
    await getServerServices().users.logout()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return toApiErrorResponse(error)
  }
}