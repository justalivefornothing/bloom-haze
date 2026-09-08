import type { Filter } from '../lib/bloom'
import { theoreticalFpRate } from '../lib/bloom'
import { MAX_PROBES, useFpMeter } from '../hooks/useFpMeter'
import { fmtPct, fmtTick, niceCeil } from '../lib/format'

const CX = 120
const CY = 124
const R = 96

function polar(frac: number, r: number): [number, number] {
  const theta = Math.PI * (1 - frac)
  return [CX + r * Math.cos(theta), CY - r * Math.sin(theta)]
}

function arc(from: number, to: number, r: number): string {
  const [x0, y0] = polar(from, r)
  const [x1, y1] = polar(to, r)
  return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`
}

interface Props {
  filter: Filter
  version: number
  members: ReadonlySet<string>
}

/** Semicircular gauge: needle = measured rate, violet tick = theoretical. */
export function Gauge({ filter, version, members }: Props) {
  const meter = useFpMeter(filter, version, members)
  const { m, k, n } = filter
  const theory = theoreticalFpRate(m, n, k)
  const settled = meter.probes >= 500
  const ceil = Math.min(1, niceCeil(Math.max(theory * 1.6, settled ? meter.rate * 1.15 : 0, 0.001)))
  const measuredFrac = Math.min(1, meter.rate / ceil)
  const theoryFrac = Math.min(1, theory / ceil)
  const [tx0, ty0] = polar(theoryFrac, R - 12)
  const [tx1, ty1] = polar(theoryFrac, R + 12)
  const gap = meter.rate - theory

  return (
    <section className="card p-5 sm:p-6" aria-label="False-positive meter">
      <div className="flex items-baseline justify-between">
        <h2 className="eyebrow">False-positive meter</h2>
        <span className="text-xs text-ink-3 tabular-nums" aria-live="off">
          {meter.probes.toLocaleString()} probes{meter.done ? ' · settled' : n > 0 ? ' · firing' : ''}
        </span>
      </div>

      <svg viewBox="0 0 240 150" className="mt-2 w-full" role="img" aria-label={`Measured ${fmtPct(meter.rate)}, theoretical ${fmtPct(theory)}`}>
        {/* track: a lighter step of the same magenta ramp */}
        <path d={arc(0, 1, R)} fill="none" stroke="#f5c6e6" strokeWidth={10} strokeLinecap="round" opacity={0.7} />
        {measuredFrac > 0 && (
          <path
            d={arc(0, measuredFrac, R)}
            fill="none"
            stroke="#d6199a"
            strokeWidth={10}
            strokeLinecap="round"
            style={{ transition: 'd 500ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}
          />
        )}
        {/* theoretical tick */}
        {n > 0 && (
          <line x1={tx0} y1={ty0} x2={tx1} y2={ty1} stroke="#4a3aa7" strokeWidth={2} strokeLinecap="round">
            <title>theoretical {fmtPct(theory)}</title>
          </line>
        )}
        {/* scale labels */}
        <g fill="#8f83a3" fontSize={9} fontWeight={500} letterSpacing={0.5}>
          <text x={CX - R} y={CY + 16} textAnchor="middle">0</text>
          <text x={CX} y={CY - R + 26} textAnchor="middle">{fmtTick(ceil / 2)}</text>
          <text x={CX + R} y={CY + 16} textAnchor="middle">{fmtTick(ceil)}</text>
        </g>
        {/* needle */}
        <g className="needle" style={{ transform: `rotate(${measuredFrac * 180}deg)` }}>
          <line x1={CX} y1={CY} x2={CX - R + 18} y2={CY} stroke="#2a1f3d" strokeWidth={1.5} strokeLinecap="round" />
          <circle cx={CX - R + 18} cy={CY} r={3} fill="#2a1f3d" />
        </g>
        <circle cx={CX} cy={CY} r={5} fill="#2a1f3d" stroke="#fff" strokeWidth={2} />
      </svg>

      <div className="-mt-1 text-center">
        <p className="text-5xl font-extralight tracking-tight text-ink">{fmtPct(meter.rate)}</p>
        <p className="eyebrow mt-1">measured false-positive rate</p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-white/40 p-3">
          <dt className="flex items-center gap-2 text-ink-3">
            <span className="inline-block h-0.5 w-4 rounded bg-theory" aria-hidden="true" />
            theoretical
          </dt>
          <dd className="mt-1 text-xl font-light tabular-nums text-ink">{fmtPct(theory)}</dd>
          <dd className="text-xs text-ink-3">(1 − e^(−kn/m))^k</dd>
        </div>
        <div className="rounded-2xl bg-white/40 p-3">
          <dt className="flex items-center gap-2 text-ink-3">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-bloom ring-2 ring-white" aria-hidden="true" />
            gap
          </dt>
          <dd className="mt-1 text-xl font-light tabular-nums text-ink">
            {n === 0 ? '–' : `${gap >= 0 ? '+' : '−'}${fmtPct(Math.abs(gap))}`}
          </dd>
          <dd className="text-xs text-ink-3">{meter.positives.toLocaleString()} false positives</dd>
        </div>
      </dl>

      {n === 0 ? (
        <p className="mt-4 text-center text-sm text-ink-3">Add items to start measuring.</p>
      ) : (
        <div className="mt-4 h-0.5 overflow-hidden rounded bg-white/50" aria-hidden="true">
          <div className="h-full bg-ink-3/60 transition-[width]" style={{ width: `${(meter.probes / MAX_PROBES) * 100}%` }} />
        </div>
      )}
    </section>
  )
}
