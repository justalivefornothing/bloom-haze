import { memo, useMemo, type CSSProperties } from 'react'
import type { Filter } from '../lib/bloom'
import type { Bloom, Probe } from '../hooks/useFilter'

interface Props {
  filter: Filter
  version: number
  bloom: Bloom | null
  probe: Probe | null
}

function pillSize(m: number): CSSProperties {
  const [w, h] = m <= 128 ? [16, 22] : m <= 512 ? [11, 16] : m <= 1536 ? [8, 12] : [5, 9]
  return { '--pill-w': `${w}px`, '--pill-h': `${h}px` } as CSSProperties
}

/**
 * The m cells as a wrapped row of pills. Memoised on the filter version so the
 * 60 fps meter never re-renders up to 4,096 nodes.
 */
export const BitGrid = memo(function BitGrid({ filter, version, bloom, probe }: Props) {
  const { m } = filter
  const cells = useMemo(() => {
    const out = new Array<number>(m)
    for (let i = 0; i < m; i++) out[i] = filter.get(i)
    return out
  }, [filter, version, m]) // version invalidates the mutable filter

  const bloomSet = useMemo(() => new Set(bloom?.indices), [bloom])
  const probeSet = useMemo(() => new Set(probe?.indices), [probe])
  const occupied = cells.reduce((a, c) => a + (c ? 1 : 0), 0)

  return (
    <div
      className={`bits ${filter.kind === 'counting' ? 'counting' : ''}`}
      style={pillSize(m)}
      role="img"
      aria-label={`${occupied} of ${m} cells set`}
    >
      {cells.map((c, i) => {
        const isBloom = bloomSet.has(i)
        const isProbe = probeSet.has(i)
        const cls = `pill${c ? ' on' : ' off'}${isBloom ? ' bloom' : ''}${isProbe ? ' pulse' : ''}`
        // Re-key animated pills so a repeat animation restarts.
        const key = isBloom ? `${i}b${bloom!.id}` : isProbe ? `${i}p${probe!.id}` : i
        return <span key={key} className={cls} style={{ '--c': c } as CSSProperties} title={`#${i} = ${c}`} />
      })}
    </div>
  )
})
