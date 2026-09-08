import { describe, expect, it } from 'vitest'
import {
  BloomFilter,
  CountingBloomFilter,
  measureFp,
  optimalK,
  optimalM,
  theoreticalFpRate,
} from './bloom'
import { doubleHash, fnv1a, mixHash } from './hash'
import { WORDS } from './presets'
import { nonMembers } from './random'

const words100 = WORDS.slice(0, 100)
const nonMembers10k = nonMembers(10_000, new Set(WORDS), 42)

describe('hashes', () => {
  it('fnv1a starts at the offset basis and is stable', () => {
    expect(fnv1a('')).toBe(0x811c9dc5)
    // Code units are fed as two bytes each, so these are regression vectors
    // for this implementation rather than the byte-string reference values.
    expect(fnv1a('a')).toBe(0x2b24d044)
    expect(fnv1a('bloom')).toBe(0x984ece7e)
    expect(fnv1a('a')).not.toBe(fnv1a('b'))
  })

  it('mixHash is deterministic and differs from fnv1a', () => {
    expect(mixHash('bloom')).toBe(mixHash('bloom'))
    expect(mixHash('bloom')).not.toBe(fnv1a('bloom'))
    expect(mixHash('bloom')).not.toBe(mixHash('bloon'))
  })

  it('doubleHash derives k indices in range as h1 + i*h2 mod m', () => {
    const { a, b, indices } = doubleHash('haze', 5, 97)
    expect(indices).toHaveLength(5)
    indices.forEach((i, n) => {
      expect(i).toBe((a + n * b) % 97)
      expect(i).toBeGreaterThanOrEqual(0)
      expect(i).toBeLessThan(97)
    })
  })
})

describe('BloomFilter', () => {
  it('never produces a false negative', () => {
    const bf = new BloomFilter(1000, 7)
    words100.forEach((w) => bf.add(w))
    expect(words100.every((w) => bf.has(w))).toBe(true)
    expect(bf.n).toBe(100)
  })

  it('reports each checked bit in a probe', () => {
    const bf = new BloomFilter(64, 3)
    const idx = bf.add('violet')
    const p = bf.probe('violet')
    expect(p.indices).toEqual(idx)
    expect(p.cells.every((c) => c === 1)).toBe(true)
    expect(p.positive).toBe(true)
    expect(bf.occupied()).toBe(new Set(idx).size)
  })

  it('measured false-positive rate tracks the theoretical estimate', () => {
    const bf = new BloomFilter(1000, 7)
    words100.forEach((w) => bf.add(w))
    const fp = measureFp(bf, nonMembers10k)
    expect(Math.abs(fp - theoreticalFpRate(1000, 100, 7))).toBeLessThan(0.01)
  })
})

describe('CountingBloomFilter', () => {
  it('supports delete', () => {
    const cbf = new CountingBloomFilter(256, 3)
    cbf.add('x')
    cbf.remove('x')
    expect(cbf.has('x')).toBe(false)
    expect(cbf.n).toBe(0)
  })

  it('keeps an item present until every copy is removed', () => {
    const cbf = new CountingBloomFilter(256, 3)
    cbf.add('x')
    cbf.add('x')
    expect(cbf.remove('x')).toBe(true)
    expect(cbf.has('x')).toBe(true)
    expect(cbf.remove('x')).toBe(true)
    expect(cbf.has('x')).toBe(false)
    expect(cbf.remove('x')).toBe(false)
  })

  it('saturates counters at 15', () => {
    const cbf = new CountingBloomFilter(16, 2)
    for (let i = 0; i < 40; i++) cbf.add('same')
    expect(Math.max(...cbf.counters)).toBe(15)
  })
})

describe('math', () => {
  it('optimalK', () => {
    expect(optimalK(1000, 100)).toBe(7)
    expect(optimalK(64, 40)).toBe(1)
    expect(optimalK(1000, 0)).toBe(1)
  })

  it('theoreticalFpRate', () => {
    expect(theoreticalFpRate(1000, 100, 7)).toBeCloseTo(0.0082, 3)
    expect(theoreticalFpRate(1000, 0, 7)).toBe(0)
  })

  it('optimalM sizes a 1% filter at ~9.6 bits per item', () => {
    expect(optimalM(1000, 0.01)).toBe(9586)
  })
})
