import { useEffect, useState } from 'react'
import type { Filter } from '../lib/bloom'
import { mulberry32, randomToken } from '../lib/random'

export interface MeterState {
  probes: number
  positives: number
  /** positives / probes, or 0 before the first batch. */
  rate: number
  done: boolean
}

const BATCH = 600
export const MAX_PROBES = 250_000
const SEED = 0x5eed

const ZERO: MeterState = { probes: 0, positives: 0, rate: 0, done: false }

/**
 * Fires seeded random non-member strings at the filter in requestAnimationFrame
 * batches and keeps a running false-positive ratio. Restarts whenever the
 * filter changes (version bump) so the needle always describes the current bits.
 */
export function useFpMeter(filter: Filter, version: number, members: ReadonlySet<string>): MeterState {
  const [state, setState] = useState<MeterState>(ZERO)

  useEffect(() => {
    setState(ZERO)
    if (filter.n === 0) return // an empty filter cannot say yes; nothing to measure

    const rand = mulberry32(SEED)
    let probes = 0
    let positives = 0
    let raf = 0

    const tick = () => {
      for (let i = 0; i < BATCH && probes < MAX_PROBES; i++) {
        const t = randomToken(rand)
        if (members.has(t)) continue
        probes++
        if (filter.has(t)) positives++
      }
      const done = probes >= MAX_PROBES
      setState({ probes, positives, rate: probes ? positives / probes : 0, done })
      if (!done) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [filter, version, members])

  return state
}
