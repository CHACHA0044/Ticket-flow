'use client'

import { Toaster as SonnerToaster } from 'sonner'
import { useTheme } from './use-theme'

/**
 * Global toast host.
 *
 * The palette matches the design system; toasts are reserved for real state
 * changes (seat lost to another buyer, hold expiring, booking confirmed) and are
 * announced politely so they never interrupt a screen-reader user.
 */
export function Toaster() {
  const theme = useTheme()

  return (
    <SonnerToaster
      theme={theme}
      position="bottom-right"
      offset={20}
      gap={10}
      visibleToasts={4}
      toastOptions={{
        classNames: {
          toast:
            'group rounded-md border border-white/12 bg-graphite-1 text-ink shadow-[0_24px_60px_-24px_rgba(0,0,0,1)]',
          title: 'text-sm font-medium',
          description: 'text-xs text-ink-mute',
          actionButton: 'bg-gold-400 text-void rounded-xs text-xs font-medium px-3 h-7',
          cancelButton: 'bg-graphite-3 text-ink-soft rounded-xs text-xs px-3 h-7',
          error: 'border-signal-alert/40',
          success: 'border-signal-live/40',
        },
      }}
    />
  )
}