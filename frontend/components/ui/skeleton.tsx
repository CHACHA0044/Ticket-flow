import { cn } from '@/lib/utils'

/**
 * Loading placeholder.
 *
 * Uses a slow, low-contrast pulse so a page of skeletons never flickers or
 * demands attention — it should read as a held breath, not as motion.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-xs bg-white/6', className)}
      {...props}
    />
  )
}