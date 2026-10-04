'use client'

import { useEffect, useState } from 'react'

/**
 * Respects the OS "reduce motion" setting (WCAG 2.3.3).
 *
 * Motion components in the app take this value instead of relying only on the
 * CSS `prefers-reduced-motion` override, so JS-driven sequences (staggered
 * reveals, number count-ups) can degrade to an instant state change rather than
 * simply playing faster.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reduced
}