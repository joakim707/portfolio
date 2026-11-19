import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  ConeGeometry,
  Group,
  InstancedMesh,
  Material,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
} from 'three'
import type { AttractionDef } from '@/data/attractions'
import { getProject } from '@/data/projects'
import { MAT } from '@/world/materials'
import { useSignTexture } from '@/utils/textTexture'
import { useDistanceGate } from '@/utils/useDistanceGate'

const unitBox = new BoxGeometry(1, 1, 1)
const coneGeo = new ConeGeometry(0.35, 0.9, 10).translate(0, 0.45, 0)

let stripeMat: MeshStandardMaterial | null = null
function getStripeMaterial() {
  if (stripeMat) return stripeMat
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 32
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, 128, 32)
  ctx.fillStyle = '#e11d48'
  for (let x = -32; x < 160; x += 32) {
    ctx.beginPath()
    ctx.moveTo(x, 32)
    ctx.lineTo(x + 16, 0)
    ctx.lineTo(x + 32, 0)
    ctx.lineTo(x + 16, 32)
    ctx.fill()
  }
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.wrapS = RepeatWrapping
  tex.repeat.set(4, 1)
  stripeMat = new MeshStandardMaterial({ map: tex, roughness: 0.7 })
  return stripeMat
}

/** Pipe matrices for a scaffold block (verticals, ledgers and diagonal braces). */
function scaffoldPipes(origin: Vector3, w: number, h: number, d: number, bay = 3, lift = 3) {
  const out: Matrix4[] = []
  const q = new Quaternion()
  const nx = Math.max(1, Math.round(w / bay))
  const nz = Math.max(1, Math.round(d / bay))
  const ny = Math.max(1, Math.round(h / lift))
  const pipe = 0.12
  for (let ix = 0; ix <= nx; ix++)
    for (let iz = 0; iz <= nz; iz++) {
      if (ix > 0 && ix < nx && iz > 0 && iz < nz) continue
      const x = origin.x - w / 2 + (ix * w) / nx
      const z = origin.z - d / 2 + (iz * d) / nz
      out.push(new Matrix4().compose(new Vector3(x, h / 2, z), q, new Vector3(pipe, h, pipe)))
    }
  for (let iy = 1; iy <= ny; iy++) {
    const y = (iy * h) / ny
    for (const z of [origin.z - d / 2, origin.z + d / 2])
      out.push(new Matrix4().compose(new Vector3(origin.x, y, z), q, new Vector3(w, pipe, pipe)))
    for (const x of [origin.x - w / 2, origin.x + w / 2])
      out.push(new Matrix4().compose(new Vector3(x, y, origin.z), q, new Vector3(pipe, pipe, d)))
    // planks on alternate lifts
    if (iy % 2 === 0) out.push(new Matrix4().compose(new Vector3(origin.x, y + 0.05, origin.z + d / 2 - 0.6), q, new Vector3(w, 0.08, 1.2)))
  }
  // diagonal braces on the front face
  const diag = Math.hypot(w / nx, h / ny)
  const ang = Math.atan2(h / ny, w / nx)
  const bq = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), ang)
  for (let ix = 0; ix < nx; ix++)
    for (let iy = 0; iy < ny; iy += 2) {
      const x = origin.x - w / 2 + ((ix + 0.5) * w) / nx
      const y = ((iy + 0.5) * h) / ny
      out.push(new Matrix4().compose(new Vector3(x, y, origin.z + d / 2), bq, new Vector3(diag, pipe, pipe)))
    }
  return out
}

function Instances({ matrices, geometry = unitBox, material }: { matrices: Matrix4[]; geometry?: BufferGeometry; material: Material }) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    matrices.forEach((m, i) => ref.current!.setMatrixAt(i, m))
    ref.current!.instanceMatrix.needsUpdate = true
    ref.current!.computeBoundingSphere()
  }, [matrices])
  return <instancedMesh ref={ref} args={[geometry, material, matrices.length]} castShadow receiveShadow />
}

