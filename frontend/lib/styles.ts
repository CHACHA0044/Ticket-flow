/**
 * Shared style primitives.
 *
 * Kept as constants (rather than repeated Tailwind strings) so focus treatment
 * and surface elevation stay identical across every component.
 */

/** Accessible, high-contrast focus ring used by all interactive elements. */
export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-void'

/** Raised panel: hairline border + faint top highlight, no heavy shadows. */
export const SURFACE_PANEL =
  'border border-white/8 bg-carbon/80 backdrop-blur-[2px] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_18px_40px_-28px_rgba(0,0,0,0.9)]'

/** Pressed/active affordance for toggles and tabs. */
export const ACTIVE_TONE = 'bg-gold-400/12 text-gold-200 ring-1 ring-inset ring-gold-400/30'

/** Technical label styling for eyebrows and data captions. */
export const MONO_LABEL =
  'font-mono text-2xs uppercase tracking-[0.16em] text-ink-mute'