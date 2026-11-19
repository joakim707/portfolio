import { useLayoutEffect, useMemo, useRef } from 'react'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import { BoxGeometry, CatmullRomCurve3, InstancedMesh, Matrix4, MeshStandardMaterial, Vector3 } from 'three'
import type { AttractionId } from '@/data/attractions'
import { Ride } from '@/core/rides/Ride'
import { DEFAULT_TIMINGS, type RideConfig } from '@/core/rides/types'
import { MAT } from '@/world/materials'
import { useSignTexture } from '@/utils/textTexture'
import { TestCoaster } from './TestCoaster'
import { TrackBuilder, buildTrack, type Track } from './track'

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

const tieGeo = new BoxGeometry(1.1, 0.08, 0.14)
const railMat = new MeshStandardMaterial({ color: '#9aa3ad', metalness: 0.8, roughness: 0.3 })
const spineMat = new MeshStandardMaterial({ color: '#ff4d6d', metalness: 0.3, roughness: 0.5 })

function TrackMesh({ track }: { track: Track }) {
  const { left, right, spine, supports } = useMemo(() => {
    const step = 3
    const L: Vector3[] = []
    const R: Vector3[] = []
    const S: Vector3[] = []
    for (let i = 0; i < track.segments; i += step) {
      const p = track.points[i]
      L.push(p.clone().addScaledVector(track.binormals[i], -0.45))
      R.push(p.clone().addScaledVector(track.binormals[i], 0.45))
      S.push(p.clone().addScaledVector(track.normals[i], -0.3))
    }
    const supports: Vector3[] = []
    for (let i = 0; i < track.segments; i += 14) {
      const p = track.points[i]
      if (track.labels[i] === 'loop' || p.y < 1.4 || track.normals[i].y < 0.5) continue
      supports.push(p.clone().addScaledVector(track.normals[i], -0.3))
    }
    const mk = (pts: Vector3[]) => new CatmullRomCurve3(pts, true, 'centripetal')
    return { left: mk(L), right: mk(R), spine: mk(S), supports }
  }, [track])

  const ties = useRef<InstancedMesh>(null)
  const tieCount = Math.floor(track.segments / 2)
  useLayoutEffect(() => {
    const m = new Matrix4()
    for (let k = 0; k < tieCount; k++) {
      const i = k * 2
      const t = track.tangents[i]
      m.makeBasis(track.binormals[i], track.normals[i], t.clone().negate()).setPosition(
        track.points[i].clone().addScaledVector(track.normals[i], -0.06),
      )
      ties.current!.setMatrixAt(k, m)
    }
    ties.current!.instanceMatrix.needsUpdate = true
    ties.current!.computeBoundingSphere()
  }, [track, tieCount])

  return (
    <group>
      <mesh material={railMat} castShadow>
        <tubeGeometry args={[left, 600, 0.06, 6, true]} />
      </mesh>
      <mesh material={railMat} castShadow>
        <tubeGeometry args={[right, 600, 0.06, 6, true]} />
      </mesh>
      <mesh material={spineMat} castShadow>
        <tubeGeometry args={[spine, 600, 0.16, 8, true]} />
      </mesh>
      <instancedMesh ref={ties} args={[tieGeo, MAT.darkMetal, tieCount]} castShadow />
      {supports.map((p, i) => (
        <mesh key={i} position={[p.x, p.y / 2, p.z]} material={MAT.darkMetal} castShadow>
          <cylinderGeometry args={[0.14, 0.2, p.y, 8]} />
        </mesh>
      ))}
      {/* loop base columns */}
      <RigidBody type="fixed" colliders={false}>
        {supports.map((p, i) => (
          <CylinderCollider key={i} args={[p.y / 2, 0.3]} position={[p.x, p.y / 2, p.z]} />
        ))}
      </RigidBody>
    </group>
  )
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
    <Ride id={id} config={CONFIG} createSimulation={() => new TestCoaster(track, { ...DEFAULT_TIMINGS, ...CONFIG.timings })}>
      <TrackMesh track={track} />
      <Station />
    </Ride>
  )
}
