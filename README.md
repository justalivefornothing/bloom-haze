# Bloom Haze

A Bloom filter playground. Bits light up as you insert items, and a live meter tracks the measured false-positive rate against the theoretical curve.

## What you get

- Bit array (m up to 4096) drawn as pills — each insert animates its k target bits
- Double hashing from two scratch hashes (FNV-1a + murmur-style mix)
- Membership probes that show every checked bit and tag real false positives
- Live FP meter that fires random non-member probes in the background
- Optimal-k calculator and FP-vs-n chart for the current m/k
- Counting Bloom filter mode with delete support (4-bit counters as pill heights)
- Presets: spell-checker word list, URL blocklist, tiny-m collision demo

## Why it exists

Bloom filters are easy to describe and hard to *feel*. This one makes the trade-offs visible: watch collisions accumulate, watch the needle drift toward `(1 − e^(−kn/m))^k`, and see what “probably yes” actually costs.

## Status

See `PLAN.md` for the full architecture and remaining milestones. Core filters + UI scaffolding are present.

## License

MIT
