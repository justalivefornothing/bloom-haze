import type { Filter } from '../lib/bloom'
import { theoreticalFpRate } from '../lib/bloom'
import { useFpMeter } from '../hooks/useFpMeter'
import { FpChart } from './FpChart'
import { Gauge } from './Gauge'

interface Props {
  filter: Filter
  version: number
  members: ReadonlySet<string>
  onUseK: (k: number) => void
}

/** Runs the probe loop once and feeds both the gauge and the chart. */
export function MeterPanel({ filter, version, members, onUseK }: Props) {
  const meter = useFpMeter(filter, version, members)
  const { m, k, n } = filter
  const theory = theoreticalFpRate(m, n, k)
  return (
    <>
      <Gauge meter={meter} theory={theory} n={n} />
      <FpChart m={m} k={k} n={n} measured={meter.rate} probes={meter.probes} onUseK={onUseK} />
    </>
  )
}
