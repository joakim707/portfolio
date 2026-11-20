import { smoothstep } from '@/core/rides/motion'
import type { RideConfig } from '@/core/rides/types'

/**
 * THE TITAN SWING — layout in the zone's local frame:
 * origin = plot centre, +Z = towards the central plaza (entrance arch at z = 26).
 * The boat's long axis is X: it swings in the XY plane around an axle along Z
 * carried by two A-frames at z = ±FRAME_Z.
 */

export const PIVOT_Y = 16
export const FRAME_Z = 3.4
export const FRAME_SPREAD = 10.5
/** Boat floor at rest sits ARM below the axle (≈ 1 m above the ground). */
export const ARM = 15
export const BOAT_HALF_LENGTH = 9.6
export const BOAT_HALF_WIDTH = 2.5

/** Rows of seats (x along the boat) with their floor height in the boat frame (origin = axle). */
export const ROWS: { x: number; floor: number }[] = [
  { x: 6.5, floor: -13.4 },
  { x: 4.5, floor: -14.3 },
  { x: 2.6, floor: -15 },
  { x: -2.6, floor: -15 },
  { x: -4.5, floor: -14.3 },
  { x: -6.5, floor: -13.4 },
]
export const SEATS_PER_ROW = 4
export const SEAT_Z = [1.65, 0.55, -0.55, -1.65]
export const HIP_ABOVE_FLOOR = 0.55
/** Deck of the raised loading bridge by the last row (seat hip at rest ≈ 3.15 m). */
export const BRIDGE_Y = 2.4

// ── motion: θ(t) = A · envelope(t) · sin(ωt) ─────────────────────────────────

export const SWING = {
  maxAngle: (75 * Math.PI) / 180,
  period: 7,
  run: 38,
  rampUp: 16,
  rampDown: 12,
  /** Amplitude left (fraction of max) when the friction wheels take over. */
  endFraction: 0.12,
  brake: 4.5,
}
const OMEGA = (2 * Math.PI) / SWING.period

/** Progressive amplitude envelope: 0 → 1 (rampUp), hold, then down to endFraction. */
export function swingEnvelope(t: number) {
  const S = SWING
  const up = smoothstep(0, S.rampUp, t)
  const down = 1 - (1 - S.endFraction) * smoothstep(S.run - S.rampDown, S.run, t)
  return Math.min(up, down)
}

/** Boat angle during RUNNING (rad, positive = boat swung towards +X... rotation about +Z). */
export const swingAngle = (t: number) => SWING.maxAngle * swingEnvelope(t) * Math.sin(OMEGA * t)

/** During BRAKING the same oscillation carries on while the friction wheels damp it to rest. */
export const brakeAngle = (t: number) =>
  SWING.maxAngle * SWING.endFraction * (1 - smoothstep(0, SWING.brake, t)) * Math.sin(OMEGA * (SWING.run + t))

export const TITAN_CONFIG: RideConfig = {
  timings: { restraints: 2.5, starting: 3.5, braking: SWING.brake, unboarding: 2, interrupted: 1.2 },
  playerSeat: 0,
  // raised loading bridge beside the last row (the visitor sits facing the boat centre, −X)
  platform: { position: [6.5, BRIDGE_Y, 3.6], yaw: 0 },
  exit: { position: [-5, 0, 10], yaw: Math.PI },
  boarding: { position: [0, 0, 9], radius: 5 },
  eyeOffset: [0, 0.78, -0.08],
  stationCamera: { position: [13, 5.5, 12], target: [5, 3, 1.5] },
  // vehicle = the player's seat; high enough to look over the stern cap behind the last row
  chaseOffset: [0, 6.5, 6],
  cinematicShots: [
    [0, 6, 22], // broadside, from the plaza side
    [21, 3, 9], // low, at the end of the swing
    [-21, 3, 9],
    [0, 23, 6], // above the axle
    [13, 17, -12], // high, behind the frames
  ],
  idleCycleEvery: 30,
}
