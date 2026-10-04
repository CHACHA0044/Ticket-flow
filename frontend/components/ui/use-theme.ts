'use client'

/**
 * Ticket Flow is a dark-only product — there is no light theme to toggle.
 *
 * The hook exists so the toaster (and any future theme-aware surface) can read
 * the resolved value without branching on a value that can never change. It
 * deliberately holds no state: a `useState` + `useEffect` that always sets the
 * same value buys nothing and costs an extra render on mount, plus a
 * setState-in-effect that the React compiler rightly rejects.
 */
export function useTheme(): 'dark' | 'light' {
  return 'dark'
}
