import { PageShell } from '@/components/layout/page-shell'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Route-level loading UI.
 *
 * Mirrors the real page rhythm — eyebrow, heading, then a content block — so the
 * transition into content does not shift the layout. Deliberately minimal: a
 * skeleton that guesses at content is worse than one that admits it is waiting.
 */
export default function Loading() {
  return (
    <PageShell>
      <div className="py-10 sm:py-12" aria-busy>
        <span className="sr-only">Loading…</span>

        <div aria-hidden className="flex flex-col gap-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-2/3 max-w-md" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>

        <div aria-hidden className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="flex flex-col gap-3">
              <Skeleton className="aspect-4/5 w-full rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
