import { useMemo } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { Vector3 } from 'three'
import type { AttractionId } from '@/data/attractions'
import { Ride } from '@/core/rides/Ride'
import { DEFAULT_TIMINGS, type RideConfig } from '@/core/rides/types'
import { MAT } from '@/world/materials'
import { useSignTexture } from '@/utils/textTexture'
import { CoasterTrain } from '@/attractions/_shared/coaster/CoasterTrain'
import { TrackMesh } from '@/attractions/_shared/coaster/TrackMesh'
import { TrackBuilder, buildTrack, type Track } from '@/attractions/_shared/coaster/track'

/**
 * DEV-ONLY test bench (étape 4): a compact coaster that exercises the whole
 * generic ride system — boarding, restraints, launch, lift, drop, banked
 * turns, a vertical loop, brakes, unboarding, interruption and all cameras.
 * Mounted on any plot with ?testride=<attraction-id>; never shipped in prod.
 */

const RAIL_Y = 0.6
const PI2 = Math.PI / 2

function makeTrack(): Track {
  const b = new TrackBuilder(new Vector3(-6, RAIL_Y, 10), 0)
  b.straight(12, 0, 'station')
    .turn(4, PI2, 0.6, 'turn', 0.35)
    .straight(12, 10, 'lift')
    .turn(4, PI2, 0.3, 'turn', 0.45)
    .straight(9, -9.5, 'drop')
    .straight(1.5, 0, 'flat')
    .loop(3.2, 2.2, 'loop')
    .straight(1.5, 0, 'flat')
    .turn(4, PI2, 0, 'turn', 0.6)
    .straight(9.8, -1.0, 'brake')
    .turn(4, PI2, -0.4, 'brake', 0.3)
  return buildTrack(b.samples)
}

const CONFIG: RideConfig = {
  timings: { ...DEFAULT_TIMINGS },
  playerSeat: 0,
  platform: { position: [0, 0.3, 11.7], yaw: 0 },
  exit: { position: [3, 0, 16], yaw: Math.PI },
  boarding: { position: [0, 0, 13.5], radius: 3.5 },
  stationCamera: { position: [4.5, 2.8, 15.5], target: [0, 1.2, 10] },
  chaseOffset: [0, 2.4, 6.5],
  cinematicShots: [
    [12, 2, 13],
    [13, 14, -13],
    [-13, 3, -13],
    [-4, 2.5, -4],
    [-13, 2, 6],
  ],
  idleCycleEvery: 25,
}

function Station() {
  const sign = useSignTexture("BANC D'ESSAI", 'Système générique d’attractions · dev', { accent: '#f6c445' })
  return (
    <group>
      {/* platform deck on the plaza side of the station track */}
      <mesh position={[0, 0.15, 12]} material={MAT.concrete} receiveShadow castShadow>
        <boxGeometry args={[11, 0.3, 2.4]} />
      </mesh>
      {[-5, 5].map((x) =>
        [10.9, 13].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 1.8, z]} material={MAT.white} castShadow>
            <boxGeometry args={[0.2, 3.6, 0.2]} />
          </mesh>
        )),
      )}
      <mesh position={[0, 3.7, 11.6]} material={MAT.navy} castShadow>
        <boxGeometry args={[11, 0.2, 4.2]} />
      </mesh>
      <mesh position={[0, 4.4, 13.3]}>
        <planeGeometry args={[6, 1.5]} />
        <meshStandardMaterial map={sign} emissiveMap={sign} emissive="#ffffff" emissiveIntensity={0.25} />
      </mesh>
      {/* safety fence between the platform edge and the track (the avatar is animated across it) */}
      <mesh position={[0, 0.85, 10.85]} material={MAT.metal}>
        <boxGeometry args={[11, 0.06, 0.06]} />
      </mesh>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[5.5, 0.15, 1.2]} position={[0, 0.15, 12]} />
        {/* keep walkers off the track: fence around the circuit footprint */}
        <CuboidCollider args={[5.5, 1, 0.1]} position={[0, 1, 10.8]} />
        <CuboidCollider args={[0.1, 1, 11]} position={[-11.5, 1, 0]} />
        <CuboidCollider args={[0.1, 1, 11]} position={[11.5, 1, 0]} />
        <CuboidCollider args={[11.5, 1, 0.1]} position={[0, 1, -11.5]} />
        <CuboidCollider args={[3, 1, 0.1]} position={[-8.5, 1, 10.8]} />
        <CuboidCollider args={[3, 1, 0.1]} position={[8.5, 1, 10.8]} />
      </RigidBody>
    </group>
  )
}

export default function TestBench({ id }: { id: AttractionId }) {
  const track = useMemo(makeTrack, [])
  return (
    <Ride
      id={id}
      config={CONFIG}
      createSimulation={() =>
        new CoasterTrain({ track, timings: { ...DEFAULT_TIMINGS, ...CONFIG.timings }, stationS: 6, cars: 1, spacing: 2.6, playerCar: 0, liftSpeed: 3, launchSpeed: 3, brakeSpeed: 4, minInversionSpeed: 5, drag: 0.008 })
      }
    >
      <TrackMesh track={track} supportEvery={4} colliders />
      <Station />
    </Ride>
  )
}
