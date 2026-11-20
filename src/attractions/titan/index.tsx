import { useRef } from 'react'
import type { AttractionId } from '@/data/attractions'
import { Ride } from '@/core/rides/Ride'
import { DEFAULT_TIMINGS } from '@/core/rides/types'
import { useRideSound } from '@/core/audio/useRideSound'
import { useSignTexture } from '@/utils/textTexture'
import { SwingBoat } from './SwingBoat'
import { Frame } from './Frame'
import { TITAN_CONFIG } from './layout'

/**
 * THE TITAN SWING — Competencia.
 * Giant swing boat: an oscillation θ = A·envelope(t)·sin(ωt) that builds up to
 * 75°, holds, then dies down and is damped to rest by the friction wheels.
 */
export default function TitanSwing({ id }: { id: AttractionId }) {
  const boatRef = useRef<SwingBoat | null>(null)
  const sign = useSignTexture('THE TITAN SWING', 'Projet Competencia', { width: 1024, height: 128, background: '#7c2d12', accent: '#fde68a', border: 6 })
  useRideSound(id, (state) => {
    const b = boatRef.current
    if (!b) return null
    return { speed: state === 'RUNNING' || state === 'BRAKING' ? b.getSpeed() : 0, lifting: false, braking: b.isBraking }
  })

  return (
    <Ride id={id} config={TITAN_CONFIG} createSimulation={() => (boatRef.current = new SwingBoat({ ...DEFAULT_TIMINGS, ...TITAN_CONFIG.timings }, sign))}>
      <Frame angle={() => boatRef.current?.boatAngle ?? 0} />
    </Ride>
  )
}
