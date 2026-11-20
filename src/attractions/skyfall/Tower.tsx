import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import { BoxGeometry, Color, InstancedMesh, Matrix4, MeshBasicMaterial, MeshStandardMaterial, Quaternion, SphereGeometry, Vector3, type Mesh } from 'three'
import { ArcWall } from '@/world/ArcWall'
import { MAT } from '@/world/materials'
import { useSignTexture } from '@/utils/textTexture'
import type { DropTower } from './DropTower'
import { DECK_RADIUS, DECK_Y, FENCE_RADIUS, MAST_HALF, MAST_HEIGHT } from './layout'

const unitBox = new BoxGeometry(1, 1, 1)
const bulbGeo = new SphereGeometry(0.16, 8, 6)
const LEVEL = 2.4
const CORNER = 1.4
const BULB_EVERY = 2
const GREEN = new Color('#22c55e')
const DIM = new Color('#0b2a16')

/** Lattice members of the mast: corner columns, girts and X-braces on every face. */
function useLattice() {
  return useMemo(() => {
    const out: Matrix4[] = []
    const q = new Quaternion()
    const zAxis = new Vector3(0, 0, 1)
    const xAxis = new Vector3(1, 0, 0)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) out.push(new Matrix4().compose(new Vector3(sx * CORNER, MAST_HEIGHT / 2, sz * CORNER), q, new Vector3(0.32, MAST_HEIGHT, 0.32)))
    const levels = Math.floor(MAST_HEIGHT / LEVEL)
    const diag = Math.hypot(CORNER * 2, LEVEL)
    const ang = Math.atan2(LEVEL, CORNER * 2)
    for (let l = 0; l < levels; l++) {
      const y = l * LEVEL
      for (const s of [-1, 1]) {
        // girts on the ±Z and ±X faces
        out.push(new Matrix4().compose(new Vector3(0, y, s * CORNER), q, new Vector3(CORNER * 2, 0.14, 0.14)))
        out.push(new Matrix4().compose(new Vector3(s * CORNER, y, 0), q, new Vector3(0.14, 0.14, CORNER * 2)))
        // braces, alternating direction every level
        const d = (l % 2 ? 1 : -1) * ang
        out.push(new Matrix4().compose(new Vector3(0, y + LEVEL / 2, s * CORNER), new Quaternion().setFromAxisAngle(zAxis, d), new Vector3(diag, 0.1, 0.1)))
        out.push(new Matrix4().compose(new Vector3(s * CORNER, y + LEVEL / 2, 0), new Quaternion().setFromAxisAngle(xAxis, -d), new Vector3(0.1, 0.1, diag)))
      }
    }
    return out
  }, [])
}

/**
 * Static part of SKYFALL 3000: lattice mast with guide rails, crown with
 * signs and a heartbeat light ring (HealthIAi), chase lights that follow the
 * gondola, circular boarding deck with a safety fence.
 */
