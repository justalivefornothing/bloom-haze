import { useState, type FormEvent } from 'react'
import type { Kind, Probe } from '../hooks/useFilter'
import { hex32, fmtInt } from '../lib/format'

interface Props {
  kind: Kind
  items: readonly string[]
  probe: Probe | null
  onAdd: (item: string) => void
  onProbe: (item: string) => void
  onRemove: (item: string) => void
}

const SHOWN = 40

export function ProbePanel({ kind, items, probe, onAdd, onProbe, onRemove }: Props) {
  const [text, setText] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onAdd(text)
    setText('')
  }

  // Collapse duplicates (counting mode) into item × count, most recent first.
  const counts = new Map<string, number>()
  for (const it of items) counts.set(it, (counts.get(it) ?? 0) + 1)
  const unique = [...counts.keys()].reverse()

  return (
    <section className="card p-5 sm:p-6" aria-label="Add and probe items">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <input
          className="field"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a word or URL…"
          aria-label="Item"
          autoComplete="off"
          spellCheck={false}
        />
        <div className="flex gap-2">
          <button type="submit" className="chip-btn primary flex-1 sm:flex-none" disabled={!text.trim()}>
            Add
          </button>
          <button
            type="button"
            className="chip-btn flex-1 sm:flex-none"
            disabled={!text.trim()}
            onClick={() => onProbe(text)}
          >
            Check
          </button>
        </div>
      </form>

      {probe && <ProbeResultView probe={probe} kind={kind} onRemove={onRemove} />}

      <div className="mt-5">
        <p className="eyebrow mb-2">
          {items.length === 0 ? 'No items yet' : `${fmtInt(items.length)} item${items.length === 1 ? '' : 's'}`}
          {kind === 'counting' && items.length > 0 && ' · click × to delete'}
          {kind === 'standard' && items.length > 0 && ' · click to check'}
        </p>
        {items.length === 0 ? (
          <p className="text-sm text-ink-3">Add something above or pick a preset — every insert lights up k bits.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {unique.slice(0, SHOWN).map((it) => {
              const c = counts.get(it) ?? 0
              return (
                <li key={it} className="flex items-stretch overflow-hidden rounded-full bg-white/45 text-sm">
                  <button
                    type="button"
                    className="px-2.5 py-1 text-ink-2 transition hover:bg-white/70 hover:text-ink"
                    onClick={() => onProbe(it)}
                    title={`Check "${it}"`}
                  >
                    {it}
                    {c > 1 && <span className="ml-1 text-ink-3">×{c}</span>}
                  </button>
                  {kind === 'counting' && (
                    <button
                      type="button"
                      className="px-2 text-ink-3 transition hover:bg-bloom hover:text-white"
                      onClick={() => onRemove(it)}
                      aria-label={`Delete ${it}`}
                    >
                      ×
                    </button>
                  )}
                </li>
              )
            })}
            {unique.length > SHOWN && (
              <li className="px-2 py-1 text-sm text-ink-3">and {fmtInt(unique.length - SHOWN)} more</li>
            )}
          </ul>
        )}
      </div>
    </section>
  )
}

function ProbeResultView({ probe, kind, onRemove }: { probe: Probe; kind: Kind; onRemove: (s: string) => void }) {
  const falsePositive = probe.positive && !probe.member
  const verdict = probe.positive ? 'probably yes' : 'definitely not'
  return (
    <div key={probe.id} className="fade-in mt-5 rounded-2xl bg-white/40 p-4" aria-live="polite">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-ink-2">
          Is <span className="font-medium text-ink">“{probe.item}”</span> in the set?
        </span>
        <span className={`text-xl font-normal ${probe.positive ? 'text-bloom' : 'text-ink'}`}>{verdict}</span>
        {falsePositive && (
          <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-medium tracking-wide text-white">
            false positive
          </span>
        )}
        {probe.positive && probe.member && <span className="text-sm text-ink-3">(and it really is)</span>}
        {kind === 'counting' && probe.member && (
          <button type="button" className="chip-btn ml-auto" onClick={() => onRemove(probe.item)}>
            Delete it
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Checked bits">
        {probe.indices.map((i, n) => {
          const on = probe.cells[n] !== 0
          return (
            <span
              key={n}
              className={`rounded-full px-2.5 py-1 text-xs tabular-nums ${on ? 'bg-bloom text-white' : 'bg-white/70 text-ink-2 ring-1 ring-ink-3/40'}`}
              title={`h${n} = (${probe.a} + ${n}·${probe.b}) mod m = ${i}`}
            >
              #{i} {on ? (kind === 'counting' ? `·${probe.cells[n]}` : '●') : '○'}
            </span>
          )
        })}
      </div>

      <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-3">
        fnv1a = {hex32(probe.h1)} → {probe.a} &nbsp;·&nbsp; mix = {hex32(probe.h2)} → {probe.b}
        &nbsp;·&nbsp; index<sub>i</sub> = ({probe.a} + i·{probe.b}) mod m
      </p>
    </div>
  )
}
