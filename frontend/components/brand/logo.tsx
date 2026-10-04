'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface LogoProps {
  /** `mark` renders the glyph alone, `full` adds the wordmark. */
  variant?: 'mark' | 'full'
  size?: number
  /** Hide the wordmark below the `sm` breakpoint without duplicating markup. */
  hideWordmarkOnMobile?: boolean
  className?: string
}

/**
 * Ticket Flow identity.
 *
 * An original aperture mark: six blades opening around a rising chevron. Built
 * from primitives so it stays crisp from a 20px nav hit-target to a 512px social
 * card, and inherits `currentColor` for the wordmark so it works on any surface.
 *
 * Gradient ids are namespaced per instance — the mark appears in the header,
 * footer, sidebar and mobile sheet, and duplicated SVG ids would silently drop
 * the fill on every instance after the first.
 */
export function Logo({ variant = 'full', size = 32, hideWordmarkOnMobile = false, className }: LogoProps) {
  const uid = React.useId().replace(/[:]/g, '')
  const gradientId = `tf-logo-${uid}`

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        role="img"
        aria-label="Ticket Flow"
        className="shrink-0 overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f4e6b0" />
            <stop offset="45%" stopColor="#c8a951" />
            <stop offset="100%" stopColor="#8a6d24" />
          </linearGradient>
        </defs>

        {/* Aperture blades */}
        <g stroke={`url(#${gradientId})`} strokeWidth="2.1" strokeLinecap="round" fill="none">
          <path d="M16 2.6 27.2 9v14L16 29.4 4.8 23V9z" opacity="0.55" />
          <path d="M16 7.4 23.1 11.6v8.8L16 24.6 8.9 20.4v-8.8z" opacity="0.85" />
        </g>

        {/* Rising chevron — the "flow" */}
        <path
          d="M11.4 20.6 16 14.9l4.6 5.7"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M11.4 16.2 16 10.5l4.6 5.7"
          stroke="#f4e6b0"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.45"
        />

        {/* Base datum */}
        <path d="M10.6 24.6h10.8" stroke={`url(#${gradientId})`} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      </svg>

      {variant === 'full' && (
        <span
          className={cn(
            'flex flex-col leading-none',
            hideWordmarkOnMobile && 'hidden sm:flex',
          )}
        >
          <span className="text-[0.95rem] font-semibold tracking-[0.2em] text-ink">TICKET FLOW</span>
          <span className="mt-1 font-mono text-[0.5rem] uppercase tracking-[0.3em] text-ink-faint">
            Live Seat Access
          </span>
        </span>
      )}
    </span>
  )
}
