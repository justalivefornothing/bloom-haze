/** Percent with sensible precision: 60.7%, 9.22%, 0.820%, 0.012%. */
export function fmtPct(x: number): string {
  if (!Number.isFinite(x)) return '–'
  const p = x * 100
  if (p === 0) return '0%'
  if (p >= 10) return `${p.toFixed(1)}%`
  if (p >= 1) return `${p.toFixed(2)}%`
  return `${p.toFixed(3)}%`
}

/** Compact percent for ticks and scale ends: 20%, 2.5%, 0.1%. */
export function fmtTick(x: number): string {
  const p = x * 100
  return `${parseFloat(p.toPrecision(3))}%`
}

export function hex32(n: number): string {
  return '0x' + n.toString(16).padStart(8, '0')
}

/** Smallest "nice" number (1/2/5 × 10^e) that is >= x. */
export function niceCeil(x: number): number {
  if (x <= 0) return 0
  const e = Math.floor(Math.log10(x))
  const base = 10 ** e
  for (const f of [1, 2, 5, 10]) if (f * base >= x - 1e-12) return f * base
  return 10 * base
}
