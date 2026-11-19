import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, Group, Vector3, type Material } from 'three'
import type { AttractionDef } from '@/data/attractions'
import type { RideKind } from '@/core/rides/types'
import { hologramMaterial } from '@/world/materials'
import { useDistanceGate } from '@/utils/useDistanceGate'

/**
 * Animated wireframe "blueprint" of the future ride, shown on reserved plots
 * of open attractions whose module is not implemented yet. It conveys the
 * ride's size and type from across the park; it is replaced by the real ride
 * as soon as the attraction registers a module.
 */
export function BlueprintHologram({ def, worldPos }: { def: AttractionDef; worldPos: [number, number, number] }) {
  const fill = useMemo(() => hologramMaterial(def.color, 0.16), [def.color])
  const line = useMemo(() => {
    const m = hologramMaterial(def.color, 0.65)
    m.wireframe = true
    return m
  }, [def.color])
  useEffect(
    () => () => {
      fill.dispose()
      line.dispose()
    },
    [fill, line],
  )

  const moving = useRef<Group>(null)
  const ring = useRef<Group>(null)
  const near = useDistanceGate(worldPos, 320)

  useFrame(({ clock }) => {
    if (!near.current) return
    const t = clock.elapsedTime
    if (ring.current) ring.current.rotation.y = t * 0.3
    const g = moving.current
    if (!g) return
    animateKind(def.kind, g, t)
  })

  return (
    <group>
      <group ref={ring}>
        <mesh rotation-x={-Math.PI / 2} position-y={0.12} material={line}>
          <ringGeometry args={[def.radius * 0.55, def.radius * 0.6, 48, 1]} />
        </mesh>
      </group>
      <KindShape kind={def.kind} height={def.height} radius={def.radius} fill={fill} line={line} movingRef={moving} />
    </group>
  )
}

function animateKind(kind: RideKind, g: Group, t: number) {
  switch (kind) {
    case 'pendulum':
    case 'swing-boat':
      g.rotation.z = Math.sin(t * 0.8) * 0.6
      break
    case 'drop-tower':
      g.position.y = 6 + (Math.sin(t * 0.5) * 0.5 + 0.5) * 50
      break
    case 'coaster':
      g.rotation.y = t * 0.15
      break
    default:
      g.position.y = Math.sin(t * 1.5) * 0.3
  }
}

interface ShapeProps {
  kind: RideKind
  height: number
  radius: number
  fill: Material
  line: Material
  movingRef: RefObject<Group | null>
}

function KindShape({ kind, height, radius, fill, line, movingRef }: ShapeProps) {
  const coasterCurve = useMemo(() => {
    const r = radius * 0.7
    const pts = [
      new Vector3(-r, 2, r * 0.5),
      new Vector3(-r * 0.4, height * 0.95, -r * 0.2),
      new Vector3(0, 3, -r * 0.7),
      new Vector3(r * 0.6, height * 0.5, -r * 0.4),
      new Vector3(r, 4, r * 0.2),
      new Vector3(r * 0.2, height * 0.35, r * 0.6),
    ]
    return new CatmullRomCurve3(pts, true, 'catmullrom', 0.5)
  }, [radius, height])

  switch (kind) {
    case 'coaster':
      return (
        <group>
          <mesh material={line}>
            <tubeGeometry args={[coasterCurve, 160, 0.6, 6, true]} />
          </mesh>
          <group ref={movingRef} position={[radius * 0.15, height * 0.45, 0]}>
            <mesh rotation-y={Math.PI / 2} material={line}>
              <torusGeometry args={[height * 0.3, 0.5, 6, 32]} />
            </mesh>
          </group>
        </group>
      )
    case 'drop-tower':
      return (
        <group>
          <mesh position-y={height / 2} material={line}>
            <cylinderGeometry args={[1.8, 2.4, height, 8, 12]} />
          </mesh>
          <group ref={movingRef}>
            <mesh material={fill}>
              <cylinderGeometry args={[4.5, 4.5, 2, 16, 1, true]} />
            </mesh>
          </group>
        </group>
      )
    case 'pendulum':
    case 'swing-boat': {
      const pivot = kind === 'pendulum' ? height * 0.8 : height * 0.75
      return (
        <group>
          {[-1, 1].map((s) => (
            <group key={s} position-z={s * 4}>
              <mesh position={[-pivot * 0.3, pivot / 2, 0]} rotation-z={-0.32} material={line}>
                <boxGeometry args={[1, pivot * 1.05, 1, 1, 6, 1]} />
              </mesh>
              <mesh position={[pivot * 0.3, pivot / 2, 0]} rotation-z={0.32} material={line}>
                <boxGeometry args={[1, pivot * 1.05, 1, 1, 6, 1]} />
              </mesh>
            </group>
          ))}
          <group ref={movingRef} position-y={pivot}>
            <mesh position-y={-pivot * 0.45} material={line}>
              <boxGeometry args={[1.2, pivot * 0.9, 1.2, 1, 6, 1]} />
            </mesh>
            {kind === 'pendulum' ? (
              <mesh position-y={-pivot + 1.5} material={fill}>
                <cylinderGeometry args={[5, 5, 1.2, 20]} />
              </mesh>
            ) : (
              <mesh position-y={-pivot + 3} rotation-x={Math.PI / 2} material={fill}>
                <cylinderGeometry args={[3.2, 3.2, 16, 16, 1, true, Math.PI / 2, Math.PI]} />
              </mesh>
            )}
          </group>
        </group>
      )
    }
    default: {
      // enclosed dark rides / show buildings
      const w = radius * 1.3
      return (
        <group ref={movingRef}>
          <mesh position-y={height / 2} material={line}>
            <boxGeometry args={[w, height, w * 0.8, 6, 3, 5]} />
          </mesh>
          <mesh position-y={height / 2} material={fill}>
            <boxGeometry args={[w, height, w * 0.8]} />
          </mesh>
        </group>
      )
    }
  }
}
