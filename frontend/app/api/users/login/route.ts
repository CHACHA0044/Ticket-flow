import { NextResponse } from 'next/server'
import { getServerServices } from '@/lib/api/server'
import { readJson, toApiErrorResponse } from '@/lib/api/response'
import { loginSchema } from '@/lib/validation/auth'
import type { LoginInput } from '@/types/user'

export const dynamic = 'force-dynamic'

/** POST /api/users/login — FR-AUTH-02 */
export async function POST(request: Request) {
  try {
    const body = await readJson<LoginInput>(request, loginSchema)
    const user = await getServerServices().users.login(body)
    return NextResponse.json({ user })
  } catch (error) {
    return toApiErrorResponse(error)
  }
}