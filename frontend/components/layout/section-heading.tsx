import type { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { MONO_LABEL } from '@/lib/styles'

/**
 * Section eyebrow + title + optional lede.
 *
 * The eyebrow is decorative structure, not content — it is hidden from assistive
 * technology so a screen reader hears "Concerts happening soon", not
 * "Section label, concerts happening soon".
 */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
  as: Heading = 'h2',
  className,
  children,
}: {
  eyebrow?: string
  title: ReactNode
  lede?: ReactNode
  align?: 'left' | 'center'
  as?: 'h1' | 'h2' | 'h3'
  className?: string
  /** Optional trailing control — usually a "View all" link. */
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow && (
        <p aria-hidden className={cn(MONO_LABEL, 'flex items-center gap-2')}>
          <span className="inline-block h-px w-6 bg-gold-400/60" aria-hidden />
          {eyebrow}
        </p>
      )}

      <div
        className={cn(
          'flex flex-col gap-3',
          align === 'left' && 'sm:flex-row sm:items-end sm:justify-between',
        )}
      >
        <Heading
          className={cn(
            'text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl',
            align === 'center' && 'max-w-2xl',
          )}
        >
          {title}
        </Heading>
        {children}
      </div>

      {lede && (
        <p className={cn('max-w-2xl text-sm leading-relaxed text-ink-mute', align === 'center' && 'mx-auto')}>
          {lede}
        </p>
      )}
    </div>
  )
}

/** Empty-state block for empty lists, filtered-out results and missing data. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: { label: string; href: string } | ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg border border-dashed border-white/12 bg-carbon/40 px-6 py-14 text-center',
        className,
      )}
    >
      {icon && <div className="text-ink-faint">{icon}</div>}
      <p className="text-base font-medium text-ink">{title}</p>
      {description && <p className="max-w-md text-sm leading-relaxed text-ink-mute">{description}</p>}
      {action && (
        <div className="mt-2">
          {isAction(action) ? (
            <Link
              href={action.href}
              className="rounded-xs text-sm text-gold-300 underline-offset-4 hover:text-gold-200 hover:underline"
            >
              {action.label}
            </Link>
          ) : (
            action
          )}
        </div>
      )}
    </div>
  )
}

function isAction(value: { label: string; href: string } | ReactNode): value is { label: string; href: string } {
  return typeof value === 'object' && value !== null && 'href' in value && 'label' in value
}