import { ATTRACTIONS } from '@/data/attractions'
import {
  AVENUE_WIDTH,
  ENTRANCE_Z,
  PLAZA_RADIUS,
  PROMENADE_RADIUS,
  PROMENADE_WIDTH,
  RADIAL_PATH_WIDTH,
} from '@/config/park'
import { MAT } from './materials'

const Y = 0.02

/** A flat path strip between two radii along a given compass angle. */
function RadialStrip({ angleDeg, from, to, width }: { angleDeg: number; from: number; to: number; width: number }) {
  const a = (angleDeg * Math.PI) / 180
  const mid = (from + to) / 2
  const len = to - from
  return (
    <group position={[Math.sin(a) * mid, Y, -Math.cos(a) * mid]} rotation-y={-a}>
      <mesh rotation-x={-Math.PI / 2} material={MAT.pathEdge} receiveShadow>
        <planeGeometry args={[width + 1, len]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.004} material={MAT.path} receiveShadow>
        <planeGeometry args={[width, len]} />
      </mesh>
    </group>
  )
}

/** Avenue from the gate, promenade ring and one radial path per attraction. */
export function Paths() {
  const avenueLen = ENTRANCE_Z + 30 - PLAZA_RADIUS
  return (
    <group>
      {/* Main avenue: plaza → gate → forecourt */}
      <group position={[0, Y, PLAZA_RADIUS + avenueLen / 2]}>
        <mesh rotation-x={-Math.PI / 2} material={MAT.pathEdge} receiveShadow>
          <planeGeometry args={[AVENUE_WIDTH + 1.4, avenueLen]} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={0.004} material={MAT.path} receiveShadow>
          <planeGeometry args={[AVENUE_WIDTH, avenueLen]} />
        </mesh>
      </group>

      {/* Promenade ring */}
      <mesh rotation-x={-Math.PI / 2} position-y={Y + 0.002} material={MAT.pathEdge} receiveShadow>
        <ringGeometry args={[PROMENADE_RADIUS - PROMENADE_WIDTH / 2 - 0.5, PROMENADE_RADIUS + PROMENADE_WIDTH / 2 + 0.5, 128, 1]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={Y + 0.006} material={MAT.path} receiveShadow>
        <ringGeometry args={[PROMENADE_RADIUS - PROMENADE_WIDTH / 2, PROMENADE_RADIUS + PROMENADE_WIDTH / 2, 128, 1]} />
      </mesh>

      {/* Radial paths to each attraction plot */}
      {ATTRACTIONS.map((a) => (
        <RadialStrip
          key={a.id}
          angleDeg={a.angle}
          from={PLAZA_RADIUS - 1}
          to={a.distance - a.radius + 1}
          width={RADIAL_PATH_WIDTH}
        />
      ))}
    </group>
  )
}
