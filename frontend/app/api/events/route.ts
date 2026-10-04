import { NextResponse } from 'next/server'
import { getServerServices } from '@/lib/api/server'
import { toApiErrorResponse } from '@/lib/api/response'

export const dynamic = 'force-dynamic'

/** GET /api/events — FR-EVENT-03 public catalogue. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      search: searchParams.get('q') ?? undefined,
      category: (searchParams.get('category') ?? 'ALL') as never,
      city: (searchParams.get('city') ?? 'ALL') as never,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      priceMax: searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined,
      availability: (searchParams.get('availability') ?? 'ALL') as never,
      sort: (searchParams.get('sort') ?? 'DATE_ASC') as never,
    }

    const services = getServerServices()

    if (searchParams.get('featured') === 'true') {
      const limit = Number(searchParams.get('limit') ?? 4)
      const items = await services.events.featured(limit)
      return NextResponse.json({ items, total: items.length, page: 1, pageSize: items.length, hasMore: false })
    }

    const relatedTo = searchParams.get('relatedTo')
    if (relatedTo) {
      const items = await services.events.related(
        relatedTo,
        Number(searchParams.get('limit') ?? 3),
      )
      return NextResponse.json({ items, total: items.length, page: 1, pageSize: items.length, hasMore: false })
    }

    return NextResponse.json(await services.events.list(filters))
  } catch (error) {
    return toApiErrorResponse(error)
  }
}