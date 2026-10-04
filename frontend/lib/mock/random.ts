/**
 * Seeded pseudo-random number generator (mulberry32).
 *
 * The mock dataset must be byte-identical on the server and in the browser so
 * React never reports a hydration mismatch. `Math.random()` cannot guarantee
 * that, therefore every generated value is derived from a stable seed.
 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a — turns an entity id into a stable 32-bit seed. */
export function hashSeed(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function createSeededRng(key: string): () => number {
  return createRng(hashSeed(key))
}