export function Tower({ tower }: { tower: () => DropTower | null }) {
  const lattice = useLattice()
  const latticeRef = useRef<InstancedMesh>(null)
  const bulbs = useRef<InstancedMesh>(null)
  const pulse = useRef<Mesh>(null)
  const beacon = useRef<Mesh>(null)
  const sign = useSignTexture('SKYFALL 3000', 'Projet HealthIAi', { width: 1024, height: 256, background: '#06140b', accent: '#22c55e' })
  const mats = useMemo(
    () => ({
      core: new MeshStandardMaterial({ color: '#d1d5db', roughness: 0.7 }),
      lattice: new MeshStandardMaterial({ color: '#f3f4f6', roughness: 0.4, metalness: 0.5 }),
      rail: new MeshStandardMaterial({ color: '#dc2626', roughness: 0.5, metalness: 0.4 }),
      pulse: new MeshStandardMaterial({ color: '#22c55e', emissive: '#22c55e', emissiveIntensity: 1, toneMapped: false }),
      bulb: new MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
      beacon: new MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 2, toneMapped: false }),
      // see-through safety glass, so the gondola and its seats stay visible from the deck
      glass: new MeshStandardMaterial({ color: '#9fd8ff', transparent: true, opacity: 0.22, roughness: 0.1, depthWrite: false }),
    }),
    [],
  )

  // chase lights: one column per face, just outside the rails
  const bulbSpots = useMemo(() => {
    const out: { p: Vector3; y: number }[] = []
    for (let y = 1.5; y < MAST_HEIGHT - 2; y += BULB_EVERY)
      for (const [x, z] of [[0, MAST_HALF + 0.25], [0, -MAST_HALF - 0.25], [MAST_HALF + 0.25, 0], [-MAST_HALF - 0.25, 0]] as const) out.push({ p: new Vector3(x, y, z), y })
    return out
  }, [])

  useLayoutEffect(() => {
    lattice.forEach((m, i) => latticeRef.current!.setMatrixAt(i, m))
    latticeRef.current!.instanceMatrix.needsUpdate = true
    latticeRef.current!.computeBoundingSphere()
    const m = new Matrix4()
    bulbSpots.forEach((b, i) => {
      bulbs.current!.setMatrixAt(i, m.makeTranslation(b.p.x, b.p.y, b.p.z))
      bulbs.current!.setColorAt(i, DIM)
    })
    bulbs.current!.instanceMatrix.needsUpdate = true
    bulbs.current!.computeBoundingSphere()
  }, [lattice, bulbSpots])

  const c = useMemo(() => new Color(), [])
  const beat = useRef(0)
  useFrame(({ clock }, dt) => {
    const t = tower()
    const time = clock.elapsedTime
    const ratio = t ? Math.max(0, t.heightRatio) : 0
    const gy = t?.gondolaY ?? 0
    const speed = t?.getSpeed() ?? 0
    // heartbeat: ~60 bpm at rest, racing during the ride (HealthIAi wink)
    beat.current += dt * (1 + ratio * 0.8 + Math.min(speed / 10, 2))
    const ph = beat.current % 1
    const lub = Math.exp(-(((ph - 0.1) / 0.05) ** 2)) + 0.6 * Math.exp(-(((ph - 0.32) / 0.05) ** 2))
    mats.pulse.emissiveIntensity = 0.4 + lub * 2.6
    if (beacon.current) mats.beacon.emissiveIntensity = Math.sin(time * 4) > 0 ? 2.5 : 0.2
    // chase lights: everything below the gondola glows, with a wave racing up the mast while idle
    const mesh = bulbs.current
    if (!mesh) return
    bulbSpots.forEach((b, i) => {
      const lit = t && gy > 2 ? (b.y < gy ? 1 : 0.08) : 0.25 + 0.75 * Math.max(0, Math.sin(b.y * 0.25 - time * 3))
      c.copy(DIM).lerp(GREEN, lit).multiplyScalar(0.6 + lit)
      mesh.setColorAt(i, c)
    })
    mesh.instanceColor!.needsUpdate = true
  })

  const H = MAST_HEIGHT
  return (
    <group>
      {/* deck, queue path and safety fence */}
      <mesh position-y={DECK_Y / 2} material={MAT.concrete} receiveShadow castShadow>
        <cylinderGeometry args={[DECK_RADIUS, DECK_RADIUS + 0.2, DECK_Y, 40]} />
      </mesh>
      <mesh position-y={DECK_Y + 0.005} rotation-x={-Math.PI / 2} material={MAT.yellow}>
        <ringGeometry args={[FENCE_RADIUS + 0.25, FENCE_RADIUS + 0.4, 40]} />
      </mesh>
      <mesh position={[0, 0.03, (DECK_RADIUS + 21) / 2]} rotation-x={-Math.PI / 2} material={MAT.path} receiveShadow>
        <planeGeometry args={[3.2, 21 - DECK_RADIUS]} />
      </mesh>
      <group position-y={DECK_Y}>
        <ArcWall radius={FENCE_RADIUS} height={1.1} thickness={0.06} segments={32} material={mats.glass} />
        <mesh position-y={1.12} rotation-x={Math.PI / 2} material={MAT.metal}>
          <torusGeometry args={[FENCE_RADIUS, 0.05, 6, 64]} />
        </mesh>
      </group>

      {/* mast: concrete core, lattice, guide rails, chase lights */}
      <mesh position-y={H / 2} material={mats.core} castShadow receiveShadow>
        <boxGeometry args={[2.1, H, 2.1]} />
      </mesh>
      <instancedMesh ref={latticeRef} args={[unitBox, mats.lattice, lattice.length]} castShadow />
      {[[0, MAST_HALF], [0, -MAST_HALF], [MAST_HALF, 0], [-MAST_HALF, 0]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, H / 2, z]} material={mats.rail} castShadow>
          <boxGeometry args={[x ? 0.12 : 0.5, H, z ? 0.12 : 0.5]} />
        </mesh>
      ))}
      <instancedMesh ref={bulbs} args={[bulbGeo, mats.bulb, bulbSpots.length]} />

      {/* crown */}
      <mesh position-y={H + 0.6} material={MAT.darkMetal} castShadow>
        <cylinderGeometry args={[3.2, 2.4, 1.2, 12]} />
      </mesh>
      <mesh position-y={H + 2.2} material={MAT.white} castShadow>
        <boxGeometry args={[3.4, 2, 3.4]} />
      </mesh>
      {[0, 1, 2, 3].map((k) => (
        <group key={k} rotation-y={(k * Math.PI) / 2}>
          <mesh position={[0, H - 3, MAST_HALF + 0.45]}>
            <planeGeometry args={[5.6, 1.4]} />
            <meshStandardMaterial map={sign} emissiveMap={sign} emissive="#ffffff" emissiveIntensity={0.7} />
          </mesh>
        </group>
      ))}
      <mesh ref={pulse} position-y={H + 1.25} rotation-x={Math.PI / 2} material={mats.pulse}>
        <torusGeometry args={[3.3, 0.12, 8, 48]} />
      </mesh>
      <mesh position-y={H + 3.6} material={MAT.darkMetal}>
        <cylinderGeometry args={[0.06, 0.06, 2.4, 6]} />
      </mesh>
      <mesh ref={beacon} position-y={H + 4.9} material={mats.beacon}>
        <sphereGeometry args={[0.35, 12, 8]} />
      </mesh>

      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[DECK_Y / 2, DECK_RADIUS]} position={[0, DECK_Y / 2, 0]} />
        <CuboidCollider args={[MAST_HALF + 0.2, H / 2, MAST_HALF + 0.2]} position={[0, H / 2, 0]} />
      </RigidBody>
    </group>
  )
}
