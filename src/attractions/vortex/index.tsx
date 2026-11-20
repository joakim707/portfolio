import { useRef } from 'react'
import type { AttractionId } from '@/data/attractions'
import { Ride } from '@/core/rides/Ride'
import { DEFAULT_TIMINGS } from '@/core/rides/types'
import { useRideSound } from '@/core/audio/useRideSound'
import { Pendulum } from './Pendulum'
import { Structure } from './Structure'
import { VORTEX_CONFIG } from './layout'

/**
 * THE VORTEX — Swipe.
 * Giant pendulum with a spinning gondola: a driven pendulum (precomputed
 * once) builds from gentle swings to two full revolutions over the axle,
 * then dies down, while the passenger disc spins about the arm.
 */
export default function Vortex({ id }: { id: AttractionId }) {
  const simRef = useRef<Pendulum | null>(null)
  useRideSound(id, (state) => {
    const p = simRef.current
    if (!p) return null
    return { speed: state === 'RUNNING' || state === 'BRAKING' ? p.getSpeed() : 0, lifting: false, braking: p.isBraking }
  })

  return (
    <Ride id={id} config={VORTEX_CONFIG} createSimulation={() => (simRef.current = new Pendulum({ ...DEFAULT_TIMINGS, ...VORTEX_CONFIG.timings }))}>
      <Structure speed={() => simRef.current?.getSpeed() ?? 0} />
    </Ride>
  )
}
