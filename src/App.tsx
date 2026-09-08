import { useMemo, useState } from 'react'
import { BitGrid } from './components/BitGrid'
import { Controls } from './components/Controls'
import { MeterPanel } from './components/MeterPanel'
import { ProbePanel } from './components/ProbePanel'
import { useFilter } from './hooks/useFilter'
import { fmtPct, fmtInt } from './lib/format'
import { PRESETS, type Preset } from './lib/presets'

export default function App() {
  const f = useFilter(PRESETS[0])
  const [presetId, setPresetId] = useState<string | null>(PRESETS[0].id)

  const occupied = useMemo(() => f.filter.occupied(), [f.filter, f.version])
  const n = f.filter.n

  const pick = (p: Preset) => {
    f.applyPreset(p)
    setPresetId(p.id)
  }
  const structural = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v)
    setPresetId(null)
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2 px-1 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-extralight tracking-[0.18em] text-ink sm:text-5xl">
            Bloom<span className="font-normal text-bloom">haze</span>
          </h1>
          <p className="mt-2 max-w-xl text-ink-2">
            A Bloom filter playground. Add items and watch <i>k</i> bits bloom; probe for membership and see
            when the filter lies.
          </p>
        </div>
        <dl className="flex gap-6 text-sm text-ink-2 sm:text-right">
          <div>
            <dt className="eyebrow">items · n</dt>
            <dd className="text-2xl font-light tabular-nums text-ink">{fmtInt(n)}</dd>
          </div>
          <div>
            <dt className="eyebrow">bits set</dt>
            <dd className="text-2xl font-light tabular-nums text-ink">
              {fmtInt(occupied)}
              <span className="text-base text-ink-3"> / {fmtInt(f.m)}</span>
            </dd>
          </div>
          <div>
            <dt className="eyebrow">fill</dt>
            <dd className="text-2xl font-light tabular-nums text-ink">{fmtPct(occupied / f.m)}</dd>
          </div>
        </dl>
      </header>

      <Controls
        m={f.m}
        k={f.k}
        kind={f.kind}
        activePreset={presetId}
        onM={structural(f.setM)}
        onK={structural(f.setK)}
        onKind={structural(f.setKind)}
        onPreset={pick}
        onClear={() => {
          f.clear()
          setPresetId(null)
        }}
      />

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="flex flex-col gap-5 lg:col-span-7">
          <section className="card p-5 sm:p-6" aria-label="Bit array">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="eyebrow">
                {f.kind === 'counting' ? '4-bit counters' : 'Bit array'} · m = {fmtInt(f.m)}
              </h2>
              {f.lastBloom && (
                <p key={f.lastBloom.id} className="fade-in text-sm text-ink-2">
                  “{f.lastBloom.item}” → bits {f.lastBloom.indices.join(', ')}
                </p>
              )}
            </div>
            <BitGrid filter={f.filter} version={f.version} bloom={f.lastBloom} probe={f.lastProbe} />
          </section>

          <ProbePanel
            kind={f.kind}
            items={f.items}
            probe={f.lastProbe}
            onAdd={f.add}
            onProbe={f.probe}
            onRemove={f.remove}
          />
        </div>

        <div className="flex flex-col gap-5 lg:col-span-5">
          <MeterPanel filter={f.filter} version={f.version} members={f.memberSet} onUseK={structural(f.setK)} />
        </div>
      </div>
    </div>
  )
}
