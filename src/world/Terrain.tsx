import { useLayoutEffect, useMemo, useRef } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { InstancedMesh, Matrix4, Quaternion, SphereGeometry, Vector3 } from 'three'
import { GROUND_SIZE, PARK_RADIUS } from '@/config/park'
import { createRng } from '@/utils/random'
import { MAT } from './materials'

const hillGeo = new SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2)

/** Flat playable ground (physics) + decorative rolling hills outside the park. */
export function Terrain() {
  const hills = useRef<InstancedMesh>(null)

  const hillData = useMemo(() => {
    const rng = createRng(7)
    const out: { p: Vector3; s: Vector3 }[] = []
    for (let i = 0; i < 46; i++) {
      const a = rng() * Math.PI * 2
      // keep the view through the entrance (south) open
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.35) continue
      const d = PARK_RADIUS + 70 + rng() * 160
      const r = 35 + rng() * 55
      out.push({
        p: new Vector3(Math.sin(a) * d, -2, Math.cos(a) * d),
        s: new Vector3(r, 10 + rng() * 26, r * (0.7 + rng() * 0.6)),
      })
    }
    return out
  }, [])

  useLayoutEffect(() => {
    const m = new Matrix4()
    const q = new Quaternion()
    hillData.forEach((h, i) => hills.current!.setMatrixAt(i, m.compose(h.p, q, h.s)))
    hills.current!.instanceMatrix.needsUpdate = true
    hills.current!.computeBoundingSphere()
  }, [hillData])

  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[GROUND_SIZE / 2, 0.5, GROUND_SIZE / 2]} position={[0, -0.5, 0]} />
      </RigidBody>
      {/* darker meadow everywhere, park lawn drawn on top */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow material={MAT.grassDark}>
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.01} receiveShadow material={MAT.grass}>
        <circleGeometry args={[PARK_RADIUS + 4, 128]} />
      </mesh>
      <instancedMesh ref={hills} args={[hillGeo, MAT.grassDark, hillData.length]} receiveShadow />
    </group>
  )
}
