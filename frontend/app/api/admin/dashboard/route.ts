import { NextResponse } from 'next/server'
import { getServerServices } from '@/lib/api/server'
import { toApiErrorResponse } from '@/lib/api/response'

export const dynamic = 'force-dynamic'

/** GET /api/admin/dashboard — FR-ADMIN-01 / FR-ADMIN-03 */
export async function GET() {
  try {
    return NextResponse.json(await getServerServices().admin.dashboard())
  } catch (error) {
    return toApiErrorResponse(error)
  }
}