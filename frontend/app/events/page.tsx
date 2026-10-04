import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageShell } from '@/components/layout/page-shell'
import { SectionHeading, EmptyState } from '@/components/layout/section-heading'
import { EventCard } from '@/components/events/event-card'
import { EventFilters } from '@/components/events/event-filters'
import { SearchXIcon } from 'lucide-react'
import { getServerServices } from '@/lib/api/server'
import {
  EVENT_CATEGORIES,
  type EventCategory,
  type EventFilters as Filters,
  type EventSortKey,
} from '@/types/event'

export const metadata: Metadata = {
  title: 'Browse events',
  description:
    'Search and filter live events — concerts, sports, theatre, conferences and comedy — then pick your exact seat in the venue plan.',
  alternates: { canonical: '/events' },
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

/**
 * Event catalogue.
 *
 * Filters arrive as search params, are validated against the known enum values,
 * and are applied on the server. Unknown values are discarded rather than passed
 * through, so a hand-edited URL can never reach the service layer as garbage.
 */
export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams

  const filters: Filters = {
    search: firstValue(params.search),
    category: asCategory(params.category),
    city: firstValue(params.city),
    availability: asAvailability(params.availability),
    sort: asSort(params.sort),
  }

  const services = getServerServices()
  const [all, page] = await Promise.all([
    // Unfiltered pass purely to populate the city options — the facet list.
    services.events.list({ sort: 'DATE_ASC' }),
    services.events.list(filters),
  ])

  const cities = [...new Set(all.items.map((event) => event.venue.city))].sort()
  const activeCategory = filters.category && filters.category !== 'ALL' ? filters.category : undefined

  return (
    <PageShell>
      <div className="py-10 sm:py-12">
        <SectionHeading
          as="h1"
          eyebrow="Catalogue"
          title="Every event, live availability"
          lede="Filter by category or city, sort by what matters to you, and open any event to choose exact seats."
        />

        <Suspense fallback={<div className="h-24" />}>
          <EventFilters
            cities={cities}
            resultCount={page.total}
            activeCategory={activeCategory}
            className="mt-8 border-y border-white/8 py-5"
          />
        </Suspense>

        {page.items.length === 0 ? (
          <EmptyState
            className="mt-10"
            icon={<SearchXIcon className="size-7" aria-hidden />}
            title="No events match those filters"
            description="Try widening the category, clearing the city, or searching for a different artist or venue."
          />
        ) : (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {page.items.map((event) => (
              <li key={event.id}>
                <EventCard event={event} className="h-full" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  )
}

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value && value.length > 0 ? value : undefined
}

function asCategory(value: string | string[] | undefined): Filters['category'] {
  const raw = firstValue(value)
  if (!raw || raw === 'ALL') return 'ALL'
  return EVENT_CATEGORIES.includes(raw as EventCategory) ? (raw as EventCategory) : 'ALL'
}

function asAvailability(value: string | string[] | undefined): Filters['availability'] {
  const raw = firstValue(value)
  if (raw === 'AVAILABLE' || raw === 'SELLING_FAST') return raw
  return 'ALL'
}

function asSort(value: string | string[] | undefined): EventSortKey | undefined {
  const raw = firstValue(value)
  const allowed: EventSortKey[] = ['DATE_ASC', 'DATE_DESC', 'PRICE_ASC', 'PRICE_DESC', 'POPULARITY']
  return allowed.includes(raw as EventSortKey) ? (raw as EventSortKey) : undefined
}
