import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  Vector3,
} from 'three'
import { ENTRANCE_Z, PARK_RADIUS, PLAZA_RADIUS, STANDS, polar } from '@/config/park'
import { createRng } from '@/utils/random'
import { useDistanceGate } from '@/utils/useDistanceGate'
import { isFreeGround } from './layout'
import { MAT } from './materials'

const unitBox = new BoxGeometry(1, 1, 1)
const flowerGeo = new IcosahedronGeometry(0.22, 0)
const binGeo = new CylinderGeometry(0.3, 0.26, 0.9, 10).translate(0, 0.45, 0)
const patchGeo = new CircleGeometry(1, 10).rotateX(-Math.PI / 2)
const bannerGeo = new PlaneGeometry(1.2, 3).translate(0.6, -1.5, 0)
const poleGeo = new CylinderGeometry(0.07, 0.09, 6, 6).translate(0, 3, 0)
const balloonGeo = new SphereGeometry(0.42, 14, 10).scale(1, 1.2, 1)

const FLOWER_COLORS = ['#f43f5e', '#facc15', '#f97316', '#a855f7', '#ffffff', '#ec4899', '#38bdf8']
const BANNER_COLORS = ['#ff4d6d', '#f6c445', '#1d4ed8', '#22c55e']

const flowerMat = new MeshStandardMaterial({ roughness: 0.8 })
const patchMat = new MeshStandardMaterial({ roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })
const bannerMat = new MeshStandardMaterial({ roughness: 0.8, side: DoubleSide })
const soilMat = new MeshStandardMaterial({ color: '#5b3a24', roughness: 1 })

/** Instanced mesh filled once from a list of matrices (and optional colours). */
function StaticInstances({
  matrices,
  colors,
  geometry,
  material,
  castShadow = true,
}: {
  matrices: Matrix4[]
  colors?: Color[]
  geometry: BufferGeometry
  material: MeshStandardMaterial
  castShadow?: boolean
}) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current!
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
    colors?.forEach((c, i) => mesh.setColorAt(i, c))
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [matrices, colors])
  return <instancedMesh ref={ref} args={[geometry, material, matrices.length]} castShadow={castShadow} receiveShadow />
}

const compose = (x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, rotY = 0) =>
  new Matrix4().compose(new Vector3(x, y, z), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), rotY), new Vector3(sx, sy, sz))

/** Flower planters along the avenue and round beds around the plaza. */
function FlowerBeds() {
  const data = useMemo(() => {
    const rng = createRng(11)
    const soil: Matrix4[] = []
    const roundSoil: Matrix4[] = []
    const flowers: Matrix4[] = []
    const colors: Color[] = []
    const colliders: { pos: [number, number, number]; half: [number, number, number]; round?: boolean }[] = []
    const addFlowers = (cx: number, cz: number, w: number, d: number, n: number, round: boolean) => {
      for (let i = 0; i < n; i++) {
        let fx: number
        let fz: number
        if (round) {
          const a = rng() * Math.PI * 2
          const r = Math.sqrt(rng()) * (w - 0.3)
          fx = cx + Math.sin(a) * r
          fz = cz + Math.cos(a) * r
        } else {
          fx = cx + (rng() - 0.5) * (w - 0.4)
          fz = cz + (rng() - 0.5) * (d - 0.4)
        }
        const s = 0.7 + rng() * 0.6
        flowers.push(compose(fx, 0.55 + rng() * 0.15, fz, s, s, s))
        colors.push(new Color(FLOWER_COLORS[Math.floor(rng() * FLOWER_COLORS.length)]))
      }
    }
    // avenue planters
    for (let z = 38; z < ENTRANCE_Z - 14; z += 28) {
      for (const x of [-10, 10]) {
        soil.push(compose(x, 0.22, z, 2, 0.45, 7))
        colliders.push({ pos: [x, 0.25, z], half: [1, 0.25, 3.5] })
        addFlowers(x, z, 2, 7, 26, false)
      }
    }
    // round beds around the plaza, between the radial paths
    // (skip the two beds next to the avenue)
    for (const s of STANDS.filter((st) => Math.abs(st.angle) < 160)) {
      const [x, z] = polar(s.angle, PLAZA_RADIUS + 4.5)
      roundSoil.push(new Matrix4().compose(new Vector3(x, 0.2, z), new Quaternion(), new Vector3(2.2, 0.4, 2.2)))
      colliders.push({ pos: [x, 0.25, z], half: [0.25, 2.2, 0], round: true })
      addFlowers(x, z, 2.2, 0, 22, true)
    }
    return { soil, roundSoil, flowers, colors, colliders }
  }, [])

  const roundGeo = useMemo(() => new CylinderGeometry(1, 1, 1, 20), [])
  return (
    <group>
      <StaticInstances matrices={data.soil} geometry={unitBox} material={soilMat} castShadow={false} />
      <StaticInstances matrices={data.roundSoil} geometry={roundGeo} material={soilMat} castShadow={false} />
      <StaticInstances matrices={data.flowers} colors={data.colors} geometry={flowerGeo} material={flowerMat} castShadow={false} />
      <RigidBody type="fixed" colliders={false}>
        {data.colliders.map((c, i) =>
          c.round ? (
            <CylinderCollider key={i} args={[c.half[0], c.half[1]]} position={c.pos} />
          ) : (
            <CuboidCollider key={i} args={c.half} position={c.pos} />
          ),
        )}
      </RigidBody>
    </group>
  )
}

