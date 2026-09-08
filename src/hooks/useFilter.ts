import { useCallback, useMemo, useRef, useState } from 'react'
import { BloomFilter, CountingBloomFilter, type Filter, type ProbeResult } from '../lib/bloom'
import type { Preset } from '../lib/presets'

export type Kind = 'standard' | 'counting'

export const M_STOPS = [16, 32, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024, 1536, 2048, 3072, 4096]
export const K_MAX = 16

export interface Bloom {
  id: number
  item: string
  indices: number[]
}

export interface Probe extends ProbeResult {
  id: number
  item: string
  /** Was the item really inserted? positive && !member => false positive. */
  member: boolean
}

interface Model {
  m: number
  k: number
  kind: Kind
  /** Inserted items in order; duplicates are only kept in counting mode. */
  items: string[]
  filter: Filter
  /** Bumped on every mutation so memoised consumers refresh. */
  version: number
  lastBloom: Bloom | null
  lastProbe: Probe | null
}

function build(m: number, k: number, kind: Kind, items: readonly string[]): Filter {
  const f: Filter = kind === 'counting' ? new CountingBloomFilter(m, k) : new BloomFilter(m, k)
  for (const it of items) f.add(it)
  return f
}

let nextId = 1

/**
 * Owns the (mutable) filter instance. Mutations go through a ref rather than a
 * setState updater so StrictMode's double-invocation cannot apply them twice.
 */
export function useFilter(initial: Preset) {
  const [model, setModel] = useState<Model>(() => ({
    m: initial.m,
    k: initial.k,
    kind: initial.kind,
    items: [...initial.items],
    filter: build(initial.m, initial.k, initial.kind, initial.items),
    version: 0,
    lastBloom: null,
    lastProbe: null,
  }))
  const ref = useRef(model)
  ref.current = model

  const commit = useCallback((next: Model) => {
    ref.current = next
    setModel(next)
  }, [])

  /** Rebuild the filter for a structural change (m, k, mode or preset). */
  const restructure = useCallback(
    (patch: { m?: number; k?: number; kind?: Kind; items?: readonly string[] }) => {
      const s = ref.current
      const m = patch.m ?? s.m
      const k = patch.k ?? s.k
      const kind = patch.kind ?? s.kind
      const source = patch.items ?? s.items
      const items = kind === 'standard' ? [...new Set(source)] : [...source]
      commit({
        m,
        k,
        kind,
        items,
        filter: build(m, k, kind, items),
        version: s.version + 1,
        lastBloom: null,
        lastProbe: null,
      })
    },
    [commit],
  )

  const setM = useCallback((m: number) => restructure({ m }), [restructure])
  const setK = useCallback((k: number) => restructure({ k }), [restructure])
  const setKind = useCallback((kind: Kind) => restructure({ kind }), [restructure])
  const clear = useCallback(() => restructure({ items: [] }), [restructure])
  const applyPreset = useCallback(
    (p: Preset) => restructure({ m: p.m, k: p.k, kind: p.kind, items: p.items }),
    [restructure],
  )

  const add = useCallback(
    (raw: string) => {
      const item = raw.trim()
      if (!item) return
      const s = ref.current
      if (s.kind === 'standard' && s.items.includes(item)) {
        // Already present: no bits change, but show where it lives.
        const indices = s.filter.probe(item).indices
        commit({ ...s, lastBloom: { id: nextId++, item, indices }, lastProbe: null })
        return
      }
      const indices = s.filter.add(item)
      commit({
        ...s,
        items: [...s.items, item],
        version: s.version + 1,
        lastBloom: { id: nextId++, item, indices },
        lastProbe: null,
      })
    },
    [commit],
  )

  const remove = useCallback(
    (item: string) => {
      const s = ref.current
      if (!(s.filter instanceof CountingBloomFilter)) return
      const at = s.items.indexOf(item)
      if (at < 0 || !s.filter.remove(item)) return
      const items = s.items.slice()
      items.splice(at, 1)
      commit({ ...s, items, version: s.version + 1, lastBloom: null, lastProbe: null })
    },
    [commit],
  )

  const probe = useCallback(
    (raw: string) => {
      const item = raw.trim()
      if (!item) return
      const s = ref.current
      const result = s.filter.probe(item)
      commit({
        ...s,
        lastBloom: null,
        lastProbe: { id: nextId++, item, member: s.items.includes(item), ...result },
      })
    },
    [commit],
  )

  const memberSet = useMemo(() => new Set(model.items), [model.items])

  return { ...model, memberSet, setM, setK, setKind, clear, applyPreset, add, remove, probe }
}
