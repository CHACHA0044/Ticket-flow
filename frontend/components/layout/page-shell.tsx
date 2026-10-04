import type { ReactNode } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { cn } from '@/lib/utils'

/**
 * Standard page frame: header, landmark `<main>`, footer.
 *
 * `#main` is the skip-link target declared in the root layout, so it must be
 * present exactly once per document — which is why every route renders through
 * here rather than assembling the frame itself.
 */
export function PageShell({
  children,
  className,
  width = 'default',
}: {
  children: ReactNode
  className?: string
  width?: 'default' | 'wide' | 'narrow'
}) {
  return (
    <>
      <SiteHeader />
      <main
        id="main"
        className={cn(
          'flex-1',
          width === 'default' && 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8',
          width === 'wide' && 'mx-auto w-full max-w-[110rem] px-4 sm:px-6 lg:px-8',
          width === 'narrow' && 'mx-auto w-full max-w-3xl px-4 sm:px-6',
          className,
        )}
      >
        {children}
      </main>
      <SiteFooter />
    </>
  )
}