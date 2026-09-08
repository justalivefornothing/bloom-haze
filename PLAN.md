# Bloomhaze — plan

A Bloom filter playground where bits bloom as you add items and a live meter
compares the measured false-positive rate against the theoretical curve.

## Goal

Make the trade-offs of a Bloom filter *felt*: watch `k` bits light up per
insert, watch collisions accumulate as the array fills, and watch a needle
drift toward the textbook `(1 - e^{-kn/m})^k` curve as thousands of random
probes are fired in the background.

## Features (all required)

1. Bit array (m up to 4096) rendered as a wrapped row of pills; adding an item
   animates its k target bits lighting up.
2. Double hashing `h1 + i*h2 mod m` from two scratch hashes (FNV-1a and a
   murmur-style mix) to derive k indices.
3. Membership probe: shows each checked bit and whether the answer is
   "definitely not" or "probably yes", tagging real false positives.
4. Live false-positive meter: fires random non-member probes and plots the
   measured rate vs the theoretical value on a semicircular gauge.
5. Optimal-k calculator and a chart of FP rate as a function of n for the
   current m and k.
6. Counting Bloom filter mode with delete support; 4-bit counters shown as
   pill heights.
7. Presets: spell-checker (words list), URL blocklist, tiny m to force
   collisions.

## Architecture

```
src/
  lib/
    hash.ts        fnv1a, mix (murmur-style finaliser), doubleHashIndices
    bloom.ts       BloomFilter, CountingBloomFilter, optimalK,
                   theoreticalFpRate, measureFp
    random.ts      mulberry32 PRNG + seeded random-string generator
    presets.ts     word list, URL blocklist, tiny-m preset
    bloom.test.ts  vitest (spec assertions + a few extras)
  hooks/
    useFilter.ts   owns m/k/mode/items and the mutable filter instance
    useFpMeter.ts  requestAnimationFrame batch loop probing non-members
  components/
    BitGrid.tsx    pills (set / bloom / pulse / counter height)
    Gauge.tsx      semicircular FP gauge with needle + theoretical tick
    FpChart.tsx    FP rate vs n curve with crosshair tooltip + table twin
    Controls.tsx   m / k sliders, mode toggle, presets
    ProbePanel.tsx add / check form and probe result
  App.tsx          layout
```

State is plain React (`useState`/`useRef`); the filter instance is mutable and
versioned so the meter can reset when it changes.

## Milestones

- [ ] plan, license, gitignore
- [ ] scaffold vite react-ts + tailwind + vitest
- [ ] core: hashes, filters, math, tests green
- [ ] bit grid + controls + add/probe
- [ ] FP meter (rAF loop) + gauge
- [ ] FP-vs-n chart + optimal-k readout
- [ ] counting mode + presets
- [ ] build, smoke screenshot, polish
- [ ] readme, publish
