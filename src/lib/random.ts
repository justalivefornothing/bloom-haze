/** mulberry32: a tiny seeded PRNG returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** Lowercase alphanumeric token of 4–11 characters. */
export function randomToken(rand: () => number): string {
  const len = 4 + Math.floor(rand() * 8)
  let s = ''
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(rand() * ALPHABET.length)]
  return s
}

/**
 * Generates `count` distinct random tokens that are not in `exclude`.
 * Deterministic for a given seed, so the meter is reproducible.
 */
export function nonMembers(count: number, exclude: ReadonlySet<string>, seed = 1): string[] {
  const rand = mulberry32(seed)
  const out: string[] = []
  const seen = new Set<string>()
  while (out.length < count) {
    const t = randomToken(rand)
    if (exclude.has(t) || seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}
