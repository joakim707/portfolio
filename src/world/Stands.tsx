import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { STANDS, STAND_RING, polar } from '@/config/park'
import { useSignTexture } from '@/utils/textTexture'
import { MAT } from './materials'
import { useKenney, type KenneyModel } from './assets'

type StandKind = (typeof STANDS)[number]['kind']

const STAND_STYLE: Record<StandKind, { label: string; color: string }> = {
  info: { label: 'INFOS', color: '#1d4ed8' },
  popcorn: { label: 'POP-CORN', color: '#dc2626' },
  drinks: { label: 'BOISSONS', color: '#0891b2' },
  icecream: { label: 'GLACES', color: '#db2777' },
  churros: { label: 'CHURROS', color: '#ea580c' },
  candy: { label: 'BONBONS', color: '#c026d3' },
  toilets: { label: 'TOILETTES', color: '#0f766e' },
}

/** Which Kenney stall each stand uses (the text sign tells them apart). */
const STAND_MODEL: Record<StandKind, KenneyModel> = {
  info: 'stall-information',
  toilets: 'stall-toilets',
  popcorn: 'stall-food',
  churros: 'stall-food',
  candy: 'stall-food',
  drinks: 'stall-drinks',
  icecream: 'stall-drinks',
}
const SCALE = 3.4
/** Kenney stalls face -Z; our stands' local +Z faces the promenade. */
const FACE_PROMENADE = Math.PI

function Stand({ angle, kind }: { angle: number; kind: StandKind }) {
  const style = STAND_STYLE[kind]
  const [x, z] = polar(angle, STAND_RING)
  const model = useKenney(STAND_MODEL[kind])
  const sign = useSignTexture(style.label, '', { width: 512, height: 128, background: '#fdf8ee', color: style.color, accent: style.color, border: 8 })
  const w = model.size.x * SCALE
  const d = model.size.z * SCALE
  const signX = w / 2 + 0.9

  return (
    // local +Z faces the promenade (towards the park centre)
    <group position={[x, 0, z]} rotation-y={(-angle * Math.PI) / 180}>
      <mesh geometry={model.geometry} material={model.material} scale={SCALE} rotation-y={FACE_PROMENADE} castShadow receiveShadow />
      {/* name board on a post, next to the stall */}
      <mesh position={[signX, 1.3, d / 2 - 0.4]} material={MAT.darkMetal} castShadow>
        <boxGeometry args={[0.12, 2.6, 0.12]} />
      </mesh>
      <mesh position={[signX, 2.75, d / 2 - 0.33]}>
        <planeGeometry args={[2.4, 0.6]} />
        <meshStandardMaterial map={sign} emissiveMap={sign} emissive="#ffffff" emissiveIntensity={0.2} />
      </mesh>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[w / 2, 1.4, d / 2]} position={[0, 1.4, 0]} />
        <CuboidCollider args={[0.15, 1.4, 0.15]} position={[signX, 1.4, d / 2 - 0.4]} />
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
