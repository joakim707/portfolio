import { useMemo } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { CanvasTexture, DoubleSide, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from 'three'
import { STANDS, STAND_RING, polar } from '@/config/park'
import { useSignTexture } from '@/utils/textTexture'
import { MAT } from './materials'

type StandKind = (typeof STANDS)[number]['kind']

const STAND_STYLE: Record<StandKind, { label: string; color: string }> = {
  info: { label: 'INFOS', color: '#1d4ed8' },
  popcorn: { label: 'POP-CORN', color: '#dc2626' },
  drinks: { label: 'BOISSONS', color: '#0891b2' },
  icecream: { label: 'GLACES', color: '#db2777' },
  shop: { label: 'BOUTIQUE', color: '#7c3aed' },
  churros: { label: 'CHURROS', color: '#ea580c' },
  candy: { label: 'BONBONS', color: '#c026d3' },
  photo: { label: 'PHOTOS', color: '#16a34a' },
}

/** One striped awning material per colour, shared by every stand using it. */
const awningCache = new Map<string, MeshStandardMaterial>()
function awningMaterial(color: string) {
  let m = awningCache.get(color)
  if (m) return m
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 8
  const ctx = c.getContext('2d')!
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#fdf8ee' : color
    ctx.fillRect(i * 8, 0, 8, 8)
  }
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.wrapS = RepeatWrapping
  m = new MeshStandardMaterial({ map: tex, roughness: 0.8, side: DoubleSide })
  awningCache.set(color, m)
  return m
}

const W = 5
const D = 3.4
const H = 2.6

function Stand({ angle, kind }: { angle: number; kind: StandKind }) {
  const style = STAND_STYLE[kind]
  const [x, z] = polar(angle, STAND_RING)
  const sign = useSignTexture(style.label, '', { width: 512, height: 128, background: '#fdf8ee', color: style.color, accent: style.color, border: 8 })
  const body = useMemo(() => new MeshStandardMaterial({ color: style.color, roughness: 0.7 }), [style.color])
  const awning = awningMaterial(style.color)

  return (
    // local +Z faces the promenade (towards the park centre)
    <group position={[x, 0, z]} rotation-y={(-angle * Math.PI) / 180}>
      <mesh position-y={H / 2} material={MAT.white} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
      </mesh>
      {/* counter and service window */}
      <mesh position={[0, 1.05, D / 2 + 0.3]} material={body} castShadow>
        <boxGeometry args={[W - 0.6, 0.12, 0.7]} />
      </mesh>
      <mesh position={[0, 1.75, D / 2 + 0.01]} material={MAT.navy}>
        <planeGeometry args={[W - 1.2, 1.1]} />
      </mesh>
      <mesh position={[0, 0.5, D / 2 + 0.01]} material={body}>
        <planeGeometry args={[W, 1]} />
      </mesh>
      {/* sloped striped awning */}
      <mesh position={[0, H + 0.15, D / 2 + 0.55]} rotation-x={0.45} material={awning} castShadow>
        <planeGeometry args={[W + 0.4, 1.7]} />
      </mesh>
      {/* roof + sign */}
      <mesh position-y={H + 0.15} material={body} castShadow>
        <boxGeometry args={[W + 0.3, 0.3, D + 0.3]} />
      </mesh>
      <mesh position={[0, H + 1.05, 0.2]}>
        <planeGeometry args={[W * 0.9, (W * 0.9) / 4]} />
        <meshStandardMaterial map={sign} emissiveMap={sign} emissive="#ffffff" emissiveIntensity={0.2} />
      </mesh>
      {kind === 'popcorn' && (
        <mesh position={[W / 2 - 0.4, H + 1.2, 0]} material={MAT.yellow} castShadow>
          <cylinderGeometry args={[0.5, 0.35, 1.2, 10]} />
        </mesh>
      )}
      {kind === 'icecream' && (
        <group position={[W / 2 - 0.5, H + 0.6, 0]}>
          <mesh position-y={0.5} rotation-x={Math.PI} material={MAT.wood}>
            <coneGeometry args={[0.4, 1.1, 10]} />
          </mesh>
          <mesh position-y={1.2} material={body}>
            <sphereGeometry args={[0.45, 14, 10]} />
          </mesh>
        </group>
      )}
      {kind === 'info' && (
        <mesh position={[W / 2 - 0.4, H + 1.1, 0]} material={body}>
          <sphereGeometry args={[0.55, 16, 12]} />
        </mesh>
      )}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[W / 2, H / 2, D / 2 + 0.5]} position={[0, H / 2, 0.3]} />
      </RigidBody>
    </group>
  )
}

export function Stands() {
  return (
    <group>
      {STANDS.map((s) => (
        <Stand key={`${s.kind}${s.angle}`} angle={s.angle} kind={s.kind} />
      ))}
    </group>
  )
}
