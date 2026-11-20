import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { AttractionId } from '@/data/attractions'
import { useGameStore } from '@/core/store/useGameStore'
import { rideRuntimes } from '@/core/rides/runtime'
import type { RideState } from '@/core/rides/types'
import { rideAudio } from './rideAudio'

export interface RideSoundProbe {
  /** Vehicle speed (m/s, absolute). */
  speed: number
  /** Chain / cable lift engaged (clicks). */
  lifting: boolean
  /** Brakes working (hiss). */
  braking: boolean
}

/**
 * Drives the procedural on-board sound for one attraction, only while the
 * visitor rides it: departure bell, lift clicks, wind / rumble with speed,
 * brake hiss; silent in pause.
 */
export function useRideSound(id: AttractionId, probe: (state: RideState) => RideSoundProbe | null) {
  const lastState = useRef<RideState | null>(null)
  useEffect(() => () => rideAudio.setActive(false), [])
  useFrame((_, dt) => {
    const s = useGameStore.getState()
    const state = rideRuntimes.get(id)?.state ?? 'IDLE'
    const p = s.activeRide?.id === id ? probe(state) : null
    if (!p) {
      if (lastState.current !== null) rideAudio.setActive(false)
      lastState.current = null
      return
    }
    if (lastState.current === null) {
      rideAudio.unlock() // boarding was a user gesture (E / click)
      rideAudio.setActive(true)
    }
    if (state === 'STARTING' && lastState.current !== 'STARTING') rideAudio.bell()
    lastState.current = state
    rideAudio.update(
      { speed: p.speed, onChain: p.lifting, braking: p.braking, level: s.phase === 'paused' ? 0 : 1 },
      Math.min(dt, 0.1),
    )
  })
}
