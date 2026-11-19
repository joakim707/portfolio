import { useLayoutEffect, useMemo, useRef } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { BoxGeometry, InstancedMesh, Material, Matrix4, Quaternion, Vector3 } from 'three'

interface ArcWallProps {
  radius: number
  height: number
  thickness: number
  segments: number
  material: Material
  /** Gap centre in radians, measured in the local XZ plane from +Z (0 = facing +Z). */
  gapAngle?: number
  /** Gap half-width in radians. */
  gapHalf?: number
  /** Physical wall (Rapier colliders). */
  solid?: boolean
  castShadow?: boolean
}

const geo = new BoxGeometry(1, 1, 1)

/**
 * A ring of boxes (hedge, fence, wall) with an optional gap, rendered as one
 * InstancedMesh with matching static colliders.
 */
export function ArcWall({
  radius,
  height,
  thickness,
  segments,
  material,
  gapAngle = 0,
  gapHalf = 0,
  solid = true,
  castShadow = false,
}: ArcWallProps) {
  const ref = useRef<InstancedMesh>(null)

  const pieces = useMemo(() => {
    const out: { pos: [number, number, number]; rotY: number; len: number }[] = []
    const step = (Math.PI * 2) / segments
    const len = 2 * radius * Math.sin(step / 2) + 0.05
    for (let i = 0; i < segments; i++) {
      const a = (i + 0.5) * step
      const d = Math.abs(Math.atan2(Math.sin(a - gapAngle), Math.cos(a - gapAngle)))
      if (gapHalf > 0 && d < gapHalf + step / 2) continue
      out.push({ pos: [Math.sin(a) * radius, height / 2, Math.cos(a) * radius], rotY: a, len })
    }
    return out
  }, [radius, height, segments, gapAngle, gapHalf])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new Matrix4()
    const q = new Quaternion()
    const up = new Vector3(0, 1, 0)
    pieces.forEach((p, i) => {
      q.setFromAxisAngle(up, p.rotY)
      m.compose(new Vector3(...p.pos), q, new Vector3(p.len, height, thickness))
      mesh.setMatrixAt(i, m)
    })
    mesh.count = pieces.length
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [pieces, height, thickness])

  return (
    <>
      <instancedMesh
        ref={ref}
        args={[geo, material, Math.max(1, pieces.length)]}
        castShadow={castShadow}
        receiveShadow
      />
      {solid && (
        <RigidBody type="fixed" colliders={false}>
          {pieces.map((p, i) => (
            <CuboidCollider
              key={i}
              args={[p.len / 2, height / 2, thickness / 2]}
              position={p.pos}
              rotation={[0, p.rotY, 0]}
            />
          ))}
        </RigidBody>
      )}
    </>
  )
}
