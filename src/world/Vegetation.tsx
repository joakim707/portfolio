import { useLayoutEffect, useMemo, useRef } from 'react'
import { CylinderCollider, RigidBody } from '@react-three/rapier'
import { ConeGeometry, CylinderGeometry, IcosahedronGeometry, InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three'
import { ENTRANCE_Z, PARK_RADIUS } from '@/config/park'
import { QUALITY_PRESETS, useGameStore } from '@/core/store/useGameStore'
import { createRng } from '@/utils/random'
import { insidePark, isFreeGround } from './layout'
import { MAT } from './materials'

const trunkGeo = new CylinderGeometry(0.25, 0.4, 1, 6).translate(0, 0.5, 0)
const pineGeo = new ConeGeometry(1, 1, 7).translate(0, 0.5, 0)
const roundGeo = new IcosahedronGeometry(1, 1)

interface Tree {
  x: number
  z: number
  h: number
  w: number
  pine: boolean
  inside: boolean
}

function generateTrees(count: number): Tree[] {
  const rng = createRng(42)
  const trees: Tree[] = []
  const insideTarget = Math.round(count * 0.4)
  let guard = 0
  // in-park trees: in the gaps between zones and paths
  while (trees.length < insideTarget && guard++ < 20000) {
    const a = rng() * Math.PI * 2
    const d = Math.sqrt(rng()) * (PARK_RADIUS - 6)
    const x = Math.sin(a) * d
    const z = Math.cos(a) * d
    if (!isFreeGround(x, z, 3)) continue
    trees.push({ x, z, h: 4 + rng() * 4, w: 1.6 + rng() * 1.4, pine: rng() < 0.45, inside: true })
  }
  // forest belt outside the fence, leaving the forecourt open
  while (trees.length < count && guard++ < 40000) {
    const a = rng() * Math.PI * 2
    const d = PARK_RADIUS + 8 + rng() * 170
    const x = Math.sin(a) * d
    const z = Math.cos(a) * d
    if (z > ENTRANCE_Z - 10 && Math.abs(x) < 40) continue
    trees.push({ x, z, h: 6 + rng() * 7, w: 2 + rng() * 2, pine: rng() < 0.6, inside: false })
  }
  return trees
}

/** Instanced trees: one draw call per part. Colliders only for trees inside the park. */
export function Vegetation() {
  const quality = useGameStore((s) => s.quality)
  const count = QUALITY_PRESETS[quality].trees
  const trees = useMemo(() => generateTrees(count), [count])
  const pines = useMemo(() => trees.filter((t) => t.pine), [trees])
  const rounds = useMemo(() => trees.filter((t) => !t.pine), [trees])

  const trunkRef = useRef<InstancedMesh>(null)
  const pineRef = useRef<InstancedMesh>(null)
  const roundRef = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const m = new Matrix4()
    const q = new Quaternion()
    const p = new Vector3()
    const s = new Vector3()
    trees.forEach((t, i) => {
      trunkRef.current!.setMatrixAt(i, m.compose(p.set(t.x, 0, t.z), q, s.set(1, t.h * 0.45, 1)))
    })
    pines.forEach((t, i) => {
      pineRef.current!.setMatrixAt(i, m.compose(p.set(t.x, t.h * 0.3, t.z), q, s.set(t.w, t.h * 0.85, t.w)))
    })
    rounds.forEach((t, i) => {
      roundRef.current!.setMatrixAt(i, m.compose(p.set(t.x, t.h * 0.62, t.z), q, s.set(t.w * 1.15, t.h * 0.42, t.w * 1.15)))
    })
    for (const r of [trunkRef, pineRef, roundRef]) {
      r.current!.instanceMatrix.needsUpdate = true
      r.current!.computeBoundingSphere()
    }
  }, [trees, pines, rounds])

  const inside = trees.filter((t) => t.inside && insidePark(t.x, t.z))

  return (
    <group>
      <instancedMesh key={`t${count}`} ref={trunkRef} args={[trunkGeo, MAT.trunk, trees.length]} castShadow />
      <instancedMesh key={`p${count}`} ref={pineRef} args={[pineGeo, MAT.leavesDark, Math.max(1, pines.length)]} castShadow />
      <instancedMesh key={`r${count}`} ref={roundRef} args={[roundGeo, MAT.leaves, Math.max(1, rounds.length)]} castShadow />
      <RigidBody key={`c${count}`} type="fixed" colliders={false}>
        {inside.map((t, i) => (
          <CylinderCollider key={i} args={[2, 0.45]} position={[t.x, 2, t.z]} />
        ))}
      </RigidBody>
    </group>
  )
}
