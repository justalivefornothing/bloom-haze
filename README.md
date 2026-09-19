# Bloom Haze

Bloom filter playground. Bits light up as you insert items; a live meter tracks measured false-positive rate against the theoretical curve.

## Features

- Bit array (m up to 4096) — each insert animates its k target bits
- Double hashing (FNV-1a + murmur-style mix)
- Membership probes that show every checked bit and tag real false positives
- Live FP meter with random non-member probes
- Optimal-k calculator and FP-vs-n chart for the current m/k
- Counting Bloom filter mode with delete (4-bit counters as pill heights)
- Presets: spell-checker list, URL blocklist, tiny-m collision demo

## Run

```bash
npm install
npm run dev
```

## License

MIT
