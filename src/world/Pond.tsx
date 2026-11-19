import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CylinderCollider, RigidBody } from '@react-three/rapier'
import { CircleGeometry, InstancedMesh, Matrix4, Mesh, Quaternion, Vector3 } from 'three'
import { POND } from '@/config/park'
import { createRng } from '@/utils/random'
import { useDistanceGate } from '@/utils/useDistanceGate'
import { MAT } from './materials'

const padGeo = new CircleGeometry(0.7, 12, 0.3, Math.PI * 2 - 0.6).rotateX(-Math.PI / 2)
const PADS = 14

/** Ornamental pond with a stone rim, lily pads and a gently bobbing duck. */
export function Pond() {
  const pads = useRef<InstancedMesh>(null)
  const duck = useRef<Mesh>(null)
  const near = useDistanceGate([POND.x, 0, POND.z], 120)

  useLayoutEffect(() => {
    const rng = createRng(3)
    const m = new Matrix4()
    const q = new Quaternion()
    const up = new Vector3(0, 1, 0)
    for (let i = 0; i < PADS; i++) {
      const a = rng() * Math.PI * 2
      const d = 2 + rng() * (POND.radius - 3)
      const s = 0.6 + rng() * 0.7
      q.setFromAxisAngle(up, rng() * Math.PI * 2)
      pads.current!.setMatrixAt(i, m.compose(new Vector3(Math.sin(a) * d, 0.42, Math.cos(a) * d), q, new Vector3(s, 1, s)))
    }
    pads.current!.instanceMatrix.needsUpdate = true
    pads.current!.computeBoundingSphere()
  }, [])

  useFrame(({ clock }) => {
    if (!near.current || !duck.current) return
    const t = clock.elapsedTime * 0.15
    duck.current.position.set(Math.sin(t) * 5, 0.55 + Math.sin(clock.elapsedTime * 2) * 0.04, Math.cos(t) * 5)
    duck.current.rotation.y = t + Math.PI / 2
  })

  return (
    <group position={[POND.x, 0, POND.z]}>
      <mesh position-y={0.25} material={MAT.stone} castShadow receiveShadow>
        <cylinderGeometry args={[POND.radius + 0.6, POND.radius + 0.8, 0.5, 48, 1, true]} />
      </mesh>
      <mesh position-y={0.5} rotation-x={-Math.PI / 2} material={MAT.stoneDark} receiveShadow>
        <ringGeometry args={[POND.radius, POND.radius + 0.7, 48]} />
      </mesh>
      <mesh position-y={0.38} rotation-x={-Math.PI / 2} material={MAT.water}>
        <circleGeometry args={[POND.radius, 48]} />
      </mesh>
      <instancedMesh ref={pads} args={[padGeo, MAT.leaves, PADS]} />
      <mesh ref={duck} material={MAT.yellow} castShadow>
        <sphereGeometry args={[0.35, 12, 8]} />
      </mesh>
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[0.6, POND.radius + 0.8]} position={[0, 0.6, 0]} />
      </RigidBody>
    </group>
  )
}
