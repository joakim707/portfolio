import { useLayoutEffect, useMemo, useRef } from 'react'
import { CylinderCollider, RigidBody } from '@react-three/rapier'
import { InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three'
import { ENTRANCE_Z, PARK_RADIUS } from '@/config/park'
import { QUALITY_PRESETS, useGameStore } from '@/core/store/useGameStore'
import { createRng } from '@/utils/random'
import { insidePark, isFreeGround } from './layout'
import { useKenney } from './assets'


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
/** Kenney trees, uniformly scaled to each tree's height, with a random yaw. */
export function Vegetation() {
  const quality = useGameStore((s) => s.quality)
  const count = QUALITY_PRESETS[quality].trees
  const trees = useMemo(() => generateTrees(count), [count])
  // "pine" trees use the tall model, the others the round one
  const tall = useMemo(() => trees.filter((t) => t.pine), [trees])
  const round = useMemo(() => trees.filter((t) => !t.pine), [trees])
  const tallModel = useKenney('tree-large')
  const roundModel = useKenney('tree')

  const tallRef = useRef<InstancedMesh>(null)
  const roundRef = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const m = new Matrix4()
    const q = new Quaternion()
    const up = new Vector3(0, 1, 0)
    const p = new Vector3()
    const s = new Vector3()
    const fill = (list: typeof trees, model: typeof tallModel, ref: typeof tallRef, heightFactor: number) => {
      list.forEach((t, i) => {
        const k = (t.h * heightFactor) / model.size.y
        q.setFromAxisAngle(up, ((t.x * 12.9898 + t.z * 78.233) % 6.283) + 6.283)
        ref.current!.setMatrixAt(i, m.compose(p.set(t.x, 0, t.z), q, s.set(k, k, k)))
      })
      ref.current!.instanceMatrix.needsUpdate = true
      ref.current!.computeBoundingSphere()
    }
    fill(tall, tallModel, tallRef, 1.15)
    fill(round, roundModel, roundRef, 0.95)
  }, [tall, round, tallModel, roundModel])

  const inside = trees.filter((t) => t.inside && insidePark(t.x, t.z))

  return (
    <group>
      <instancedMesh key={`t${count}`} ref={tallRef} args={[tallModel.geometry, tallModel.material, Math.max(1, tall.length)]} castShadow receiveShadow />
      <instancedMesh key={`r${count}`} ref={roundRef} args={[roundModel.geometry, roundModel.material, Math.max(1, round.length)]} castShadow receiveShadow />
      <RigidBody key={`c${count}`} type="fixed" colliders={false}>
        {inside.map((t, i) => (
          <CylinderCollider key={i} args={[2, 0.45]} position={[t.x, 2, t.z]} />
        ))}
      </RigidBody>
    </group>
  )
}