/** Benches and bins along the avenue, facing the walkway. */
function StreetFurniture() {
  const { benches, bins, colliders } = useMemo(() => {
    const benches: Matrix4[] = []
    const bins: Matrix4[] = []
    const colliders: [number, number, number][] = []
    for (let z = 51; z < ENTRANCE_Z - 14; z += 28) {
      for (const s of [-1, 1]) {
        const x = s * 7.9
        benches.push(compose(x, 0.45, z, 0.9, 0.5, 3))
        bins.push(compose(x, 0, z + 2.4))
        colliders.push([x, 0.45, z])
      }
    }
    return { benches, bins, colliders }
  }, [])
  return (
    <group>
      <StaticInstances matrices={benches} geometry={unitBox} material={MAT.wood} />
      <StaticInstances matrices={bins} geometry={binGeo} material={MAT.darkMetal} />
      <RigidBody type="fixed" colliders={false}>
        {colliders.map((p, i) => (
          <CuboidCollider key={i} args={[0.45, 0.45, 1.5]} position={p} />
        ))}
      </RigidBody>
    </group>
  )
}

/** Banner poles lining the avenue; banners sway in the wind. */
function Banners() {
  const poles = useMemo(() => {
    const out: { x: number; z: number; side: number }[] = []
    for (let z = 45; z < ENTRANCE_Z - 10; z += 28) for (const s of [-1, 1]) out.push({ x: s * 12.5, z, side: s })
    return out
  }, [])
  const poleMatrices = useMemo(() => poles.map((p) => compose(p.x, 0, p.z)), [poles])
  const colors = useMemo(() => poles.map((_, i) => new Color(BANNER_COLORS[i % BANNER_COLORS.length])), [poles])
  const banners = useRef<InstancedMesh>(null)
  const near = useDistanceGate([0, 0, ENTRANCE_Z / 2 + 10], 160)

  useLayoutEffect(() => {
    colors.forEach((c, i) => banners.current!.setColorAt(i, c))
    banners.current!.instanceColor!.needsUpdate = true
  }, [colors])

  const m = useMemo(() => new Matrix4(), [])
  const q = useMemo(() => new Quaternion(), [])
  const up = useMemo(() => new Vector3(0, 1, 0), [])
  const pos = useMemo(() => new Vector3(), [])
  const scl = useMemo(() => new Vector3(1, 1, 1), [])
  const primed = useRef(false)
  useFrame(({ clock }) => {
    if ((!near.current && primed.current) || !banners.current) return
    primed.current = true
    const t = clock.elapsedTime
    poles.forEach((p, i) => {
      // banner hangs towards the avenue and flutters around the pole
      const base = p.side > 0 ? Math.PI : 0
      q.setFromAxisAngle(up, base + Math.sin(t * 1.7 + i) * 0.35)
      banners.current!.setMatrixAt(i, m.compose(pos.set(p.x, 5.8, p.z), q, scl))
    })
    banners.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <StaticInstances matrices={poleMatrices} geometry={poleGeo} material={MAT.darkMetal} />
      <instancedMesh ref={banners} args={[bannerGeo, bannerMat, poles.length]} castShadow frustumCulled={false} />
    </group>
  )
}

/** Patches of different greens / clover scattered on the lawn. */
function MeadowPatches() {
  const { matrices, colors } = useMemo(() => {
    const rng = createRng(23)
    const matrices: Matrix4[] = []
    const colors: Color[] = []
    const palette = ['#6aab52', '#55913f', '#7bb85b', '#4f8a3c', '#8fbf62']
    let guard = 0
    while (matrices.length < 90 && guard++ < 5000) {
      const a = rng() * Math.PI * 2
      const d = Math.sqrt(rng()) * (PARK_RADIUS - 8)
      const x = Math.sin(a) * d
      const z = Math.cos(a) * d
      if (!isFreeGround(x, z, 4)) continue
      const s = 3 + rng() * 6
      matrices.push(compose(x, 0.015, z, s, 1, s * (0.6 + rng() * 0.6), rng() * Math.PI))
      colors.push(new Color(palette[Math.floor(rng() * palette.length)]))
    }
    return { matrices, colors }
  }, [])
  return <StaticInstances matrices={matrices} colors={colors} geometry={patchGeo} material={patchMat} castShadow={false} />
}

/** Balloon seller on the plaza: a cart and a bobbing cluster of balloons. */
function BalloonCart() {
  const [x, z] = polar(0, PLAZA_RADIUS - 5)
  const cluster = useRef<Group>(null)
  const near = useDistanceGate([x, 0, z], 90)
  const balloons = useMemo(() => {
    const rng = createRng(5)
    return Array.from({ length: 8 }, (_, i) => ({
      p: new Vector3((rng() - 0.5) * 1.6, 4 + rng() * 1.4, (rng() - 0.5) * 1.6),
      c: FLOWER_COLORS[i % FLOWER_COLORS.length],
    }))
  }, [])
  useFrame(({ clock }) => {
    if (!near.current || !cluster.current) return
    const t = clock.elapsedTime
    cluster.current.children.forEach((b, i) => {
      b.position.y = balloons[i].p.y + Math.sin(t * 1.3 + i) * 0.12
      b.rotation.z = Math.sin(t * 0.9 + i * 2) * 0.08
    })
  })
  return (
    <group position={[x, 0, z]}>
      <mesh position-y={0.9} material={MAT.brand} castShadow>
        <boxGeometry args={[1.8, 0.9, 1.1]} />
      </mesh>
      {[-0.7, 0.7].map((wx) => (
        <mesh key={wx} position={[wx, 0.35, 0.6]} rotation-x={Math.PI / 2} material={MAT.darkMetal}>
          <cylinderGeometry args={[0.35, 0.35, 0.1, 14]} />
        </mesh>
      ))}
      <group ref={cluster}>
        {balloons.map((b, i) => (
          <group key={i} position={b.p}>
            <mesh geometry={balloonGeo} castShadow>
              <meshStandardMaterial color={b.c} roughness={0.35} />
            </mesh>
            <mesh position-y={-(b.p.y - 1.3) / 2 - 0.4} material={MAT.white}>
              <cylinderGeometry args={[0.01, 0.01, b.p.y - 1.3, 3]} />
            </mesh>
          </group>
        ))}
      </group>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.9, 0.7, 0.6]} position={[0, 0.7, 0]} />
      </RigidBody>
    </group>
  )
}

export function Decor() {
  return (
    <group>
      <MeadowPatches />
      <FlowerBeds />
      <StreetFurniture />
      <Banners />
      <BalloonCart />
    </group>
  )
}
