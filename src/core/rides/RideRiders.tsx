import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Object3D } from 'three'
import { QUALITY_PRESETS, useGameStore } from '@/core/store/useGameStore'
import { createRng } from '@/utils/random'
import { SIT_HIP } from '@/world/player/characters'
import { createSeatedRider, useNpcCharacters } from '@/world/npc/characterPool'
import type { RideRuntime } from './runtime'

/**
 * NPC passengers for any ride: a share of the seats (never the player's) gets
 * a seated visitor, re-drawn at every departure. Riders are children of the
 * seats, so they follow every motion of the ride; their sitting pose is
 * frozen once (no per-frame animation cost). Visible while the ride runs —
 * player rides and automatic demo cycles alike — and hidden when parked.
 */
export function RideRiders({ runtime }: { runtime: RideRuntime }) {
  const quality = useGameStore((s) => s.quality)
  const fill = QUALITY_PRESETS[quality].riderFill
  const sources = useNpcCharacters(quality === 'low' ? 4 : 8)

  const wasRunning = useRef(false)
  const riders = useMemo(() => {
    const seats = runtime.sim.getAllSeats?.() ?? []
    const mine = runtime.sim.getSeat(runtime.config.playerSeat)
    return seats
      .filter((s) => s !== mine)
      .map((seat, i) => {
        const rider = createSeatedRider(sources[i % sources.length])
        // seated origin: below the hip point by the model's sitting height
        rider.position.set(0, -SIT_HIP, 0)
        rider.visible = false
        return { seat, rider }
      })
  }, [runtime, sources])

  // attach / detach symmetrically in the effect (safe with React's dev double mount)
  useEffect(() => {
    for (const { seat, rider } of riders) seat.add(rider)
    wasRunning.current = false // re-draw passengers for the current cycle
    return () => {
      for (const { seat, rider } of riders) seat.remove(rider)
    }
  }, [riders])

  const rng = useMemo(() => createRng(7), [])
  useFrame(() => {
    const running = runtime.state !== 'IDLE' || runtime.ghost.active
    if (running && !wasRunning.current) {
      // a new cycle: new passengers
      for (const r of riders) (r.rider as Object3D).visible = rng() < fill
    } else if (!running && wasRunning.current) {
      for (const r of riders) r.rider.visible = false
    }
    wasRunning.current = running
  })

  return null
}
