'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'
import { FOCUS_RING } from '@/lib/styles'

export const Tabs = TabsPrimitive.Root

export function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border border-white/10 bg-carbon-2/70 p-1',
        className,
      )}
      {...props}
    />
  )
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        FOCUS_RING,
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xs px-3 py-1.5 text-sm text-ink-mute transition-colors duration-150',
        'hover:text-ink-soft',
        'data-[state=active]:bg-gold-400/12 data-[state=active]:text-gold-200 data-[state=active]:ring-1 data-[state=active]:ring-inset data-[state=active]:ring-gold-400/30',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn('mt-6 focus-visible:outline-none', className)}
      {...props}
    />
  )
}