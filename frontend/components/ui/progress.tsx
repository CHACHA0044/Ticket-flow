'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

/**
 * Seat-utilisation bar. Uses `role="progressbar"` with explicit value text so
 * the number is available to assistive technology, not only to sighted users.
 */
export function Progress({
  className,
  value = 0,
  indicatorClassName,
  label,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { indicatorClassName?: string; label?: string }) {
  const clamped = Math.min(100, Math.max(0, value ?? 0))
  return (
    <ProgressPrimitive.Root
      value={clamped}
      aria-label={label}
      className={cn('relative h-1 w-full overflow-hidden rounded-full bg-white/8', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full rounded-full bg-linear-to-r from-gold-500 to-gold-200 transition-[width] duration-500 ease-out',
          indicatorClassName,
        )}
        style={{ width: `${clamped}%` }}
      />
    </ProgressPrimitive.Root>
  )
}