function TowerCrane({ position, height, jib, worldPos }: { position: [number, number, number]; height: number; jib: number; worldPos: [number, number, number] }) {
  const top = useRef<Group>(null)
  const near = useDistanceGate(worldPos, 320)
  useFrame(({ clock }) => {
    if (near.current && top.current) top.current.rotation.y = Math.sin(clock.elapsedTime * 0.12) * 1.4
  })
  return (
    <group position={position}>
      <mesh position-y={0.5} material={MAT.concrete} receiveShadow>
        <boxGeometry args={[4, 1, 4]} />
      </mesh>
      <mesh position-y={height / 2} material={MAT.yellow} castShadow>
        <boxGeometry args={[1.6, height, 1.6]} />
      </mesh>
      <mesh position-y={height / 2}>
        <boxGeometry args={[1.65, height, 1.65, 1, Math.round(height / 2), 1]} />
        <meshBasicMaterial color="#7a5c00" wireframe />
      </mesh>
      <group ref={top} position-y={height}>
        <mesh position-y={1.2} material={MAT.yellow} castShadow>
          <boxGeometry args={[2.2, 2.4, 2.2]} />
        </mesh>
        <mesh position={[jib / 2 - 4, 2.8, 0]} material={MAT.yellow} castShadow>
          <boxGeometry args={[jib, 1, 1]} />
        </mesh>
        <mesh position={[-6, 2.2, 0]} material={MAT.concrete} castShadow>
          <boxGeometry args={[3, 2, 2]} />
        </mesh>
        <mesh position={[jib * 0.7, -height * 0.25 + 2.3, 0]} material={MAT.darkMetal}>
          <cylinderGeometry args={[0.04, 0.04, height * 0.5, 4]} />
        </mesh>
        <mesh position={[jib * 0.7, -height * 0.5 + 2.3, 0]} material={MAT.orange}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
        </mesh>
      </group>
    </group>
  )
}

/** Partial structure specific to each future ride. */
function PartialStructure({ def }: { def: AttractionDef }) {
  const r = def.radius
  const trackCurve = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(-r * 0.7, 6, r * 0.3),
        new Vector3(-r * 0.5, 18, -r * 0.2),
        new Vector3(-r * 0.1, def.height * 0.8, -r * 0.55),
        new Vector3(r * 0.25, def.height * 0.6, -r * 0.4),
      ]),
    [r, def.height],
  )

  if (def.kind === 'water-ride') {
    // canal basin, half-built lift ramp and the future big drop
    return (
      <group>
        <group position={[-r * 0.25, 0, r * 0.15]}>
          <mesh position-y={0.6} material={MAT.concrete} receiveShadow>
            <boxGeometry args={[r * 0.9, 1.2, 0.8]} />
          </mesh>
          <mesh position={[0, 0.6, 6]} material={MAT.concrete} receiveShadow>
            <boxGeometry args={[r * 0.9, 1.2, 0.8]} />
          </mesh>
          <mesh position={[0, 0.45, 3]} rotation-x={-Math.PI / 2} material={MAT.water}>
            <planeGeometry args={[r * 0.9, 5.2]} />
          </mesh>
        </group>
        {/* lift ramp skeleton */}
        <group position={[r * 0.25, 0, -r * 0.2]} rotation-y={0.4}>
          <mesh position={[0, def.height * 0.45, 0]} rotation-z={0.62} material={MAT.metal} castShadow>
            <boxGeometry args={[def.height * 1.1, 0.8, 4]} />
          </mesh>
          {[0.15, 0.35, 0.55, 0.75].map((f, i) => {
            const x = -def.height * 0.45 + f * def.height * 0.9
            const h = Math.max(1, def.height * 0.45 + Math.tan(0.62) * x)
            return (
              <mesh key={i} position={[x, h / 2, 0]} material={MAT.darkMetal} castShadow>
                <boxGeometry args={[0.6, h, 0.6]} />
              </mesh>
            )
          })}
        </group>
      </group>
    )
  }

  // flying coaster: columns + a first section of track, unfinished
  const supports = [0.05, 0.25, 0.45, 0.65, 0.85]
  return (
    <group>
      {supports.map((t) => {
        const p = trackCurve.getPointAt(t)
        return (
          <mesh key={t} position={[p.x, p.y / 2, p.z]} material={MAT.darkMetal} castShadow>
            <cylinderGeometry args={[0.45, 0.6, p.y, 8]} />
          </mesh>
        )
      })}
      <mesh material={MAT.metal} castShadow>
        <tubeGeometry args={[trackCurve, 80, 0.45, 8, false]} />
      </mesh>
      {/* station platform */}
      <mesh position={[-r * 0.55, 1.5, r * 0.45]} material={MAT.concrete} castShadow receiveShadow>
        <boxGeometry args={[14, 3, 6]} />
      </mesh>
    </group>
  )
}

