'use client'

import { MinusIcon, PlusIcon, MaximizeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SeatZoom } from '@/components/seats/seat-map'
import { cn } from '@/lib/utils'

const LEVELS: { value: SeatZoom; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'default', label: 'Default' },
  { value: 'large', label: 'Large' },
]

/**
 * Seat size control.
 *
 * Resizing re-lays the grid via a CSS custom property rather than a CSS
 * transform. A transform would scale the buttons visually without resizing their
 * hit targets in the layout, and would offset tooltip anchors; a custom property
 * keeps pointer targets, focus rings and tooltips all correct at every zoom.
 */
export function SeatMapToolbar({
  zoom,
  onZoomChange,
  liveStatus,
  lastEventAt,
  transport,
  className,
}: {
  zoom: SeatZoom
  onZoomChange: (zoom: SeatZoom) => void
  liveStatus: string
  lastEventAt: number | null
  transport: 'socket.io' | 'mock' | 'none'
  className?: string
}) {
  const index = LEVELS.findIndex((level) => level.value === zoom)

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/8 bg-carbon/60 px-3 py-2.5',
        className,
      )}
    >
      <p className="flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint">
        <span
          className={cn(
            'size-1.5 rounded-full',
            liveStatus === 'connected'
              ? 'bg-signal-live'
              : liveStatus === 'connecting'
                ? 'animate-pulse bg-signal-hold'
                : 'bg-ink-faint',
          )}
          aria-hidden
        />
        <span aria-live="polite">
          {liveStatus === 'connected'
            ? `Live · ${transport === 'mock' ? 'demo feed' : 'socket.io'}`
            : liveStatus === 'connecting'
              ? 'Connecting…'
              : liveStatus === 'error'
                ? 'Reconnecting…'
                : 'Static snapshot'}
        </span>
        {lastEventAt && (
          <span className="hidden text-ink-faint/70 sm:inline">
            · updated {new Date(lastEventAt).toLocaleTimeString('en-GB', { hour12: false })}
          </span>
        )}
      </p>

      <div className="flex items-center gap-1.5">
        <span className="mr-1 hidden font-mono text-2xs uppercase tracking-[0.14em] text-ink-faint sm:inline">
          Zoom
        </span>
        <Button
          variant="secondary"
          size="icon-sm"
          aria-label="Smaller seats"
          disabled={index === 0}
          onClick={() => onZoomChange(LEVELS[Math.max(0, index - 1)]!.value)}
        >
          <MinusIcon aria-hidden />
        </Button>
        <Button
          variant="secondary"
          size="icon-sm"
          aria-label="Larger seats"
          disabled={index === LEVELS.length - 1}
          onClick={() => onZoomChange(LEVELS[Math.min(LEVELS.length - 1, index + 1)]!.value)}
        >
          <PlusIcon aria-hidden />
        </Button>
        <Button
          variant="secondary"
          size="icon-sm"
          aria-label="Reset seat size"
          disabled={zoom === 'default'}
          onClick={() => onZoomChange('default')}
        >
          <MaximizeIcon aria-hidden />
        </Button>
      </div>
    </div>
  )
}
