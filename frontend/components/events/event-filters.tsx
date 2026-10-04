'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { SearchIcon, SlidersHorizontalIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABEL, EVENT_SORT_OPTIONS } from '@/types/event'
import type { EventCategory, EventSortKey } from '@/types/event'
import { cn } from '@/lib/utils'

/**
 * Catalogue filter bar.
 *
 * State lives in the URL, not in component state — that makes every filtered
 * view linkable, shareable, and correctly rendered on the server, and it means
 * the back button behaves the way a browser user expects. Controls write to the
 * query string with `replace` so typing does not pile up history entries.
 */
export function EventFilters({
  cities,
  resultCount,
  activeCategory,
  className,
}: {
  cities: string[]
  resultCount: number
  activeCategory?: string
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [term, setTerm] = React.useState(searchParams.get('search') ?? '')

  // Keep the input in step with the URL when navigation happens from elsewhere
  // (a category tile in the footer, a breadcrumb, the back button). This is the
  // documented "adjust state when a prop changes" pattern — an effect would
  // render the stale value once first, then correct it.
  const urlTerm = searchParams.get('search') ?? ''
  const [lastUrlTerm, setLastUrlTerm] = React.useState(urlTerm)
  if (lastUrlTerm !== urlTerm) {
    setLastUrlTerm(urlTerm)
    setTerm(urlTerm)
  }

  const commit = React.useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  // Debounced search commit. The timer lives in a ref, not in a `useMemo` closure:
// a memoised function is rebuilt whenever `commit` changes identity, which would
// strand the previous closure's pending timeout and fire a stale navigation.
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  React.useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
  }, [])

  const debouncedCommit = React.useCallback(
    (value: string) => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
      searchTimer.current = setTimeout(() => {
        commit((params) => {
          if (value) params.set('search', value)
          else params.delete('search')
        })
      }, 350)
    },
    [commit],
  )

  const activeChips = buildChips(searchParams, commit)

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
            aria-hidden
          />
          <Label htmlFor="event-search" className="sr-only">
            Search events
          </Label>
          <Input
            id="event-search"
            type="search"
            value={term}
            onChange={(event) => {
              setTerm(event.target.value)
              debouncedCommit(event.target.value)
            }}
            placeholder="Search by event, artist or venue"
            className="pl-9"
            autoComplete="off"
          />
          {term && (
            <button
              type="button"
              onClick={() => {
                setTerm('')
                commit((params) => params.delete('search'))
              }}
              className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-xs text-ink-faint transition-colors hover:bg-white/8 hover:text-ink"
            >
              <XIcon className="size-3.5" aria-hidden />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>

        {/* Category pills — the primary axis, always visible on desktop */}
        <div className="hidden flex-wrap gap-1.5 lg:flex">
          <CategoryPill label="All" value="ALL" active={!activeCategory} onSelect={commit} />
          {EVENT_CATEGORIES.map((category) => (
            <CategoryPill
              key={category}
              label={EVENT_CATEGORY_LABEL[category]}
              value={category}
              active={activeCategory === category}
              onSelect={commit}
            />
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <Label htmlFor="event-sort" className="shrink-0 text-xs text-ink-faint">
            Sort
          </Label>
          <Select
            value={(searchParams.get('sort') as EventSortKey) ?? 'DATE_ASC'}
            onValueChange={(value) =>
              commit((params) => {
                if (value === 'DATE_ASC') params.delete('sort')
                else params.set('sort', value)
              })
            }
          >
            <SelectTrigger id="event-sort" className="w-[10.5rem] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Refinements — collapsed behind a sheet on small screens */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="secondary" size="sm" className="w-fit lg:hidden">
            <SlidersHorizontalIcon aria-hidden />
            Filters
            {activeChips.length > 0 && (
              <Badge variant="gold" className="ml-1">
                {activeChips.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent side="bottom" className="max-h-[85dvh]">
          <SheetHeader>
            <SheetTitle>Refine results</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-6 p-5">
            <fieldset>
              <legend className="font-mono text-2xs uppercase tracking-[0.16em] text-ink-faint">
                Category
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                <CategoryPill label="All" value="ALL" active={!activeCategory} onSelect={commit} />
                {EVENT_CATEGORIES.map((category) => (
                  <CategoryPill
                    key={category}
                    label={EVENT_CATEGORY_LABEL[category]}
                    value={category}
                    active={activeCategory === category}
                    onSelect={commit}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-mono text-2xs uppercase tracking-[0.16em] text-ink-faint">
                City
              </legend>
              <div className="mt-3">
                <Select
                  value={searchParams.get('city') ?? 'ALL'}
                  onValueChange={(value) =>
                    commit((params) => {
                      if (value === 'ALL') params.delete('city')
                      else params.set('city', value)
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Any city</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </fieldset>
          </div>

          <div className="mt-auto border-t border-white/8 p-5">
            <Button block variant="secondary" onClick={() => router.replace(pathname)}>
              Reset all filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* City filter for desktop, plus active-filter summary */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="city-filter" className="text-xs text-ink-faint">
            City
          </Label>
          <Select
            value={searchParams.get('city') ?? 'ALL'}
            onValueChange={(value) =>
              commit((params) => {
                if (value === 'ALL') params.delete('city')
                else params.set('city', value)
              })
            }
          >
            <SelectTrigger id="city-filter" className="h-8 w-40 text-xs">
              <SelectValue placeholder="Any city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any city</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint" aria-live="polite">
          {resultCount} {resultCount === 1 ? 'event' : 'events'}
        </p>

        {activeChips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={chip.clear}
            className="inline-flex items-center gap-1 rounded-xs border border-gold-400/30 bg-gold-400/10 px-2 py-1 font-mono text-2xs uppercase tracking-[0.12em] text-gold-200 transition-colors hover:bg-gold-400/20"
          >
            {chip.label}
            <XIcon className="size-3" aria-hidden />
            <span className="sr-only">Remove filter</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function CategoryPill({
  label,
  value,
  active,
  onSelect,
}: {
  label: string
  value: EventCategory | 'ALL'
  active: boolean
  onSelect: (mutate: (params: URLSearchParams) => void) => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() =>
        onSelect((params) => {
          if (value === 'ALL') params.delete('category')
          else params.set('category', value)
        })
      }
      className={cn(
        'rounded-sm border px-3 py-1.5 text-xs transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/80',
        active
          ? 'border-gold-400/45 bg-gold-400/14 text-gold-100'
          : 'border-white/10 bg-transparent text-ink-mute hover:border-white/20 hover:text-ink',
      )}
    >
      {label}
    </button>
  )
}

/** Removable summary chips for every non-default filter currently applied. */
function buildChips(
  searchParams: URLSearchParams,
  commit: (mutate: (params: URLSearchParams) => void) => void,
): { key: string; label: string; clear: () => void }[] {
  const chips: { key: string; label: string; clear: () => void }[] = []

  const category = searchParams.get('category')
  if (category && EVENT_CATEGORIES.includes(category as EventCategory)) {
    chips.push({
      key: 'category',
      label: EVENT_CATEGORY_LABEL[category as EventCategory],
      clear: () => commit((params) => params.delete('category')),
    })
  }

  const city = searchParams.get('city')
  if (city) {
    chips.push({ key: 'city', label: city, clear: () => commit((params) => params.delete('city')) })
  }

  const availability = searchParams.get('availability')
  if (availability && availability !== 'ALL') {
    chips.push({
      key: 'availability',
      label: availability === 'SELLING_FAST' ? 'Selling fast' : 'Available',
      clear: () => commit((params) => params.delete('availability')),
    })
  }

  return chips
}