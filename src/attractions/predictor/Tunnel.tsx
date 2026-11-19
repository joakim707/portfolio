import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BackSide,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  CatmullRomCurve3,
  Color,
  FrontSide,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  MeshStandardMaterial,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import { labelRanges, type Track } from '@/attractions/_shared/coaster/track'
import type { CoasterTrain } from '@/attractions/_shared/coaster/CoasterTrain'

const RADIUS = 2.7
const RING_EVERY = 1.4
const ringGeo = new TorusGeometry(RADIUS - 0.25, 0.08, 6, 32)
const COLD = new Color('#22d3ee')
const HOT = new Color('#f0abfc')

/**
 * Light tunnel wrapped around the 'tunnel' section of the track: dark inner
 * shell, grassy berm outside, and neon rings whose wave of light races ahead
 * of the train (synchronised with its arc-length position).
 */
export function Tunnel({ track, train }: { track: Track; train: () => CoasterTrain | null }) {
  const { shell, rings, floor } = useMemo(() => {
    const [s0, s1] = labelRanges(track, 'tunnel')[0] ?? [0, 0]
    const i0 = Math.floor((s0 / track.length) * track.segments)
    const i1 = Math.ceil((s1 / track.length) * track.segments)
    const centre: Vector3[] = []
    for (let i = Math.max(0, i0 - 6); i <= Math.min(track.segments, i1 + 6); i += 2) {
      centre.push(track.points[i].clone().addScaledVector(track.normals[i], 1.0))
    }
    const shell = new TubeGeometry(new CatmullRomCurve3(centre), Math.max(8, centre.length), RADIUS, 24, false)
    // dark floor ribbon, so the park ground does not show inside the tunnel
    const verts: number[] = []
    const idx: number[] = []
    const side = new Vector3()
    for (let i = Math.max(0, i0 - 6), k = 0; i <= Math.min(track.segments, i1 + 6); i += 2, k++) {
      const p = track.points[i]
      side.set(track.binormals[i].x, 0, track.binormals[i].z).normalize().multiplyScalar(RADIUS - 0.1)
      verts.push(p.x - side.x, 0.08, p.z - side.z, p.x + side.x, 0.08, p.z + side.z) // above the plot paving (y 0.04)
      if (k > 0) idx.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k - 1, 2 * k + 1, 2 * k)
    }
    const floor = new BufferGeometry()
    floor.setAttribute('position', new Float32BufferAttribute(verts, 3))
    floor.setIndex(idx)
    floor.computeVertexNormals()
    const rings: { m: Matrix4; s: number }[] = []
    for (let s = s0; s <= s1; s += RING_EVERY) {
      const i = Math.round((s / track.length) * track.segments)
      const p = track.points[i].clone().addScaledVector(track.normals[i], 1.0)
      rings.push({ m: new Matrix4().makeBasis(track.binormals[i], track.normals[i], track.tangents[i]).setPosition(p), s })
    }
    return { shell, rings, floor }
  }, [track])

  const mats = useMemo(
    () => ({
      inner: new MeshStandardMaterial({ color: '#0b1026', roughness: 0.9, side: BackSide }),
      outer: new MeshStandardMaterial({ color: '#4f8a3c', roughness: 1, side: FrontSide }),
      floor: new MeshStandardMaterial({ color: '#0b1026', roughness: 1, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
      ring: new MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
    }),
    [],
  )
  useEffect(
    () => () => {
      shell.dispose()
      floor.dispose()
      Object.values(mats).forEach((m) => m.dispose())
    },
    [shell, floor, mats],
  )

  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    rings.forEach((r, i) => {
      ref.current!.setMatrixAt(i, r.m)
      ref.current!.setColorAt(i, COLD)
    })
    ref.current!.instanceMatrix.needsUpdate = true
    ref.current!.instanceColor!.needsUpdate = true
    ref.current!.computeBoundingSphere()
  }, [rings])

  const c = useMemo(() => new Color(), [])
  useFrame(({ clock }) => {
    const mesh = ref.current
    const t = train()
    if (!mesh || !t) return
    const L = track.length
    const head = ((t.position % L) + L) % L
    const speed = t.getSpeed()
    const time = clock.elapsedTime
    rings.forEach((r, i) => {
      // distance of the ring ahead of the front car (wrapping around the lap)
      let d = r.s - head
      if (d < -L / 2) d += L
      // a wave of light runs a few metres ahead of the train, plus a slow idle shimmer
      const wave = speed > 0.5 ? Math.exp(-(((d - 4) / 5) ** 2)) : 0
      const idle = 0.25 + 0.15 * Math.sin(time * 2 + i * 0.6)
      const k = Math.min(1, idle + wave * 1.4)
      c.copy(COLD).lerp(HOT, wave).multiplyScalar(0.25 + k * 1.6)
      mesh.setColorAt(i, c)
    })
    mesh.instanceColor!.needsUpdate = true
  })

  return (
    <group>
      <mesh geometry={shell} material={mats.inner} />
      <mesh geometry={floor} material={mats.floor} />
      <mesh geometry={shell} material={mats.outer} receiveShadow castShadow />
      <instancedMesh ref={ref} args={[ringGeo, mats.ring, rings.length]} />
    </group>
  )
}
