import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { Color, InstancedMesh, Matrix4, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry } from 'three'
import { MAT } from '@/world/materials'
import { BRIDGE_Y, FRAME_SPREAD, FRAME_Z, PIVOT_Y } from './layout'

const LEG_LEN = Math.hypot(FRAME_SPREAD, PIVOT_Y)
const LEG_ANGLE = Math.atan2(FRAME_SPREAD, PIVOT_Y)
const bulbGeo = new SphereGeometry(0.14, 8, 6)
const BULBS = 24
const ON = new Color('#fde68a')
const OFF = new Color('#3a2a06')

/** Safety enclosure around the swing area (the boat sweeps up to |x| ≈ 17 m). */
const ENCLOSURE = { x: 13.5, zBack: -4.6, zFront: 3.0 }

/**
 * Static part of THE TITAN SWING: two A-frames carrying the axle, marquee
 * bulbs, the loading platform with its raised bridge by the last row, a glass
 * safety rail and the enclosure keeping visitors away from the swinging boat.
 */
export function Frame({ angle }: { angle: () => number }) {
  const mats = useMemo(
    () => ({
      frame: new MeshStandardMaterial({ color: '#7c2d12', roughness: 0.5, metalness: 0.4 }),
      accent: new MeshStandardMaterial({ color: '#f59e0b', roughness: 0.5, metalness: 0.3 }),
      glass: new MeshStandardMaterial({ color: '#9fd8ff', transparent: true, opacity: 0.22, roughness: 0.1, depthWrite: false }),
      bulb: new MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
    }),
    [],
  )

  // marquee bulbs along the top beam (both frames), chasing faster as the boat swings higher
  const bulbs = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = new Matrix4()
    for (let i = 0; i < BULBS; i++) {
      const side = i < BULBS / 2 ? 1 : -1
      const k = (i % (BULBS / 2)) / (BULBS / 2 - 1)
      bulbs.current!.setMatrixAt(i, m.makeTranslation((k - 0.5) * 7, PIVOT_Y + 1.05, side * (FRAME_Z + 0.45)))
      bulbs.current!.setColorAt(i, ON)
    }
    bulbs.current!.instanceMatrix.needsUpdate = true
    bulbs.current!.computeBoundingSphere()
  }, [])
  const phase = useRef(0)
  const lastStep = useRef(-1)
  useFrame((_, dt) => {
    const mesh = bulbs.current
    if (!mesh) return
    phase.current += dt * (4 + Math.abs(angle()) * 14)
    const step = Math.floor(phase.current)
    if (step === lastStep.current) return
    lastStep.current = step
    for (let i = 0; i < BULBS; i++) mesh.setColorAt(i, (i + step) % 3 === 0 ? OFF : ON)
    mesh.instanceColor!.needsUpdate = true
  })

  const E = ENCLOSURE
  return (
    <group>
      {/* A-frames: two legs and a cross brace each, top beam carrying the bulbs */}
      {[-1, 1].map((sz) => (
        <group key={sz} position-z={sz * FRAME_Z}>
          {[-1, 1].map((sx) => (
            <mesh key={sx} position={[(sx * FRAME_SPREAD) / 2, PIVOT_Y / 2, 0]} rotation-z={sx * LEG_ANGLE} material={mats.frame} castShadow>
              <boxGeometry args={[0.6, LEG_LEN, 0.6]} />
            </mesh>
          ))}
          <mesh position-y={PIVOT_Y * 0.42} material={mats.frame} castShadow>
            <boxGeometry args={[FRAME_SPREAD * 1.13, 0.4, 0.4]} />
          </mesh>
          <mesh position-y={PIVOT_Y + 0.55} material={mats.accent} castShadow>
            <boxGeometry args={[7.6, 0.6, 0.7]} />
          </mesh>
          {/* foot plates */}
          {[-1, 1].map((sx) => (
            <mesh key={sx} position={[sx * FRAME_SPREAD, 0.2, 0]} material={MAT.concrete} receiveShadow>
              <boxGeometry args={[1.6, 0.4, 1.6]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* axle */}
      <mesh position-y={PIVOT_Y} rotation-x={Math.PI / 2} material={MAT.metal} castShadow>
        <cylinderGeometry args={[0.32, 0.32, FRAME_Z * 2 + 1, 12]} />
      </mesh>
      <instancedMesh ref={bulbs} args={[bulbGeo, mats.bulb, BULBS]} />

      {/* loading platform along the boat, with a raised bridge by the last row */}
      <mesh position={[0, 0.15, 4.3]} material={MAT.concrete} receiveShadow castShadow>
        <boxGeometry args={[18, 0.3, 2.6]} />
      </mesh>
      <mesh position={[6.5, BRIDGE_Y - 0.15, 3.6]} material={MAT.wood} castShadow receiveShadow>
        <boxGeometry args={[3, 0.3, 1.2]} />
      </mesh>
      {[5.2, 7.8].map((x) => (
        <mesh key={x} position={[x, (BRIDGE_Y - 0.3) / 2, 3.6]} material={mats.frame} castShadow>
          <boxGeometry args={[0.25, BRIDGE_Y - 0.3, 0.25]} />
        </mesh>
      ))}
      {Array.from({ length: 7 }, (_, k) => (
        <mesh key={k} position={[4.75 - k * 0.45, BRIDGE_Y - 0.3 * (k + 1) + 0.06, 3.6]} material={MAT.wood} castShadow>
          <boxGeometry args={[0.45, 0.12, 1.2]} />
        </mesh>
      ))}
      <mesh position={[0, 0.85, E.zFront]} material={mats.glass}>
        <boxGeometry args={[E.x * 2, 1.1, 0.05]} />
      </mesh>
      {/* enclosure rails */}
      {[-E.x, E.x].map((x) => (
        <mesh key={x} position={[x, 0.55, (E.zBack + E.zFront) / 2]} material={MAT.darkMetal}>
          <boxGeometry args={[0.08, 1.1, E.zFront - E.zBack]} />
        </mesh>
      ))}
      <mesh position={[0, 0.55, E.zBack]} material={MAT.darkMetal}>
        <boxGeometry args={[E.x * 2, 1.1, 0.08]} />
      </mesh>

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[9, 0.15, 1.3]} position={[0, 0.15, 4.3]} />
        <CuboidCollider args={[E.x, 1.2, 0.15]} position={[0, 1.2, E.zFront]} />
        <CuboidCollider args={[E.x, 1.2, 0.15]} position={[0, 1.2, E.zBack]} />
        {[-E.x, E.x].map((x) => (
          <CuboidCollider key={x} args={[0.15, 1.2, (E.zFront - E.zBack) / 2]} position={[x, 1.2, (E.zBack + E.zFront) / 2]} />
        ))}
        {/* the loading bridge and the A-frame feet outside the enclosure */}
        {/* bridge + staircase as solid blocks: visitors cannot climb over the glass */}
        <CuboidCollider args={[1.5, BRIDGE_Y / 2, 0.6]} position={[6.5, BRIDGE_Y / 2, 3.6]} />
        <CuboidCollider args={[1.6, BRIDGE_Y / 2, 0.6]} position={[3.4, BRIDGE_Y / 2, 3.6]} />
        {[-1, 1].map((sx) => (
          <CuboidCollider key={sx} args={[0.8, 1.5, 0.8]} position={[sx * FRAME_SPREAD, 1.5, FRAME_Z]} />
        ))}
      </RigidBody>
    </group>
  )
}
