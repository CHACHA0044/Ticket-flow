import { RadioIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Seat map legend.
 *
 * Every swatch pairs a shape/fill treatment with a text label, and the shapes
 * differ in opacity and ring weight rather than only in hue — the three states
 * remain distinguishable for a colour-blind or greyscale user.
 */
export function SeatLegend({ className }: { className?: string }) {
  const items = [
    {
      label: 'Available',
      hint: 'Select to hold',
      className: 'bg-white/12 ring-1 ring-inset ring-white/25',
    },
    {
      label: 'Selected',
      hint: 'Held for you',
      className: 'bg-gold-400',
    },
    {
      label: 'Held',
      hint: 'Another buyer',
      className: 'bg-signal-hold/22 ring-1 ring-inset ring-signal-hold/40',
    },
    {
      label: 'Sold',
      hint: 'Unavailable',
      className: 'bg-white/[0.035] ring-1 ring-inset ring-white/[0.07]',
    },
  ] as const

  return (
    <div className={cn('flex flex-wrap items-center gap-x-5 gap-y-2', className)}>
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span
              aria-hidden
              className={cn('size-3.5 rounded-[3px]', item.className)}
            />
            <span className="text-xs text-ink-mute">{item.label}</span>
            <span className="sr-only">, {item.hint}</span>
          </li>
        ))}
      </ul>

      <span className="flex items-center gap-2 text-xs text-ink-faint">
        <RadioIcon className="size-3.5" aria-hidden />
        Underlined seat = accessible
      </span>
    </div>
  )
}
