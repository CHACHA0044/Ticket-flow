import { Skeleton } from '@/components/ui/skeleton'
import { EventGridSkeleton } from '@/components/events/event-card-skeleton'

/**
 * Catalogue loading state.
 *
 * Shaped like the real page — heading block, filter rail, then the grid — so the
 * transition to loaded content is a fill-in rather than a re-layout.
 */
export default function EventsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-4 w-[28rem] max-w-full" />
      </div>

      <div className="mt-8 flex flex-col gap-4 border-y border-white/8 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-11 flex-1" />
          <div className="hidden gap-1.5 lg:flex">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-8 w-20" />
            ))}
          </div>
          <Skeleton className="h-10 w-42" />
        </div>
        <Skeleton className="h-3 w-32" />
      </div>

      <div className="mt-8">
        <EventGridSkeleton />
      </div>
    </div>
  )
}
