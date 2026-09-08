/**
 * Two independent 32-bit string hashes, written from scratch, plus the
 * Kirsch–Mitzenmacher double-hashing scheme that turns them into k indices.
 */

/** FNV-1a, 32-bit. Each UTF-16 code unit is fed as two bytes. */
export function fnv1a(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    h ^= c & 0xff
    h = Math.imul(h, 0x01000193)
    h ^= c >>> 8
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Murmur3-style mix: each code unit is scrambled as a block, folded into the
 * running state with rotate/multiply, then finalised with the fmix avalanche.
 */
export function mixHash(s: string, seed = 0x9747b28c): number {
  let h = seed >>> 0
  for (let i = 0; i < s.length; i++) {
    let k = s.charCodeAt(i)
    k = Math.imul(k, 0xcc9e2d51)
    k = (k << 15) | (k >>> 17)
    k = Math.imul(k, 0x1b873593)
    h ^= k
    h = (h << 13) | (h >>> 19)
    h = (Math.imul(h, 5) + 0xe6546b64) >>> 0
  }
  h ^= s.length
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}

export interface HashBreakdown {
  h1: number
  h2: number
  /** h1 mod m and h2 mod m — the two numbers the k indices are built from. */
  a: number
  b: number
  indices: number[]
}

/**
 * Kirsch–Mitzenmacher: index_i = (h1 + i·h2) mod m for i in [0, k).
 * A step of 0 mod m would collapse every index onto h1, so it is bumped to 1.
 */
export function doubleHash(item: string, k: number, m: number): HashBreakdown {
  const h1 = fnv1a(item)
  const h2 = mixHash(item)
  const a = h1 % m
  let b = h2 % m
  if (b === 0) b = 1
  const indices = new Array<number>(k)
  for (let i = 0; i < k; i++) indices[i] = (a + i * b) % m
  return { h1, h2, a, b, indices }
}

export function doubleHashIndices(item: string, k: number, m: number): number[] {
  return doubleHash(item, k, m).indices
}
