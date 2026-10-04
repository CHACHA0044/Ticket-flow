import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * Card-shaped placeholder.
 *
 * Mirrors `<EventCard>`'s box model exactly — same aspect ratio for the poster,
 * same line heights for the text rows — so the grid does not reflow when real
 * data replaces it.
 */
export function EventCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-lg border border-white/8 bg-carbon',
        className,
      )}
      aria-hidden
    >
      <Skeleton className="aspect-4/5 w-full rounded-none" />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Skeleton className="h-3 w-28" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <Skeleton className="h-3 w-3/5" />

        <div className="mt-auto flex flex-col gap-2 pt-1">
          <div className="flex items-end justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-1 w-full" />
        </div>
      </div>
    </div>
  )
}

/** Catalogue grid placeholder used by `app/events/loading.tsx`. */
export function EventGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <EventCardSkeleton />
        </li>
      ))}
    </ul>
  )
}