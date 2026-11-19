import { ATTRACTIONS, zonePosition } from '@/data/attractions'
import {
  AVENUE_WIDTH,
  ENTRANCE_Z,
  PARK_RADIUS,
  PLAZA_RADIUS,
  PROMENADE_RADIUS,
  PROMENADE_WIDTH,
  RADIAL_PATH_WIDTH,
  POND,
  STANDS,
  STAND_RING,
  polar,
} from '@/config/park'

const zones = ATTRACTIONS.map((a) => ({ a, p: zonePosition(a) }))
const stands = STANDS.map((s) => polar(s.angle, STAND_RING))

/** Distance from point P to segment AB in the XZ plane. */
function distToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax
  const dz = bz - az
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)))
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz))
}

/**
 * True when (x, z) is free for decoration (trees, props): not on a path,
 * the plaza, an attraction plot or the entrance.
 */
export function isFreeGround(x: number, z: number, margin = 3) {
  const r = Math.hypot(x, z)
  if (r < PLAZA_RADIUS + margin) return false
  if (Math.abs(r - PROMENADE_RADIUS) < PROMENADE_WIDTH / 2 + margin) return false
  if (z > 0 && Math.abs(x) < AVENUE_WIDTH / 2 + margin) return false
  if (Math.abs(z - ENTRANCE_Z) < 12 + margin && Math.abs(x) < 26 + margin) return false
  if (Math.hypot(x - POND.x, z - POND.z) < POND.radius + margin + 1) return false
  for (const [sx, sz] of stands) if (Math.hypot(x - sx, z - sz) < 5 + margin) return false
  for (const { a, p } of zones) {
    if (Math.hypot(x - p[0], z - p[2]) < a.radius + margin + 1) return false
    if (distToSegment(x, z, 0, 0, p[0], p[2]) < RADIAL_PATH_WIDTH / 2 + margin) return false
  }
  return true
}

export const insidePark = (x: number, z: number, margin = 0) => Math.hypot(x, z) < PARK_RADIUS - margin
