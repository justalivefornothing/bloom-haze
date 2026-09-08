import { doubleHash, type HashBreakdown } from './hash'

export interface ProbeResult extends HashBreakdown {
  /** Value of each checked cell, in the same order as `indices`. */
  cells: number[]
  /** True when every checked cell is non-zero ("probably yes"). */
  positive: boolean
}

/** Shared surface of the plain and counting filters, as the UI sees them. */
export interface Filter {
  readonly m: number
  readonly k: number
  readonly kind: 'standard' | 'counting'
  /** Number of add() calls that landed. */
  readonly n: number
  add(item: string): number[]
  has(item: string): boolean
  probe(item: string): ProbeResult
  /** Cell value at index i: 0/1 for bits, 0..15 for counters. */
  get(i: number): number
  /** How many of the m cells are non-zero. */
  occupied(): number
}

/** Classic Bloom filter: m bits packed eight to a byte in a Uint8Array. */
export class BloomFilter implements Filter {
  readonly kind = 'standard' as const
  readonly m: number
  readonly k: number
  readonly bits: Uint8Array
  n = 0

  constructor(m: number, k: number) {
    if (m < 1 || k < 1) throw new RangeError('m and k must be positive')
    this.m = m
    this.k = k
    this.bits = new Uint8Array(Math.ceil(m / 8))
  }

  get(i: number): number {
    return (this.bits[i >>> 3] >>> (i & 7)) & 1
  }

  add(item: string): number[] {
    const idx = doubleHash(item, this.k, this.m).indices
    for (const i of idx) this.bits[i >>> 3] |= 1 << (i & 7)
    this.n++
    return idx
  }

  has(item: string): boolean {
    const idx = doubleHash(item, this.k, this.m).indices
    for (const i of idx) if (this.get(i) === 0) return false
    return true
  }

  probe(item: string): ProbeResult {
    const h = doubleHash(item, this.k, this.m)
    const cells = h.indices.map((i) => this.get(i))
    return { ...h, cells, positive: cells.every((c) => c !== 0) }
  }

  occupied(): number {
    let c = 0
    for (let i = 0; i < this.m; i++) c += this.get(i)
    return c
  }
}

/**
 * Counting Bloom filter: one 4-bit counter per cell (stored one per byte,
 * saturating at 15). Deleting decrements; saturated counters are left alone
 * so an overflowed cell can never be driven back to zero incorrectly.
 */
export class CountingBloomFilter implements Filter {
  readonly kind = 'counting' as const
  static readonly MAX = 15
  readonly m: number
  readonly k: number
  readonly counters: Uint8Array
  n = 0

  constructor(m: number, k: number) {
    if (m < 1 || k < 1) throw new RangeError('m and k must be positive')
    this.m = m
    this.k = k
    this.counters = new Uint8Array(m)
  }

  get(i: number): number {
    return this.counters[i]
  }

  add(item: string): number[] {
    const idx = doubleHash(item, this.k, this.m).indices
    // Double hashing can repeat an index for small m; count each cell once.
    for (const i of new Set(idx)) {
      if (this.counters[i] < CountingBloomFilter.MAX) this.counters[i]++
    }
    this.n++
    return idx
  }

  /** Returns false (and changes nothing) when the item was never added. */
  remove(item: string): boolean {
    const idx = doubleHash(item, this.k, this.m).indices
    if (idx.some((i) => this.counters[i] === 0)) return false
    for (const i of new Set(idx)) {
      if (this.counters[i] < CountingBloomFilter.MAX) this.counters[i]--
    }
    this.n--
    return true
  }

  has(item: string): boolean {
    const idx = doubleHash(item, this.k, this.m).indices
    for (const i of idx) if (this.counters[i] === 0) return false
    return true
  }

  probe(item: string): ProbeResult {
    const h = doubleHash(item, this.k, this.m)
    const cells = h.indices.map((i) => this.counters[i])
    return { ...h, cells, positive: cells.every((c) => c !== 0) }
  }

  occupied(): number {
    let c = 0
    for (let i = 0; i < this.m; i++) if (this.counters[i] !== 0) c++
    return c
  }
}

/** k that minimises the false-positive rate for m bits and n items. */
export function optimalK(m: number, n: number): number {
  if (n <= 0) return 1
  return Math.max(1, Math.round((m / n) * Math.LN2))
}

/** Bits needed to hold n items at false-positive rate p with optimal k. */
export function optimalM(n: number, p: number): number {
  return Math.ceil((-n * Math.log(p)) / (Math.LN2 * Math.LN2))
}

/** The textbook estimate (1 - e^(-kn/m))^k. */
export function theoreticalFpRate(m: number, n: number, k: number): number {
  if (n <= 0) return 0
  return Math.pow(1 - Math.exp((-k * n) / m), k)
}

/** Fraction of probes the filter answers "probably yes" to. Callers pass non-members. */
export function measureFp(filter: Pick<Filter, 'has'>, probes: Iterable<string>): number {
  let total = 0
  let positives = 0
  for (const p of probes) {
    total++
    if (filter.has(p)) positives++
  }
  return total === 0 ? 0 : positives / total
}
