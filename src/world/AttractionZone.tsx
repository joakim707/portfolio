import { lazy, Suspense, useMemo, type ComponentType } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { MeshStandardMaterial } from 'three'
import { ATTRACTIONS, zonePosition, zoneRotationY, type AttractionDef, type AttractionId } from '@/data/attractions'
import { getProject } from '@/data/projects'
import { ATTRACTION_MODULES } from '@/core/rides/registry'
import { useSignTexture } from '@/utils/textTexture'
import { BlueprintHologram } from '@/attractions/_shared/BlueprintHologram'
import { ConstructionSite } from '@/attractions/_shared/ConstructionSite'
import { ArcWall } from './ArcWall'
import { MAT } from './materials'

/** Lazy components are created once per attraction, at module level. */
const LAZY: Partial<Record<AttractionId, ComponentType<{ id: AttractionId }>>> = Object.fromEntries(
  ATTRACTIONS.filter((a) => ATTRACTION_MODULES[a.id]).map((a) => [a.id, lazy(ATTRACTION_MODULES[a.id]!)]),
)

/** Gap half-angle (radians) of the hedge, where the queue entrance is. */
const ENTRY_GAP = 0.2

function EntranceArch({ def }: { def: AttractionDef }) {
  const project = getProject(def.project)
  const sign = useSignTexture(def.name, `${def.kindLabel} · ${project?.title ?? ''}`, {
    background: '#10142a',
    accent: def.color,
  })
  const accent = useMemo(
    () => new MeshStandardMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 0.35 }),
    [def.color],
  )
  const span = Math.sin(ENTRY_GAP) * def.radius * 2 + 1
  return (
    <group position={[0, 0, def.radius]}>
      {[-1, 1].map((s) => (
        <group key={s} position-x={(s * span) / 2}>
          <mesh position-y={3.5} material={MAT.white} castShadow>
            <boxGeometry args={[1.2, 7, 1.2]} />
          </mesh>
          <mesh position-y={7.4} material={accent} castShadow>
            <sphereGeometry args={[0.8, 16, 12]} />
          </mesh>
        </group>
      ))}
      <mesh position-y={6.6} material={accent} castShadow>
        <boxGeometry args={[span + 1.4, 0.5, 0.8]} />
      </mesh>
      <mesh position={[0, 8.6, 0.05]}>
        <planeGeometry args={[span + 2, (span + 2) / 4]} />
        <meshStandardMaterial map={sign} emissiveMap={sign} emissive="#ffffff" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, 8.6, -0.05]} rotation-y={Math.PI} material={MAT.navy}>
        <planeGeometry args={[span + 2, (span + 2) / 4]} />
      </mesh>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.6, 3.5, 0.6]} position={[-span / 2, 3.5, 0]} />
        <CuboidCollider args={[0.6, 3.5, 0.6]} position={[span / 2, 3.5, 0]} />
      </RigidBody>
    </group>
  )
}

/**
 * One attraction plot in its local frame (origin = plot centre, +Z = plaza side).
 * Renders the shared shell (plot, hedge, entrance arch) and then either the
 * ride module, a blueprint hologram or a construction site.
 */
export function AttractionZone({ def }: { def: AttractionDef }) {
  const position = useMemo(() => zonePosition(def), [def])
  const rotationY = useMemo(() => zoneRotationY(def), [def])
  const Ride = LAZY[def.id]
  const plotMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#d8cdb8',
        roughness: 0.95,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    [],
  )
  const ringMat = useMemo(() => new MeshStandardMaterial({ color: def.color, roughness: 0.6 }), [def.color])

  return (
    <group position={position} rotation-y={rotationY} name={`zone-${def.id}`}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.04} material={plotMat} receiveShadow>
        <circleGeometry args={[def.radius, 64]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.05} material={ringMat} receiveShadow>
        <ringGeometry args={[def.radius - 0.8, def.radius, 64, 1]} />
      </mesh>

      <ArcWall
        radius={def.radius + 0.9}
        height={1.3}
        thickness={1.2}
        segments={Math.round(def.radius * 2.2)}
        material={MAT.hedge}
        gapAngle={0}
        gapHalf={ENTRY_GAP}
      />
      <EntranceArch def={def} />

      {/* boarding-zone marker placeholder: the generic ride system (étape 4) hooks the E prompt here */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.07, def.radius - 4]} material={ringMat}>
        <ringGeometry args={[1.2, 1.5, 32]} />
      </mesh>

      {Ride ? (
        <Suspense fallback={<BlueprintHologram def={def} worldPos={position} />}>
          <Ride id={def.id} />
        </Suspense>
      ) : def.status === 'construction' ? (
        <ConstructionSite def={def} worldPos={position} />
      ) : (
        <BlueprintHologram def={def} worldPos={position} />
      )}
    </group>
  )
}
