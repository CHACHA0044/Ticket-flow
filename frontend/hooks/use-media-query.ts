'use client'

import { useEffect, useState } from 'react'

/**
 * Subscribes to a media query on the client.
 *
 * Server Components always receive `false`, so anything that *changes layout*
 * (rather than merely styling it) must start from a CSS-first baseline and use
 * this only for behaviour — see `useMediaQuery` usage notes in the seat map.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const list = window.matchMedia(query)
    const update = () => setMatches(list.matches)
    update()
    list.addEventListener('change', update)
    return () => list.removeEventListener('change', update)
  }, [query])

  return matches
}

/** Tailwind `sm` breakpoint (40rem / 640px). */
export function useIsAtLeastSm() {
  return useMediaQuery('(min-width: 640px)')
}

/** Tailwind `lg` breakpoint (64rem / 1024px). */
export function useIsAtLeastLg() {
  return useMediaQuery('(min-width: 1024px)')
}