/**
 * Visible but closed attraction. The real ride module will replace this whole
 * component; nothing here is shared with the rideable version.
 */
export function ConstructionSite({ def, worldPos }: { def: AttractionDef; worldPos: [number, number, number] }) {
  const r = def.radius
  const project = getProject(def.project)
  const sign = useSignTexture('EN CONSTRUCTION', `Projet ${project?.title ?? ''} · ouverture prochaine`, {
    background: '#facc15',
    color: '#111827',
    accent: '#111827',
  })

  const scaffold = useMemo(
    () => [...scaffoldPipes(new Vector3(r * 0.3, 0, r * 0.15), 12, 15, 6), ...scaffoldPipes(new Vector3(-r * 0.35, 0, -r * 0.35), 9, 21, 9)],
    [r],
  )

  const barriers = useMemo(() => {
    const q = new Quaternion()
    const out: Matrix4[] = []
    for (let x = -6; x <= 6; x += 2.4) out.push(new Matrix4().compose(new Vector3(x, 0.55, r - 1), q, new Vector3(2.3, 1.1, 0.25)))
    return out
  }, [r])

  const cones = useMemo(() => {
    const out: Matrix4[] = []
    const q = new Quaternion()
    const s = new Vector3(1, 1, 1)
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2
      out.push(new Matrix4().compose(new Vector3(Math.sin(a) * r * 0.82, 0, Math.cos(a) * r * 0.82), q, s))
    }
    return out
  }, [r])

  return (
    <group>
      {/* dirt ground */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.06} receiveShadow>
        <circleGeometry args={[r - 1.5, 48]} />
        <meshStandardMaterial color="#9c7a52" roughness={1} />
      </mesh>

      <PartialStructure def={def} />
      <Instances matrices={scaffold} material={MAT.metal} />
      <Instances matrices={barriers} material={getStripeMaterial()} />
      <Instances matrices={cones} geometry={coneGeo} material={MAT.orange} />
      <TowerCrane position={[r * 0.55, 0, -r * 0.45]} height={def.height + 10} jib={r * 0.9} worldPos={worldPos} />

      {/* closure sign at the entrance */}
      <group position={[0, 0, r + 0.4]}>
        {[-3, 3].map((x) => (
          <mesh key={x} position={[x, 1.6, 0]} material={MAT.darkMetal}>
            <boxGeometry args={[0.2, 3.2, 0.2]} />
          </mesh>
        ))}
        <mesh position={[0, 3.4, 0.12]}>
          <planeGeometry args={[7, 1.75]} />
          <meshStandardMaterial map={sign} />
        </mesh>
      </group>

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[7.5, 1.5, 0.4]} position={[0, 1.5, r - 1]} />
        <CuboidCollider args={[6, 7.5, 3]} position={[r * 0.3, 7.5, r * 0.15]} />
        <CuboidCollider args={[4.5, 10.5, 4.5]} position={[-r * 0.35, 10.5, -r * 0.35]} />
        <CuboidCollider args={[2, def.height / 2 + 5, 2]} position={[r * 0.55, def.height / 2 + 5, -r * 0.45]} />
      </RigidBody>
    </group>
  )
}
