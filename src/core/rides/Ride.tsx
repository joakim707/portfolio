import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { AttractionId } from '@/data/attractions'
import { RideRuntime, rideRuntimes } from './runtime'
import type { RideConfig, RideSimulation } from './types'

interface RideProps {
  id: AttractionId
  config: RideConfig
  /** Factory, called once on mount (StrictMode-safe: disposed on unmount). */
  createSimulation: () => RideSimulation
  /** Static structure (station, supports, colliders…) in the zone's local frame. */
  children?: ReactNode
}

/**
 * Generic attraction host. Every ride module renders one <Ride>; it wires the
 * simulation to the shared runtime (state machine, boarding, cameras, exit)
 * and registers it so the player and the HUD can find it.
 */
export function Ride({ id, config, createSimulation, children }: RideProps) {
  const group = useRef<Group>(null)
  const [runtime, setRuntime] = useState<RideRuntime | null>(null)

  useEffect(() => {
    if (!group.current) return
    const sim = createSimulation()
    const rt = new RideRuntime(id, config, sim, group.current)
    group.current.add(sim.root)
    rideRuntimes.set(id, rt)
    setRuntime(rt)
    return () => {
      rt.dispose()
      sim.root.removeFromParent()
      if (rideRuntimes.get(id) === rt) rideRuntimes.delete(id)
      setRuntime(null)
    }
    // the config / factory are static per attraction module
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // priority -1: rides move before the player rig places the avatar and camera
  useFrame((_, dt) => runtime?.update(Math.min(dt, 1 / 20)), -1)

  return <group ref={group}>{children}</group>
}
