import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { Color, DoubleSide, Group, InstancedMesh, Matrix4, SphereGeometry } from 'three'
import { ENTRANCE_GAP_DEG, ENTRANCE_Z, PARK_RADIUS } from '@/config/park'
import { useSignTexture } from '@/utils/textTexture'
import { useDistanceGate } from '@/utils/useDistanceGate'
import { MAT } from './materials'
import { ArcWall } from './ArcWall'

const TOWER_X = 15
const TOWER_W = 6
const TOWER_H = 20
const BULBS = 28
const bulbGeo = new SphereGeometry(0.28, 10, 8)
const cOn = new Color('#fff1a8')
const cOff = new Color('#5a4a20')

function Tower({ x }: { x: number }) {
  const flag = useRef<Group>(null)
  const near = useDistanceGate([x, 0, ENTRANCE_Z], 260)
  useFrame(({ clock }) => {
    if (!near.current || !flag.current) return
    flag.current.rotation.y = Math.sin(clock.elapsedTime * 2.2 + x) * 0.25
  })
  return (
    <group position={[x, 0, 0]}>
      <mesh position-y={TOWER_H / 2} material={MAT.white} castShadow receiveShadow>
        <boxGeometry args={[TOWER_W, TOWER_H, TOWER_W]} />
      </mesh>
      {/* plinth and crown bands */}
      <mesh position-y={0.8} material={MAT.stoneDark} castShadow>
        <boxGeometry args={[TOWER_W + 1, 1.6, TOWER_W + 1]} />
      </mesh>
      <mesh position-y={TOWER_H - 1.2} material={MAT.brand} castShadow>
        <boxGeometry args={[TOWER_W + 0.6, 1.6, TOWER_W + 0.6]} />
      </mesh>
      <mesh position-y={TOWER_H + 3.5} rotation-y={Math.PI / 4} material={MAT.navy} castShadow>
        <coneGeometry args={[TOWER_W * 0.78, 7, 4]} />
      </mesh>
      <mesh position-y={TOWER_H + 7.4} material={MAT.gold}>
        <sphereGeometry args={[0.6, 16, 12]} />
      </mesh>
      {/* flag */}
      <mesh position-y={TOWER_H + 9.5} material={MAT.metal}>
        <cylinderGeometry args={[0.08, 0.08, 4.5, 6]} />
      </mesh>
      <group ref={flag} position-y={TOWER_H + 10.8}>
        <mesh position-x={1.4}>
          <planeGeometry args={[2.8, 1.6]} />
          <meshStandardMaterial color="#ff4d6d" side={DoubleSide} />
        </mesh>
      </group>
      {/* windows */}
      {[6, 11, 15].map((y) => (
        <mesh key={y} position={[0, y, TOWER_W / 2 + 0.01]} material={MAT.navy}>
          <planeGeometry args={[1.6, 2.4]} />
        </mesh>
      ))}
    </group>
  )
}

function TicketBooth({ x }: { x: number }) {
  return (
    <group position={[x, 0, 1]}>
      <mesh position-y={1.4} material={MAT.brand} castShadow receiveShadow>
        <boxGeometry args={[2.4, 2.8, 2.4]} />
      </mesh>
      <mesh position-y={3.2} rotation-y={Math.PI / 4} material={MAT.white} castShadow>
        <coneGeometry args={[2.2, 1.6, 4]} />
      </mesh>
      <mesh position={[0, 1.7, 1.21]} material={MAT.navy}>
        <planeGeometry args={[1.6, 1]} />
      </mesh>
    </group>
  )
}

