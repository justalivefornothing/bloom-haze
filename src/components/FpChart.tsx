import { useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { optimalK, optimalM, theoreticalFpRate } from '../lib/bloom'
import { fmtPct, fmtTick, niceCeil, fmtInt } from '../lib/format'

const W = 320
const H = 190
const PAD = { l: 38, r: 14, t: 14, b: 26 }
const SAMPLES = 80

interface Props {
  m: number
  k: number
  n: number
  measured: number
  probes: number
  onUseK: (k: number) => void
}

/** n at which the theoretical rate reaches 50%: -(m/k)·ln(1 - 0.5^(1/k)). */
function nHalf(m: number, k: number): number {
  return (-(m / k)) * Math.log(1 - Math.pow(0.5, 1 / k))
}

/** Theoretical FP rate as a function of n for the current m and k, with the live measured point. */
export function FpChart({ m, k, n, measured, probes, onUseK }: Props) {
  const [hover, setHover] = useState<number | null>(null)

  const { nMax, yMax, pts } = useMemo(() => {
    const reach = Math.max(n * 1.25, nHalf(m, k) * 1.5, 10)
    const step = niceCeil(reach / 5)
    const nMax = Math.ceil(reach / step) * step
    const yMax = Math.min(1, niceCeil(theoreticalFpRate(m, nMax, k) * 1.05) || 0.01)
    const pts = Array.from({ length: SAMPLES + 1 }, (_, i) => {
      const x = (nMax * i) / SAMPLES
      return { n: x, fp: theoreticalFpRate(m, x, k) }
    })
    return { nMax, yMax, pts }
  }, [m, k, n])

  const sx = (v: number) => PAD.l + (v / nMax) * (W - PAD.l - PAD.r)
  const sy = (v: number) => PAD.t + (1 - v / yMax) * (H - PAD.t - PAD.b)
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.n).toFixed(1)} ${sy(p.fp).toFixed(1)}`).join(' ')

  const theory = theoreticalFpRate(m, n, k)
  const kBest = optimalK(m, n)
  const fpBest = theoreticalFpRate(m, n, kBest)
  const mFor1pct = optimalM(Math.max(n, 1), 0.01)
  const hp = hover === null ? null : pts[hover]

  const locate = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    const frac = (x - PAD.l) / (W - PAD.l - PAD.r)
    setHover(Math.max(0, Math.min(SAMPLES, Math.round(frac * SAMPLES))))
  }
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const d = e.key === 'ArrowRight' ? 1 : -1
      setHover((h) => Math.max(0, Math.min(SAMPLES, (h ?? Math.round((n / nMax) * SAMPLES)) + d)))
    } else if (e.key === 'Escape') setHover(null)
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax)
  const xTicks = [0, 0.5, 1].map((f) => f * nMax)
  const tableRows = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ n: Math.round(f * nMax), fp: theoreticalFpRate(m, f * nMax, k) }))

  return (
    <section className="card p-5 sm:p-6" aria-label="False-positive rate versus item count">
      <h2 className="eyebrow">FP rate vs n · m = {fmtInt(m)}, k = {k}</h2>

      <div className="relative mt-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full cursor-crosshair touch-none outline-none focus-visible:ring-2 focus-visible:ring-bloom"
          role="img"
          tabIndex={0}
          aria-label={`Theoretical false-positive rate from n = 0 to ${fmtInt(nMax)}; at n = ${n} it is ${fmtPct(theory)}. Use arrow keys to read values.`}
          onPointerMove={locate}
          onPointerDown={locate}
          onPointerLeave={() => setHover(null)}
          onBlur={() => setHover(null)}
          onKeyDown={onKey}
        >
          {/* gridlines + y ticks */}
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={sy(t)} y2={sy(t)} stroke="rgba(74,58,120,0.12)" />
              <text x={PAD.l - 6} y={sy(t) + 3} textAnchor="end" fontSize={8.5} fill="#8f83a3" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {fmtTick(t)}
              </text>
            </g>
          ))}
          {xTicks.map((t) => (
            <text key={t} x={sx(t)} y={H - 8} textAnchor={t === 0 ? 'start' : t === nMax ? 'end' : 'middle'} fontSize={8.5} fill="#8f83a3">
              {t === 0 ? 'n = 0' : fmtInt(t)}
            </text>
          ))}

          {/* theoretical curve */}
          <path d={path} fill="none" stroke="#4a3aa7" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {/* current n */}
          {n > 0 && (
            <g>
              <line x1={sx(n)} x2={sx(n)} y1={PAD.t} y2={H - PAD.b} stroke="#8f83a3" strokeWidth={1} />
              <circle cx={sx(n)} cy={sy(Math.min(theory, yMax))} r={4} fill="#4a3aa7" stroke="#fff" strokeWidth={2} />
              {probes > 0 && (
                <circle
                  cx={sx(n)}
                  cy={sy(Math.min(measured, yMax))}
                  r={5}
                  fill="#d6199a"
                  stroke="#fff"
                  strokeWidth={2}
                  style={{ transition: 'cy 400ms ease-out' }}
                />
              )}
            </g>
          )}

          {/* crosshair */}
          {hp && (
            <g>
              <line x1={sx(hp.n)} x2={sx(hp.n)} y1={PAD.t} y2={H - PAD.b} stroke="#2a1f3d" strokeWidth={1} />
              <circle cx={sx(hp.n)} cy={sy(hp.fp)} r={4} fill="#4a3aa7" stroke="#fff" strokeWidth={2} />
            </g>
          )}
        </svg>

        {hp && (
          <div
            className="pointer-events-none absolute top-2 rounded-xl bg-ink/90 px-3 py-2 text-xs text-white shadow-lg"
            style={{ left: `${(sx(hp.n) / W) * 100}%`, transform: `translateX(${hp.n > nMax / 2 ? '-108%' : '8%'})` }}
            role="status"
          >
            <div className="text-ink-3">n = {fmtInt(hp.n)}</div>
            <div className="flex items-center gap-2 tabular-nums">
              <span className="inline-block h-0.5 w-3 rounded bg-theory" /> <b className="font-medium">{fmtPct(hp.fp)}</b> theory
            </div>
          </div>
        )}
      </div>

      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2" aria-label="Legend">
        <li className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-4 rounded bg-theory" aria-hidden="true" /> theoretical (1 − e^(−kn/m))^k
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-bloom ring-2 ring-white" aria-hidden="true" /> measured at n = {fmtInt(n)}
        </li>
      </ul>

      <div className="mt-5 rounded-2xl bg-white/40 p-4 text-sm">
        <p className="eyebrow mb-2">Optimal k</p>
        {n === 0 ? (
          <p className="text-ink-3">With no items, any k is optimal — add some to size the filter.</p>
        ) : (
          <>
            <p className="text-ink-2">
              For n = {fmtInt(n)} in m = {fmtInt(m)} bits, k* = round((m/n)·ln 2) ={' '}
              <b className="font-medium text-ink">{kBest}</b>, giving <b className="font-medium text-ink">{fmtPct(fpBest)}</b>
              {kBest !== k && (
                <>
                  {' '}
                  instead of {fmtPct(theory)} at k = {k}.{' '}
                  <button type="button" className="chip-btn ml-1 !py-0.5 !text-xs" onClick={() => onUseK(kBest)}>
                    Use k = {kBest}
                  </button>
                </>
              )}
              {kBest === k && ' — you are already there.'}
            </p>
            <p className="mt-2 text-ink-3">
              A 1% rate at this n needs m ≈ {fmtInt(mFor1pct)} bits ({(mFor1pct / Math.max(n, 1)).toFixed(1)} per item).
            </p>
          </>
        )}
      </div>

      <details className="mt-3 text-xs text-ink-2">
        <summary className="cursor-pointer select-none text-ink-3 hover:text-ink">Table view</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead className="text-ink-3">
            <tr>
              <th className="py-1 font-medium">n</th>
              <th className="py-1 font-medium">theoretical</th>
              <th className="py-1 font-medium">measured</th>
            </tr>
          </thead>
          <tbody>
            {[...tableRows, { n, fp: theory, live: true }]
              .sort((a, b) => a.n - b.n)
              .map((r, i) => (
                <tr key={i} className={'live' in r ? 'text-ink' : ''}>
                  <td className="py-0.5">{fmtInt(r.n)}</td>
                  <td className="py-0.5">{fmtPct(r.fp)}</td>
                  <td className="py-0.5">{'live' in r && probes > 0 ? fmtPct(measured) : '–'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </section>
  )
}
