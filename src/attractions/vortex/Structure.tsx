import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import { Color, InstancedMesh, Matrix4, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry } from 'three'
import { ArcWall } from '@/world/ArcWall'
import { MAT } from '@/world/materials'
import { useSignTexture } from '@/utils/textTexture'
import { DECK_RADIUS, FENCE_HEIGHT, FENCE_RADIUS, FRAME_SPREAD, FRAME_Z, PIVOT_Y } from './layout'

const LEG_LEN = Math.hypot(FRAME_SPREAD, PIVOT_Y)
const LEG_ANGLE = Math.atan2(FRAME_SPREAD, PIVOT_Y)
const bulbGeo = new SphereGeometry(0.16, 8, 6)
const BULBS = 28
const PINK = new Color('#f472b6')
const OFF = new Color('#3b0a24')

/**
 * Static part of THE VORTEX: two A-frames carrying the axle (bulbs chasing
 * with the arm's speed), a deck flush with the ground, a low glass ring and
 * the name sign on the frames.
 */
export function Structure({ speed }: { speed: () => number }) {
  const sign = useSignTexture('THE VORTEX', 'Projet Swipe', { width: 1024, height: 256, background: '#2a0717', accent: '#f472b6' })
  const mats = useMemo(
    () => ({
      frame: new MeshStandardMaterial({ color: '#312e81', roughness: 0.5, metalness: 0.4 }),
      accent: new MeshStandardMaterial({ color: '#ec4899', roughness: 0.5, metalness: 0.3 }),
      glass: new MeshStandardMaterial({ color: '#f9a8d4', transparent: true, opacity: 0.2, roughness: 0.1, depthWrite: false }),
      bulb: new MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
    }),
    [],
  )

  // bulbs running up both legs of the front frame and along its top beam
  const bulbs = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = new Matrix4()
    for (let i = 0; i < BULBS; i++) {
      const k = (i % (BULBS / 2)) / (BULBS / 2 - 1)
      const side = i < BULBS / 2 ? -1 : 1
      // along the leg from the foot (k = 0) to the apex (k = 1)
      bulbs.current!.setMatrixAt(i, m.makeTranslation(side * FRAME_SPREAD * (1 - k), PIVOT_Y * k, FRAME_Z + 0.45))
      bulbs.current!.setColorAt(i, PINK)
    }
    bulbs.current!.instanceMatrix.needsUpdate = true
    bulbs.current!.computeBoundingSphere()
  }, [])
  const phase = useRef(0)
  const c = useMemo(() => new Color(), [])
  useFrame((_, dt) => {
    const mesh = bulbs.current
    if (!mesh) return
    phase.current += dt * (1.5 + speed() * 0.35)
    for (let i = 0; i < BULBS; i++) {
      const k = (i % (BULBS / 2)) / (BULBS / 2)
      // light pulses climb towards the axle, faster as the arm speeds up
      const lit = Math.max(0, Math.sin((k - phase.current) * Math.PI * 2))
      mesh.setColorAt(i, c.copy(OFF).lerp(PINK, lit))
    }
    mesh.instanceColor!.needsUpdate = true
  })

  return (
    <group>
      {[-1, 1].map((sz) => (
        <group key={sz} position-z={sz * FRAME_Z}>
          {[-1, 1].map((sx) => (
            <mesh key={sx} position={[(sx * FRAME_SPREAD) / 2, PIVOT_Y / 2, 0]} rotation-z={sx * LEG_ANGLE} material={mats.frame} castShadow>
              <boxGeometry args={[0.7, LEG_LEN, 0.7]} />
            </mesh>
          ))}
          <mesh position-y={PIVOT_Y * 0.45} material={mats.frame} castShadow>
            <boxGeometry args={[FRAME_SPREAD * 1.08, 0.45, 0.45]} />
          </mesh>
          <mesh position-y={PIVOT_Y + 0.7} material={mats.accent} castShadow>
            <boxGeometry args={[3.2, 1.6, 1]} />
          </mesh>
          {[-1, 1].map((sx) => (
            <mesh key={sx} position={[sx * FRAME_SPREAD, 0.2, 0]} material={MAT.concrete} receiveShadow>
              <boxGeometry args={[1.8, 0.4, 1.8]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* axle */}
      <mesh position-y={PIVOT_Y} rotation-x={Math.PI / 2} material={MAT.metal} castShadow>
        <cylinderGeometry args={[0.4, 0.4, FRAME_Z * 2 + 1.2, 14]} />
      </mesh>
      {/* name sign on the front frame's cross beam */}
      <mesh position={[0, PIVOT_Y * 0.45 + 1.6, FRAME_Z + 0.3]}>
        <planeGeometry args={[8, 2]} />
        <meshStandardMaterial map={sign} emissiveMap={sign} emissive="#ffffff" emissiveIntensity={0.6} />
      </mesh>
      <instancedMesh ref={bulbs} args={[bulbGeo, mats.bulb, BULBS]} />

      {/* deck flush with the ground (the gondola sweeps just above it) and a low glass ring */}
      <mesh position-y={0.025} rotation-x={-Math.PI / 2} material={MAT.concrete} receiveShadow>
        <circleGeometry args={[DECK_RADIUS, 48]} />
      </mesh>
      <mesh position-y={0.035} rotation-x={-Math.PI / 2} material={MAT.yellow}>
        <ringGeometry args={[FENCE_RADIUS + 0.2, FENCE_RADIUS + 0.35, 48]} />
      </mesh>
      <mesh position={[0, 0.03, 17]} rotation-x={-Math.PI / 2} material={MAT.path} receiveShadow>
        <planeGeometry args={[3.2, 22 - DECK_RADIUS]} />
      </mesh>
      <ArcWall radius={FENCE_RADIUS} height={FENCE_HEIGHT} thickness={0.06} segments={36} material={mats.glass} />
      <mesh position-y={FENCE_HEIGHT} rotation-x={Math.PI / 2} material={MAT.metal}>
        <torusGeometry args={[FENCE_RADIUS, 0.05, 6, 64]} />
      </mesh>

      <RigidBody type="fixed" colliders={false}>
        {/* the deck's inner disc is out of bounds (fence); frame feet */}
        <CylinderCollider args={[0.8, FENCE_RADIUS - 0.2]} position={[0, 0.8, 0]} />
        {[-1, 1].map((sx) =>
          [-1, 1].map((sz) => <CuboidCollider key={`${sx}${sz}`} args={[0.9, 1.5, 0.9]} position={[sx * FRAME_SPREAD, 1.5, sz * FRAME_Z]} />),
        )}
      </RigidBody>
    </group>
  )
}
