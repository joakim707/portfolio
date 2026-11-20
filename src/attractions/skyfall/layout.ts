import type { RideConfig } from '@/core/rides/types'

/**
 * SKYFALL 3000 — layout in the zone's local frame:
 * origin = plot centre (the mast), +Z = towards the central plaza
 * (entrance arch at z = 22).
 */

export const MAST_HEIGHT = 72
export const MAST_HALF = 1.6
export const DECK_RADIUS = 6.5
export const DECK_Y = 0.3
/** Seats around the gondola, facing outward; seat 0 faces the plaza (+Z). */
export const SEAT_COUNT = 12
export const SEAT_RADIUS = 3.1
/** Hip height of the seats when the gondola is in the station. */
export const STATION_Y = DECK_Y + 0.6
export const TOP_Y = 62
/** Free fall ends here, magnetic brakes take over. */
export const BRAKE_Y = 22
/** End of the brake fins: from here the gondola is lowered gently to the station. */
export const BRAKE_END_Y = 5
export const FENCE_RADIUS = 4.4

const G = 9.81

export interface DropPhase {
  y: number
  /** Vertical speed (m/s, negative when falling). */
  v: number
  /** Gondola rotation around the mast (rad). */
  rot: number
  phase: 'ascent' | 'pause' | 'fall' | 'brake' | 'done'
}

/**
 * Deterministic ride profile as a pure function of time:
 *  1. ascent: eased climb with one full panoramic turn of the gondola;
 *  2. pause at the top (suspense);
 *  3. free fall under real gravity: y = top − ½ g t²;
 *  4. magnetic brakes: constant deceleration down to a slow speed.
 */
export const PROFILE = (() => {
  const ascent = 20
  const pause = 3.5
  const fallDist = TOP_Y - BRAKE_Y
  const fall = Math.sqrt((2 * fallDist) / G)
  const vFall = G * fall
  const vEnd = 2
  const brakeDist = BRAKE_Y - BRAKE_END_Y
  const decel = (vFall * vFall - vEnd * vEnd) / (2 * brakeDist)
  const brake = (vFall - vEnd) / decel
  return { ascent, pause, fall, vFall, vEnd, decel, brake, total: ascent + pause + fall + brake }
})()

const smooth = (k: number) => k * k * (3 - 2 * k)
const smoothD = (k: number) => 6 * k * (1 - k)

export function dropProfile(t: number, out: DropPhase): DropPhase {
  const P = PROFILE
  if (t < P.ascent) {
    const k = Math.max(0, t / P.ascent)
    out.y = STATION_Y + (TOP_Y - STATION_Y) * smooth(k)
    out.v = ((TOP_Y - STATION_Y) * smoothD(k)) / P.ascent
    out.rot = 2 * Math.PI * smooth(k)
    out.phase = 'ascent'
    return out
  }
  out.rot = 0 // a full turn: facing the plaza again
  t -= P.ascent
  if (t < P.pause) {
    out.y = TOP_Y
    out.v = 0
    out.phase = 'pause'
    return out
  }
  t -= P.pause
  if (t < P.fall) {
    out.y = TOP_Y - 0.5 * G * t * t
    out.v = -G * t
    out.phase = 'fall'
    return out
  }
  t -= P.fall
  if (t < P.brake) {
    out.y = BRAKE_Y - (P.vFall * t - 0.5 * P.decel * t * t)
    out.v = -(P.vFall - P.decel * t)
    out.phase = 'brake'
    return out
  }
  out.y = BRAKE_END_Y
  out.v = -P.vEnd
  out.phase = 'done'
  return out
}

export const SKYFALL_CONFIG: RideConfig = {
  timings: { restraints: 2.8, starting: 3.5, braking: 3.5, unboarding: 2, interrupted: 1.2 },
  playerSeat: 0,
  // in front of seat 0, outside the safety fence, facing the gondola (−Z)
  platform: { position: [0, DECK_Y, FENCE_RADIUS + 0.6], yaw: 0 },
  exit: { position: [4.5, 0, 12], yaw: Math.PI },
  boarding: { position: [0, 0, 9], radius: 4.5 },
  eyeOffset: [0, 0.78, -0.08],
  stationCamera: { position: [5.5, 3.2, 10.5], target: [0, 1.6, SEAT_RADIUS] },
  // the "vehicle" framed by the chase camera is the player's seat: film it from the front, tower behind
  chaseOffset: [0, 2.2, -9],
  cinematicShots: [
    [7, 1.6, 9], // foot of the tower, looking up
    [16, 18, 10], // lower third
    [15, 40, -8], // upper third, other side
    [9, 66, 9], // level with the top
    [-12, 30, 12], // fall, from the side
    [0, 3, 20], // from the entrance arch
  ],
  idleCycleEvery: 25,
}
