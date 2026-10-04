import { NextResponse } from 'next/server'
import { getServerServices } from '@/lib/api/server'
import { readJson, toApiErrorResponse } from '@/lib/api/response'
import { registerSchema } from '@/lib/validation/auth'
import type { RegisterInput } from '@/types/user'

export const dynamic = 'force-dynamic'

/** POST /api/users/register — FR-AUTH-01 */
export async function POST(request: Request) {
  try {
    const body = await readJson<RegisterInput>(request, registerSchema)
    const user = await getServerServices().users.register(body)
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    return toApiErrorResponse(error)
  }
}