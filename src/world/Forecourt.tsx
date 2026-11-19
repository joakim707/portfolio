import { useEffect, useMemo } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { ATTRACTIONS, zonePosition } from '@/data/attractions'
import {
  ENTRANCE_Z,
  FORECOURT,
  PARK_RADIUS,
  PLAZA_RADIUS,
  POND,
  PROMENADE_RADIUS,
  SPAWN_POSITION,
} from '@/config/park'
import { MAT } from './materials'

/** Draws the park plan from the real layout data, so it never drifts from the 3D world. */
function useParkMapTexture() {
  const texture = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 1280
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 4
    return t
  }, [])

  useEffect(() => {
    const draw = () => {
      const c = texture.image as HTMLCanvasElement
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#fdf8ee'
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.fillStyle = '#1d2b53'
      ctx.fillRect(0, 0, c.width, 170)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ffffff'
      ctx.font = '64px Bungee, Impact, sans-serif'
      ctx.fillText('PLAN DU PARC', c.width / 2, 72)
      ctx.fillStyle = '#f6c445'
      ctx.font = '600 30px Inter, sans-serif'
      ctx.fillText('Wilondja World', c.width / 2, 132)

      const cx = c.width / 2
      const cy = 170 + 520
      const s = 470 / (ENTRANCE_Z + 20)
      const P = (x: number, z: number) => [cx + x * s, cy + z * s] as const

      ctx.fillStyle = '#8cc56f'
      ctx.beginPath()
      ctx.arc(cx, cy, PARK_RADIUS * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#d9c7a7'
      ctx.lineCap = 'round'
      ctx.lineWidth = 6 * s * 1.6
      ctx.beginPath()
      ctx.arc(cx, cy, PROMENADE_RADIUS * s, 0, Math.PI * 2)
      ctx.stroke()
      for (const a of ATTRACTIONS) {
        const [x, , z] = zonePosition(a)
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(...P(x, z))
        ctx.stroke()
      }
      ctx.lineWidth = 12 * s * 1.6
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(...P(0, ENTRANCE_Z + 20))
      ctx.stroke()
      ctx.fillStyle = '#e7dcc8'
      ctx.beginPath()
      ctx.arc(cx, cy, PLAZA_RADIUS * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#3fa7d6'
      ctx.beginPath()
      ctx.arc(...P(POND.x, POND.z), POND.radius * s, 0, Math.PI * 2)
      ctx.fill()

      for (const a of ATTRACTIONS) {
        const [x, , z] = zonePosition(a)
        const [px, py] = P(x, z)
        ctx.fillStyle = a.status === 'construction' ? '#9ca3af' : a.color
        ctx.beginPath()
        ctx.arc(px, py, a.radius * s, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#10142a'
        ctx.font = '22px Bungee, Impact, sans-serif'
        const label = a.name.replace(/^THE /, '')
        ctx.fillText(label, px, py - 6)
        ctx.font = '600 17px Inter, sans-serif'
        ctx.fillText(a.status === 'construction' ? 'en construction' : a.kindLabel.split(' ').slice(0, 3).join(' '), px, py + 18)
      }

      // you are here
      const [hx, hy] = P(SPAWN_POSITION[0], SPAWN_POSITION[2])
      ctx.fillStyle = '#ff4d6d'
      ctx.beginPath()
      ctx.arc(hx, hy - 14, 14, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#10142a'
      ctx.font = '600 26px Inter, sans-serif'
      ctx.fillText('Vous êtes ici', hx, hy + 22)

      ctx.font = '600 26px Inter, sans-serif'
      ctx.fillText('8 attractions · 8 projets · 1 développeur', cx, c.height - 50)
      texture.needsUpdate = true
    }
    draw()
    document.fonts?.ready.then(draw).catch(() => {})
  }, [texture])

  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

/** Enclosed arrival square in front of the gate, where the visitor spawns. */
export function Forecourt() {
  const map = useParkMapTexture()
  const { halfWidth: hw, depth } = FORECOURT
  const zMid = ENTRANCE_Z + depth / 2
  const sideLen = depth + 4

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.022, zMid + 2]} material={MAT.path} receiveShadow>
        <planeGeometry args={[hw * 2 - 4, depth - 2]} />
      </mesh>

      {/* hedges closing the forecourt (sides + back) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * hw, 0.9, zMid - 1]} material={MAT.hedge} castShadow receiveShadow>
          <boxGeometry args={[1.4, 1.8, sideLen]} />
        </mesh>
      ))}
      <mesh position={[0, 0.9, ENTRANCE_Z + depth]} material={MAT.hedge} castShadow receiveShadow>
        <boxGeometry args={[hw * 2 + 1.4, 1.8, 1.4]} />
      </mesh>

      {/* park map board, angled towards the spawn point */}
      <group position={[-12, 0, ENTRANCE_Z + 15]} rotation-y={0.75}>
        {[-1.9, 1.9].map((x) => (
          <mesh key={x} position={[x, 1.9, 0]} material={MAT.darkMetal} castShadow>
            <boxGeometry args={[0.2, 3.8, 0.2]} />
          </mesh>
        ))}
        <mesh position={[0, 3.2, 0]} material={MAT.navy} castShadow>
          <boxGeometry args={[3.8, 4.6, 0.15]} />
        </mesh>
        <mesh position={[0, 3.2, 0.08]}>
          <planeGeometry args={[3.5, 4.375]} />
          <meshStandardMaterial map={map} />
        </mesh>
      </group>

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.7, 1.5, sideLen / 2]} position={[-hw, 1.5, zMid - 1]} />
        <CuboidCollider args={[0.7, 1.5, sideLen / 2]} position={[hw, 1.5, zMid - 1]} />
        <CuboidCollider args={[hw + 0.7, 1.5, 0.7]} position={[0, 1.5, ENTRANCE_Z + depth]} />
        <CuboidCollider args={[2, 2.4, 0.3]} position={[-12, 2.4, ENTRANCE_Z + 15]} rotation={[0, 0.75, 0]} />
      </RigidBody>
    </group>
  )
}
