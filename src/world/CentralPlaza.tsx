import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import { Group, InstancedMesh, Matrix4, Mesh, Quaternion, Vector3 } from 'three'
import { PLAZA_RADIUS } from '@/config/park'
import { useDistanceGate } from '@/utils/useDistanceGate'
import { useSignTexture } from '@/utils/textTexture'
import { hologramMaterial, MAT } from './materials'
import { useKenney } from './assets'

const BENCHES = 12
const KIOSK_ANGLES = [45, 135, 225, 315]

function Fountain() {
  const globe = useRef<Group>(null)
  const jets = useRef<Mesh[]>([])
  const near = useDistanceGate([0, 0, 0], 220)
  const holo = useMemo(() => hologramMaterial('#7dd3fc', 0.22), [])
  useFrame(({ clock }, dt) => {
    if (!near.current) return
    const t = clock.elapsedTime
    if (globe.current) {
      globe.current.rotation.y += dt * 0.4
      globe.current.position.y = 11 + Math.sin(t * 1.2) * 0.4
    }
    jets.current.forEach((j, i) => j && (j.scale.y = 0.75 + 0.25 * Math.sin(t * 3 + i * 1.3)))
  })
  return (
    <group>
      {/* basin */}
      <mesh position-y={0.5} material={MAT.stone} castShadow receiveShadow>
        <cylinderGeometry args={[9, 9.4, 1, 48, 1, true]} />
      </mesh>
      <mesh position-y={1.02} rotation-x={-Math.PI / 2} material={MAT.stoneDark}>
        <ringGeometry args={[8.4, 9.1, 48]} />
      </mesh>
      <mesh position-y={0.7} rotation-x={-Math.PI / 2} material={MAT.water}>
        <circleGeometry args={[8.6, 48]} />
      </mesh>
      {/* column */}
      <mesh position-y={3} material={MAT.white} castShadow>
        <cylinderGeometry args={[1.1, 1.6, 5, 16]} />
      </mesh>
      <mesh position-y={5.7} material={MAT.gold} castShadow>
        <cylinderGeometry args={[2.2, 1.2, 0.6, 24]} />
      </mesh>
      {/* jets */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <mesh
            key={i}
            ref={(m) => {
              if (m) jets.current[i] = m
            }}
            position={[Math.sin(a) * 5.5, 0.7, Math.cos(a) * 5.5]}
            material={MAT.water}
          >
            <coneGeometry args={[0.35, 4, 8, 1, true]} />
          </mesh>
        )
      })}
      {/* holographic globe: the park's centrepiece */}
      <group ref={globe} position-y={11}>
        <mesh material={holo}>
          <icosahedronGeometry args={[3.4, 2]} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[3.45, 2]} />
          <meshBasicMaterial color="#bae6fd" wireframe transparent opacity={0.6} />
        </mesh>
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[4.6, 0.12, 8, 64]} />
          <meshStandardMaterial color="#f6c445" emissive="#f6c445" emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  )
}

const KIOSK_SCALE = 2.6

/** Snack / drinks kiosks around the plaza (Kenney stalls), serving towards the fountain. */
function Kiosk({ angle, drinks }: { angle: number; drinks: boolean }) {
  const model = useKenney(drinks ? 'stall-drinks' : 'stall-food')
  const a = (angle * Math.PI) / 180
  const r = PLAZA_RADIUS - 5
  // group +Z points away from the fountain; the stall's front (-Z) therefore faces it
  return (
    <group position={[Math.sin(a) * r, 0, -Math.cos(a) * r]} rotation-y={-a + Math.PI}>
      <mesh geometry={model.geometry} material={model.material} scale={KIOSK_SCALE} castShadow receiveShadow />
    </group>
  )
}

/** Paved central plaza: fountain + holographic globe, benches, food kiosks, welcome sign. */
export function CentralPlaza() {
  const benches = useRef<InstancedMesh>(null)
  const bench = useKenney('bench')
  const welcome = useSignTexture('PLACE CENTRALE', '8 attractions · 8 projets', { background: '#ffffff', color: '#1d2b53' })

  useLayoutEffect(() => {
    const m = new Matrix4()
    const q = new Quaternion()
    const up = new Vector3(0, 1, 0)
    const s = new Vector3(2.6, 2.6, 2.6)
    for (let i = 0; i < BENCHES; i++) {
      const a = ((i + 0.5) / BENCHES) * Math.PI * 2
      q.setFromAxisAngle(up, a)
      benches.current!.setMatrixAt(i, m.compose(new Vector3(Math.sin(a) * 12, 0, Math.cos(a) * 12), q, s))
    }
    benches.current!.instanceMatrix.needsUpdate = true
    benches.current!.computeBoundingSphere()
  }, [])

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={0.03} material={MAT.plaza} receiveShadow>
        <circleGeometry args={[PLAZA_RADIUS, 64]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.035} material={MAT.pathEdge} receiveShadow>
        <ringGeometry args={[PLAZA_RADIUS - 1.2, PLAZA_RADIUS, 64]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.035} material={MAT.pathEdge} receiveShadow>
        <ringGeometry args={[13.5, 14.2, 64]} />
      </mesh>

      <Fountain />
      <instancedMesh ref={benches} args={[bench.geometry, bench.material, BENCHES]} castShadow receiveShadow />
      {KIOSK_ANGLES.map((a, i) => (
        <Kiosk key={a} angle={a} drinks={i % 2 === 1} />
      ))}

      {/* welcome panel facing the avenue */}
      <group position={[7, 0, PLAZA_RADIUS - 2]}>
        <mesh position-y={1.6} material={MAT.darkMetal}>
          <boxGeometry args={[0.2, 3.2, 0.2]} />
        </mesh>
        <mesh position={[0, 3.6, 0.05]}>
          <planeGeometry args={[5, 1.25]} />
          <meshStandardMaterial map={welcome} />
        </mesh>
      </group>

      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[0.6, 9.4]} position={[0, 0.6, 0]} />
        {KIOSK_ANGLES.map((angle) => {
          const a = (angle * Math.PI) / 180
          const r = PLAZA_RADIUS - 5
          return (
            <CuboidCollider
              key={angle}
              args={[1.4, 1.5, 1.4]}
              position={[Math.sin(a) * r, 1.5, -Math.cos(a) * r]}
              rotation={[0, -a + Math.PI, 0]}
            />
          )
        })}
      </RigidBody>
    </group>
  )
}
