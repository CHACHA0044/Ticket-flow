import Link from 'next/link'
import { ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Crumb {
  label: string
  href?: string
}

/**
 * Breadcrumb trail.
 *
 * The ordered list is what screen readers announce; the separators are drawn
 * with CSS borders rather than characters so they are never spoken.
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-xs text-ink-faint">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="rounded-xs transition-colors hover:text-gold-200"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={cn(isLast && 'text-ink-mute')} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRightIcon className="size-3 shrink-0 text-ink-faint/60" aria-hidden />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}