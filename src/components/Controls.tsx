import { K_MAX, M_STOPS, type Kind } from '../hooks/useFilter'
import { fmtInt } from '../lib/format'
import { PRESETS, type Preset } from '../lib/presets'

interface Props {
  m: number
  k: number
  kind: Kind
  activePreset: string | null
  onM: (m: number) => void
  onK: (k: number) => void
  onKind: (kind: Kind) => void
  onPreset: (p: Preset) => void
  onClear: () => void
}

export function Controls({ m, k, kind, activePreset, onM, onK, onKind, onPreset, onClear }: Props) {
  const mIndex = Math.max(0, M_STOPS.indexOf(m))
  return (
    <section className="card p-5 sm:p-6" aria-label="Filter settings">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-10">
        <div className="flex-1">
          <p className="eyebrow mb-3">Presets</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="chip-btn"
                aria-pressed={activePreset === p.id}
                title={p.blurb}
                onClick={() => onPreset(p)}
              >
                {p.label}
              </button>
            ))}
            <button type="button" className="chip-btn" onClick={onClear}>
              Clear items
            </button>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-8">
          <label className="block">
            <span className="flex items-baseline justify-between">
              <span className="eyebrow">m · bits</span>
              <span className="text-lg font-normal tabular-nums">{fmtInt(m)}</span>
            </span>
            <input
              type="range"
              min={0}
              max={M_STOPS.length - 1}
              step={1}
              value={mIndex}
              aria-valuetext={`${m} bits`}
              onChange={(e) => onM(M_STOPS[Number(e.target.value)])}
            />
          </label>
          <label className="block">
            <span className="flex items-baseline justify-between">
              <span className="eyebrow">k · hashes</span>
              <span className="text-lg font-normal tabular-nums">{k}</span>
            </span>
            <input type="range" min={1} max={K_MAX} step={1} value={k} onChange={(e) => onK(Number(e.target.value))} />
          </label>
        </div>

        <div>
          <p className="eyebrow mb-3">Mode</p>
          <div className="flex gap-1 rounded-full bg-white/35 p-1" role="group" aria-label="Filter mode">
            {(['standard', 'counting'] as Kind[]).map((v) => (
              <button
                key={v}
                type="button"
                className="chip-btn capitalize"
                style={{ background: kind === v ? undefined : 'transparent', borderColor: kind === v ? undefined : 'transparent' }}
                aria-pressed={kind === v}
                onClick={() => onKind(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
