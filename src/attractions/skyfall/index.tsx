import { useRef } from 'react'
import type { AttractionId } from '@/data/attractions'
import { Ride } from '@/core/rides/Ride'
import { DEFAULT_TIMINGS } from '@/core/rides/types'
import { useRideSound } from '@/core/audio/useRideSound'
import { DropTower } from './DropTower'
import { SKYFALL_CONFIG } from './layout'
import { Tower } from './Tower'

/**
 * SKYFALL 3000 — HealthIAi.
 * Giant drop tower: slow panoramic ascent above every other ride, a pause at
 * the top, a real-gravity free fall, magnetic braking and a gentle return.
 */
export default function Skyfall({ id }: { id: AttractionId }) {
  const towerRef = useRef<DropTower | null>(null)
  const tower = () => towerRef.current
  useRideSound(id, (state) => {
    const t = tower()
    if (!t) return null
    return {
      speed: state === 'RUNNING' || state === 'BRAKING' ? t.getSpeed() : 0,
      lifting: state === 'RUNNING' && t.lifting,
      braking: state === 'BRAKING' || (state === 'RUNNING' && t.braking),
    }
  })

  return (
    <Ride id={id} config={SKYFALL_CONFIG} createSimulation={() => (towerRef.current = new DropTower({ ...DEFAULT_TIMINGS, ...SKYFALL_CONFIG.timings }))}>
      <Tower tower={tower} />
    </Ride>
  )
}