/** Monumental gate on the south edge of the park, plus the boundary fence. */
export function Entrance() {
  const front = useSignTexture('WILONDJA WORLD', 'Where Code Meets Imagination', {
    width: 2048,
    height: 512,
    background: '#1d2b53',
    accent: '#f6c445',
  })
  const back = useSignTexture('WILONDJA WORLD', 'À bientôt !', { width: 2048, height: 512, background: '#1d2b53', accent: '#f6c445' })
  const bulbs = useRef<InstancedMesh>(null)
  const near = useDistanceGate([0, 0, ENTRANCE_Z], 300)

  useLayoutEffect(() => {
    const m = new Matrix4()
    for (let i = 0; i < BULBS; i++) {
      const t = i / (BULBS - 1)
      bulbs.current!.setMatrixAt(i, m.makeTranslation(-11 + t * 22, 13, 1.8))
      bulbs.current!.setColorAt(i, cOn)
    }
    bulbs.current!.instanceMatrix.needsUpdate = true
  }, [])

  const lastStep = useRef(-1)
  useFrame(({ clock }) => {
    if (!near.current || !bulbs.current) return
    const step = Math.floor(clock.elapsedTime * 8)
    if (step === lastStep.current) return
    lastStep.current = step
    for (let i = 0; i < BULBS; i++) bulbs.current.setColorAt(i, (i + step) % 3 === 0 ? cOff : cOn)
    bulbs.current.instanceColor!.needsUpdate = true
  })

  const gapHalf = (ENTRANCE_GAP_DEG * Math.PI) / 180
  const fenceEnd = Math.sin(gapHalf) * PARK_RADIUS // x where the fence stops

  return (
    <group>
      <group position={[0, 0, ENTRANCE_Z]}>
        <Tower x={-TOWER_X} />
        <Tower x={TOWER_X} />

        {/* arch beam */}
        <mesh position={[0, 14.5, 0]} material={MAT.white} castShadow>
          <boxGeometry args={[TOWER_X * 2, 3, 3]} />
        </mesh>
        <mesh position={[0, 12.9, 0]} material={MAT.brand}>
          <boxGeometry args={[TOWER_X * 2 - TOWER_W, 0.4, 3.2]} />
        </mesh>
        <instancedMesh ref={bulbs} args={[bulbGeo, MAT.bulb, BULBS]} />

        {/* sign: front (outside) and back (inside the park) */}
        <mesh position={[0, 19, 0.81]}>
          <planeGeometry args={[22, 5.5]} />
          <meshStandardMaterial map={front} emissiveMap={front} emissive="#ffffff" emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[0, 19, -0.81]} rotation-y={Math.PI}>
          <planeGeometry args={[22, 5.5]} />
          <meshStandardMaterial map={back} emissiveMap={back} emissive="#ffffff" emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[0, 19, 0]} material={MAT.navy}>
          <boxGeometry args={[22.6, 6, 1.6]} />
        </mesh>
        <mesh position={[0, 16.2, 0]} material={MAT.gold}>
          <boxGeometry args={[TOWER_X * 2 - TOWER_W, 0.5, 2]} />
        </mesh>

        <TicketBooth x={-6.5} />
        <TicketBooth x={6.5} />

        {/* side walls joining the towers to the fence */}
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[s * ((TOWER_X + TOWER_W / 2 + fenceEnd) / 2), 2, 0]}
            material={MAT.stone}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[fenceEnd - TOWER_X - TOWER_W / 2 + 1, 4, 1.2]} />
          </mesh>
        ))}

        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[TOWER_W / 2 + 0.5, TOWER_H / 2, TOWER_W / 2 + 0.5]} position={[-TOWER_X, TOWER_H / 2, 0]} />
          <CuboidCollider args={[TOWER_W / 2 + 0.5, TOWER_H / 2, TOWER_W / 2 + 0.5]} position={[TOWER_X, TOWER_H / 2, 0]} />
          <CuboidCollider args={[1.2, 1.4, 1.2]} position={[-6.5, 1.4, 1]} />
          <CuboidCollider args={[1.2, 1.4, 1.2]} position={[6.5, 1.4, 1]} />
          {[-1, 1].map((s) => (
            <CuboidCollider
              key={s}
              args={[(fenceEnd - TOWER_X - TOWER_W / 2 + 1) / 2, 2, 0.6]}
              position={[s * ((TOWER_X + TOWER_W / 2 + fenceEnd) / 2), 2, 0]}
            />
          ))}
        </RigidBody>
      </group>

      {/* boundary fence with a gap for the gate */}
      <ArcWall
        radius={PARK_RADIUS}
        height={2.2}
        thickness={0.5}
        segments={200}
        material={MAT.darkMetal}
        gapAngle={0}
        gapHalf={gapHalf}
      />
      <ArcWall radius={PARK_RADIUS - 2} height={1.6} thickness={1.6} segments={160} material={MAT.hedge} gapAngle={0} gapHalf={gapHalf + 0.012} solid={false} />
    </group>
  )
}
