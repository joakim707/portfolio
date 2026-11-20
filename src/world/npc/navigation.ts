import { Vector3 } from 'three'
import { ATTRACTIONS, type AttractionId } from '@/data/attractions'
import { ENTRANCE_Z, PROMENADE_RADIUS, polar } from '@/config/park'
import { ATTRACTION_MODULES } from '@/core/rides/registry'

/**
 * Walkable network for park NPCs, laid on the centre lines of the real paths
 * (so they never cross stands, lamps, planters or rides): a ring on the plaza,
 * the promenade ring, one radial per attraction ending at a queue, and the
 * avenue. Plus bench seats and queue slots.
 *
 * Yaw convention (same as the player): yaw 0 faces −Z, direction = (−sin, −cos).
 */

export interface NavNode {
  p: Vector3
  links: number[]
  /** Queue head for this attraction (end of its radial path). */
  queue?: AttractionId
  /** Bench seats reachable from this node. */
  benches?: number[]
}

export interface BenchSeat {
  p: Vector3
  yaw: number
  /** Where to stand before sitting down. */
  approach: Vector3
}

export interface QueueLine {
  id: AttractionId
  /** Slot 0 = front of the line (at the entrance arch), then backwards towards the plaza. */
  slots: Vector3[]
  /** Facing the arch. */
  yaw: number
  /** Point under the arch where an NPC "enters" the ride area. */
  entry: Vector3
}

const PLAZA_RING = 16
const BENCH_SCALE = 2.6
/** Kenney bench, measured: seat top 0.25 units, riders face −Z, backrest at +Z. */
const BENCH_SEATS_LOCAL: [number, number, number][] = [
  [-0.2 * BENCH_SCALE, 0.25 * BENCH_SCALE, 0.02 * BENCH_SCALE],
  [0.2 * BENCH_SCALE, 0.25 * BENCH_SCALE, 0.02 * BENCH_SCALE],
]

const v3 = (x: number, y: number, z: number) => new Vector3(x, y, z)

/** World seat from a bench placed at (x, z) with rotation rotY (same placement as the decor). */
function benchSeats(x: number, z: number, rotY: number, approachDist: number): BenchSeat[] {
  const c = Math.cos(rotY)
  const s = Math.sin(rotY)
  // the bench faces its local −Z; rotated by rotY that direction is (−sin, −cos) ⇒ yaw = rotY
  return BENCH_SEATS_LOCAL.map(([lx, ly, lz]) => {
    const wx = x + lx * c + lz * s
    const wz = z - lx * s + lz * c
    return { p: v3(wx, ly, wz), yaw: rotY, approach: v3(wx - s * approachDist, 0, wz - c * approachDist) }
  })
}

export function buildNavigation() {
  const nodes: NavNode[] = []
  const add = (p: Vector3) => nodes.push({ p, links: [] }) - 1
  const link = (a: number, b: number) => {
    if (a === b || nodes[a].links.includes(b)) return
    nodes[a].links.push(b)
    nodes[b].links.push(a)
  }
  const ring = (radius: number, count: number) => {
    const ids: number[] = []
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      ids.push(add(v3(Math.sin(a) * radius, 0, Math.cos(a) * radius)))
    }
    ids.forEach((id, i) => link(id, ids[(i + 1) % count]))
    return ids
  }
  const nearest = (ids: number[], p: Vector3) => ids.reduce((best, id) => (nodes[id].p.distanceToSquared(p) < nodes[best].p.distanceToSquared(p) ? id : best), ids[0])

  const plaza = ring(PLAZA_RING, 24)
  const promenade = ring(PROMENADE_RADIUS, 48)

  // radial paths: plaza ring → promenade → queue head in front of each arch
  const queues: QueueLine[] = []
  for (const a of ATTRACTIONS) {
    const arch = a.distance - a.radius
    const [dx, dz] = polar(a.angle, 1)
    let prev = nearest(plaza, v3(dx * PLAZA_RING, 0, dz * PLAZA_RING))
    for (let r = 26; r < arch - 9; r += 9) {
      const p = v3(dx * r, 0, dz * r)
      const id = Math.abs(r - PROMENADE_RADIUS) < 5 ? nearest(promenade, p) : add(p)
      link(prev, id)
      prev = id
    }
    const head = add(v3(dx * (arch - 8), 0, dz * (arch - 8)))
    link(prev, head)
    // queues only form in front of rides that are actually open
    if (!ATTRACTION_MODULES[a.id]) continue
    nodes[head].queue = a.id
    // (a 9 m step from r = 26 always lands one node within 5 m of the promenade, linking both)
    const yaw = Math.atan2(-dx, -dz) // facing outward, towards the arch
    queues.push({
      id: a.id,
      slots: Array.from({ length: 7 }, (_, k) => v3(dx * (arch - 1.5 - k * 0.95), 0, dz * (arch - 1.5 - k * 0.95))),
      yaw,
      entry: v3(dx * (arch + 2), 0, dz * (arch + 2)),
    })
  }

  // avenue: plaza → just inside the gate
  let prev = nearest(plaza, v3(0, 0, PLAZA_RING))
  for (let z = 26; z < ENTRANCE_Z - 10; z += 12) {
    const p = v3(0, 0, z)
    const id = Math.abs(z - PROMENADE_RADIUS) < 6 ? nearest(promenade, p) : add(p)
    link(prev, id)
    prev = id
  }

  // benches: plaza ring (radius 12, facing the fountain) and avenue (x = ±7.9, facing the walkway)
  const seats: BenchSeat[] = []
  for (let i = 0; i < 12; i++) {
    const a = ((i + 0.5) / 12) * Math.PI * 2
    for (const s of benchSeats(Math.sin(a) * 12, Math.cos(a) * 12, a, -1.2)) {
      const node = nearest(plaza, s.p)
      ;(nodes[node].benches ??= []).push(seats.push({ ...s, approach: s.p.clone().setY(0).multiplyScalar(14.5 / 12) }) - 1)
    }
  }
  const avenueIds = nodes.map((_, i) => i).filter((i) => nodes[i].p.x === 0 && nodes[i].p.z > PLAZA_RING + 2)
  for (let z = 51; z < ENTRANCE_Z - 14; z += 28) {
    for (const side of [-1, 1]) {
      for (const s of benchSeats(side * 7.9, z, (side * Math.PI) / 2, 1.6)) {
        const node = nearest(avenueIds, s.p)
        ;(nodes[node].benches ??= []).push(seats.push(s) - 1)
      }
    }
  }
  return { nodes, seats, queues }
}

export type Navigation = ReturnType<typeof buildNavigation>
