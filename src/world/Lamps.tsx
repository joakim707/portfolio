import { useLayoutEffect, useMemo, useRef } from 'react'
import { CylinderGeometry, InstancedMesh, Matrix4, SphereGeometry } from 'three'
import { ATTRACTIONS } from '@/data/attractions'
import {
  AVENUE_WIDTH,
  ENTRANCE_Z,
  PLAZA_RADIUS,
  PROMENADE_RADIUS,
  PROMENADE_WIDTH,
  RADIAL_PATH_WIDTH,
} from '@/config/park'
import { MAT } from './materials'

const postGeo = new CylinderGeometry(0.09, 0.14, 4, 6).translate(0, 2, 0)
const headGeo = new SphereGeometry(0.32, 10, 8)

/**
 * Park lamps along the avenue, the promenade and each radial path.
 * The day/night cycle (étape 9) will raise MAT.lampGlow's emissive at night.
 */
export function Lamps() {
  const positions = useMemo(() => {
    const out: [number, number][] = []
    for (let z = PLAZA_RADIUS + 6; z < ENTRANCE_Z - 8; z += 14) {
      out.push([-(AVENUE_WIDTH / 2 + 1), z], [AVENUE_WIDTH / 2 + 1, z])
    }
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2 + 0.04
      const r = PROMENADE_RADIUS + PROMENADE_WIDTH / 2 + 0.9
      out.push([Math.sin(a) * r, Math.cos(a) * r])
    }
    for (const at of ATTRACTIONS) {
      const a = (at.angle * Math.PI) / 180
      const dirX = Math.sin(a)
      const dirZ = -Math.cos(a)
      const side = RADIAL_PATH_WIDTH / 2 + 0.8
      for (let d = PLAZA_RADIUS + 10; d < at.distance - at.radius - 2; d += 16) {
        if (Math.abs(d - PROMENADE_RADIUS) < PROMENADE_WIDTH) continue
        out.push([dirX * d - dirZ * side, dirZ * d + dirX * side], [dirX * d + dirZ * side, dirZ * d - dirX * side])
      }
    }
    return out
  }, [])

  const posts = useRef<InstancedMesh>(null)
  const heads = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = new Matrix4()
    positions.forEach(([x, z], i) => {
      posts.current!.setMatrixAt(i, m.makeTranslation(x, 0, z))
      heads.current!.setMatrixAt(i, m.makeTranslation(x, 4.15, z))
    })
    for (const r of [posts, heads]) {
      r.current!.instanceMatrix.needsUpdate = true
      r.current!.computeBoundingSphere()
    }
  }, [positions])

  return (
    <group>
      <instancedMesh ref={posts} args={[postGeo, MAT.darkMetal, positions.length]} castShadow />
      <instancedMesh ref={heads} args={[headGeo, MAT.lampGlow, positions.length]} />
    </group>
  )
}
