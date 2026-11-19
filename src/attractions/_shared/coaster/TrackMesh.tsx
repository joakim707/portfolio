import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { CylinderCollider, RigidBody } from '@react-three/rapier'
import {
  BoxGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  TubeGeometry,
  Vector3,
} from 'three'
import type { Track } from './track'

interface TrackMeshProps {
  track: Track
  railColor?: string
  spineColor?: string
  supportColor?: string
  /** Distance between supports (m). */
  supportEvery?: number
  /** Static colliders on the supports (only needed where visitors can walk). */
  colliders?: boolean
}

const tieGeo = new BoxGeometry(1.15, 0.08, 0.16)
const supportGeo = new CylinderGeometry(0.22, 0.3, 1, 8).translate(0, 0.5, 0)

/** Rails, spine, ties and supports of a coaster track: 5 draw calls whatever its length. */
export function TrackMesh({ track, railColor = '#c7ccd3', spineColor = '#ff4d6d', supportColor = '#2d3138', supportEvery = 6, colliders = false }: TrackMeshProps) {
  const mats = useMemo(
    () => ({
      rail: new MeshStandardMaterial({ color: railColor, metalness: 0.8, roughness: 0.3 }),
      spine: new MeshStandardMaterial({ color: spineColor, metalness: 0.3, roughness: 0.5 }),
      tie: new MeshStandardMaterial({ color: '#3a3f47', metalness: 0.5, roughness: 0.5 }),
      support: new MeshStandardMaterial({ color: supportColor, metalness: 0.4, roughness: 0.6 }),
    }),
    [railColor, spineColor, supportColor],
  )

  const geo = useMemo(() => {
    const step = 2
    const L: Vector3[] = []
    const R: Vector3[] = []
    const S: Vector3[] = []
    for (let i = 0; i < track.segments; i += step) {
      const p = track.points[i]
      L.push(p.clone().addScaledVector(track.binormals[i], -0.45))
      R.push(p.clone().addScaledVector(track.binormals[i], 0.45))
      S.push(p.clone().addScaledVector(track.normals[i], -0.32))
    }
    const segs = Math.round(track.length * 1.5)
    const tube = (pts: Vector3[], r: number, radial: number) => new TubeGeometry(new CatmullRomCurve3(pts, true, 'centripetal'), segs, r, radial, true)
    return { left: tube(L, 0.065, 6), right: tube(R, 0.065, 6), spine: tube(S, 0.2, 8) }
  }, [track])
  useEffect(
    () => () => {
      geo.left.dispose()
      geo.right.dispose()
      geo.spine.dispose()
      Object.values(mats).forEach((m) => m.dispose())
    },
    [geo, mats],
  )

  // supports: vertical columns under upright, elevated, non-inverting sections
  const supports = useMemo(() => {
    const out: { x: number; z: number; h: number }[] = []
    const every = Math.max(1, Math.round((supportEvery / track.length) * track.segments))
    for (let i = 0; i < track.segments; i += every) {
      const lab = track.labels[i]
      const n = track.normals[i]
      const p = track.points[i]
      if (lab === 'loop' || lab === 'twist' || lab === 'tunnel' || n.y < 0.55 || p.y < 1.6) continue
      out.push({ x: p.x, z: p.z, h: p.y - 0.3 - 0.2 })
    }
    return out
  }, [track, supportEvery])

  const tieCount = Math.floor(track.segments / 2)
  const ties = useRef<InstancedMesh>(null)
  const cols = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = new Matrix4()
    for (let k = 0; k < tieCount; k++) {
      const i = k * 2
      m.makeBasis(track.binormals[i], track.normals[i], track.tangents[i].clone().negate()).setPosition(
        track.points[i].clone().addScaledVector(track.normals[i], -0.07),
      )
      ties.current!.setMatrixAt(k, m)
    }
    ties.current!.instanceMatrix.needsUpdate = true
    ties.current!.computeBoundingSphere()
    const q = new Quaternion()
    supports.forEach((s, i) => cols.current!.setMatrixAt(i, m.compose(new Vector3(s.x, 0, s.z), q, new Vector3(1, s.h, 1))))
    cols.current!.instanceMatrix.needsUpdate = true
    cols.current!.computeBoundingSphere()
  }, [track, tieCount, supports])

  return (
    <group>
      <mesh geometry={geo.left} material={mats.rail} castShadow />
      <mesh geometry={geo.right} material={mats.rail} castShadow />
      <mesh geometry={geo.spine} material={mats.spine} castShadow />
      <instancedMesh ref={ties} args={[tieGeo, mats.tie, tieCount]} castShadow />
      <instancedMesh ref={cols} args={[supportGeo, mats.support, Math.max(1, supports.length)]} castShadow receiveShadow />
      {colliders && (
        <RigidBody type="fixed" colliders={false}>
          {supports.map((s, i) => (
            <CylinderCollider key={i} args={[s.h / 2, 0.35]} position={[s.x, s.h / 2, s.z]} />
          ))}
        </RigidBody>
      )}
    </group>
  )
}
