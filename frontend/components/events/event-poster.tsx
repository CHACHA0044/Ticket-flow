import * as React from 'react'
import { cn } from '@/lib/utils'
import type { PosterSpec } from '@/types/event'

export interface EventPosterProps {
  poster: PosterSpec
  title: string
  /** `card` 4:5 grid art, `hero` 16:9 band, `thumb` square chip for lists. */
  shape?: 'card' | 'hero' | 'thumb'
  /** Rendered as decorative when the surrounding card already names the event. */
  decorative?: boolean
  className?: string
}

/**
 * Procedurally generated event artwork.
 *
 * Every event poster in Ticket Flow is drawn from its `PosterSpec` using CSS
 * gradients and inline SVG geometry — no photography, no external CDN, no layout
 * shift, and nothing to optimise. The same spec always produces the same image,
 * which keeps server and client markup byte-identical.
 */

function Motif({ motif, id }: { motif: PosterSpec['motif']; id: string }) {
  switch (motif) {
    case 'arc':
      return (
        <g fill="none" stroke={`url(#${id}-accent)`} strokeLinecap="round">
          {[0, 1, 2, 3].map((ring) => (
            <circle
              key={ring}
              cx="300"
              cy="290"
              r={90 + ring * 46}
              strokeWidth={ring === 0 ? 3 : 1.4}
              opacity={0.5 - ring * 0.1}
              strokeDasharray={ring % 2 === 0 ? undefined : '10 14'}
            />
          ))}
        </g>
      )
    case 'chevron':
      return (
        <g fill="none" stroke={`url(#${id}-accent)`} strokeWidth="2" opacity="0.55">
          {[0, 1, 2, 3, 4].map((step) => (
            <path
              key={step}
              d={`M-40 ${250 + step * 46} L120 ${120 + step * 46} L280 ${230 + step * 46} L520 ${40 + step * 46}`}
              strokeLinecap="round"
              opacity={0.55 - step * 0.09}
            />
          ))}
        </g>
      )
    case 'grid':
      return (
        <g stroke={`url(#${id}-accent)`} fill="none" opacity="0.5">
          {Array.from({ length: 9 }, (_, column) => (
            <line
              key={`v${column}`}
              x1={40 + column * 55}
              y1="0"
              x2={-60 + column * 55}
              y2="400"
              strokeWidth="1"
              opacity={0.16 + (column % 3) * 0.12}
            />
          ))}
          {[0, 1, 2, 3, 4].map((row) => (
            <line key={`h${row}`} x1="-40" y1={60 + row * 74} x2="540" y2={60 + row * 74} strokeWidth="0.8" opacity="0.2" />
          ))}
        </g>
      )
    case 'orbit':
      return (
        <g fill="none" stroke={`url(#${id}-accent)`}>
          <ellipse cx="300" cy="200" rx="230" ry="96" strokeWidth="1.6" opacity="0.4" />
          <ellipse cx="300" cy="200" rx="168" ry="70" strokeWidth="1.2" opacity="0.32" strokeDasharray="8 12" />
          <ellipse
            cx="300"
            cy="200"
            rx="112"
            ry="46"
            strokeWidth="1.1"
            opacity="0.26"
            transform="rotate(-14 300 200)"
          />
          <circle cx="530" cy="200" r="5" fill="#f4e6b0" stroke="none" opacity="0.8" />
        </g>
      )
    case 'wave':
    default:
      return (
        <g fill="none" stroke={`url(#${id}-accent)`} strokeWidth="1.8">
          {[0, 1, 2, 3, 4, 5].map((band) => (
            <path
              key={band}
              d={`M-20 ${110 + band * 42} C 120 ${60 + band * 42}, 220 ${190 + band * 42}, 360 ${130 + band * 42} S 520 ${70 + band * 42}, 560 ${140 + band * 42}`}
              opacity={0.46 - band * 0.06}
              strokeLinecap="round"
            />
          ))}
        </g>
      )
  }
}

export function EventPoster({
  poster,
  title,
  shape = 'card',
  decorative = true,
  className,
}: EventPosterProps) {
  const uid = React.useId().replace(/[:]/g, '')
  const id = `tf-poster-${uid}`
  const shapeClass =
    shape === 'hero' ? 'aspect-16/9' : shape === 'thumb' ? 'aspect-square' : 'aspect-4/5'

  return (
    <div
      role={decorative ? 'presentation' : 'img'}
      aria-label={decorative ? undefined : `Artwork for ${title}`}
      aria-hidden={decorative || undefined}
      className={cn(
        'tf-carbon relative isolate overflow-hidden bg-carbon-2',
        shapeClass,
        className,
      )}
      style={
        {
          '--poster-hue': poster.hue,
          '--poster-accent': poster.accentHue,
        } as React.CSSProperties
      }
    >
      {/* Metallic ramp anchored on the event's own hue */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(145deg,
            hsl(${poster.hue} 32% 14%) 0%,
            hsl(${poster.hue} 24% 9%) 42%,
            hsl(${poster.accentHue} 28% 7%) 100%)`,
        }}
      />

      {/* Light sweep */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(120% 80% at 15% 0%, hsl(${poster.hue} 60% 46% / 0.28) 0%, transparent 60%),
                       radial-gradient(90% 70% at 100% 100%, hsl(${poster.accentHue} 55% 42% / 0.22) 0%, transparent 62%)`,
        }}
      />

      {/* Geometry */}
      <svg
        aria-hidden
        viewBox="0 0 600 400"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
      >
        <defs>
          <linearGradient id={`${id}-accent`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`hsl(${poster.accentHue} 70% 68%)`} stopOpacity="0.85" />
            <stop offset="100%" stopColor={`hsl(${poster.hue} 75% 55%)`} stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <Motif motif={poster.motif} id={id} />
      </svg>

      {/* Technical grid + vignette so the artwork sits behind text calmly */}
      <div aria-hidden className="tf-grid absolute inset-0 opacity-45 mix-blend-overlay" />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 0%, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* Event code, set like a stamped chassis number */}
      <span
        aria-hidden
        className={cn(
          'absolute select-none font-mono font-bold leading-none tracking-[0.08em] text-white/8',
          shape === 'thumb' ? 'bottom-2 left-3 text-2xl' : 'bottom-4 left-5 text-6xl sm:text-7xl',
        )}
      >
        {poster.code}
      </span>

      {/* Hairline top edge — the metallic highlight */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent"
      />
    </div>
  )
}
