import { NextResponse } from 'next/server'
import type { ZodType } from 'zod'
import { ApiError } from '@/types/api'

/** Normalises any thrown value into the JSON envelope the HTTP client expects. */
export function toApiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { code: error.code, message: error.message, details: error.details },
      { status: error.status },
    )
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error.'
  return NextResponse.json({ code: 'UNKNOWN', message }, { status: 500 })
}

/**
 * Parses a JSON request body and, when a schema is supplied, validates it.
 *
 * The schema is applied here rather than trusting the caller: these route handlers
 * are a real API surface that a future Express backend has to match, so an
 * invariant such as "the two passwords match" cannot depend on the browser having
 * run the form's Zod validation first.
 */
export async function readJson<T>(request: Request, schema?: ZodType<T>): Promise<T> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    throw new ApiError('BAD_REQUEST', 'Request body must be valid JSON.', 400)
  }

  if (!schema) return body as T

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Some fields need attention.',
      400,
      parsed.error.flatten(),
    )
  }

  return parsed.data
}