import { Vector3 } from 'three'
import { TrackBuilder, buildTrack, type Track } from '@/attractions/_shared/coaster/track'
import type { RideConfig } from '@/core/rides/types'

/**
 * THE PREDICTOR — layout in the zone's local frame:
 * origin = plot centre, +Z = towards the central plaza (entrance arch at z = 42).
 *
 * Circuit (counter-clockwise from above):
 *  station (south, eastbound) → banked turn → chain lift up the east side
 *  → crest turn → steep first drop along the north side → loop #1
 *  → banked turn → corkscrew + loop #2 down the west side
 *  → lit tunnel → turn → brake run → station.
 */

export const STATION_Z = 30
export const STATION_START_X = -15
export const STATION_LENGTH = 24
export const RAIL_Y = 1.0
/** Front car stop mark, measured from the start of the station straight. */
export const STATION_S = 18
export const CARS = 5

/**
 * Kenney Coaster Kit cars (coaster-train-front / coaster-train), measured on a
 * 0.1-unit grid: two single-file seats per car, cushion at y 0.37, backrest
 * faces at z −0.24 / +0.36, wheels at x ±0.28, cars coupled every 1.32 units.
 * ×2.2 gives a 46 cm deep seat and a 1.54 m wide car for our 1.8 m visitor.
 */
export const KENNEY_SCALE = 2.2
/** Hip points (metres, car space): front row, then back row. */
export const SEATS: [number, number, number][] = [
  [0, 0.42 * KENNEY_SCALE, -0.3 * KENNEY_SCALE],
  [0, 0.42 * KENNEY_SCALE, 0.3 * KENNEY_SCALE],
]
export const CAR_SPACING = 1.32 * KENNEY_SCALE
/** Half gauge matching the model's wheels. */
export const GAUGE = 0.28 * KENNEY_SCALE
/** The player's seat sits this far ahead of the front car's origin. */
const SEAT_AHEAD = -SEATS[0][2]

const PI2 = Math.PI / 2
/** Tuning lengths so the final turn lines up with the station (checked by analysis). */
const WEST_A = 2
const WEST_B = 0

export function buildPredictorTrack(): Track {
  const b = new TrackBuilder(new Vector3(STATION_START_X, RAIL_Y, STATION_Z), 0)
  b.straight(STATION_LENGTH, 0, 'station')
    .turn(7, PI2, 0.6, 'turn', 0.2)
    .slope(39, 45, 10, 8, 'lift') // ~39 m chain lift at 45°
    .turn(6, PI2, 0.6, 'turn', 0) // crest, heading west
    .slope(-40.2, 68, 6, 11, 'drop') // first drop: 68°, 11 m pull-out radius at the bottom
    .loop(9.5, 4) // loop #1
    .straight(2.5, 0, 'flat')
    .turn(7.5, PI2, 0, 'turn', 1.05) // overbanked turn, heading south
    .straight(WEST_A, 0, 'flat')
    .loop(6.5, 2.5) // loop #2, taken while the train still carries its speed
    .straight(7, 2, 'flat')
    .corkscrew(15, 0)
    .straight(6, -2, 'flat')
    .dip(12, 0.4, 'tunnel') // lit tunnel at ground level
    .straight(WEST_B, 0, 'tunnel')
    .turn(6, PI2, 0, 'turn', 0.7) // heading east, onto the brake run
  b.close('brake')
  return buildTrack(b.samples, 1600)
}

export const PREDICTOR_CONFIG: RideConfig = {
  timings: { restraints: 2.8, starting: 4, braking: 4.5, unboarding: 2, interrupted: 1.2 },
  playerSeat: 0,
  // front car centre stops at x = STATION_START_X + STATION_S; seat 0 is on the platform (+z) side
  platform: { position: [STATION_START_X + STATION_S + SEAT_AHEAD, 0.35, STATION_Z + 2.1], yaw: 0 },
  exit: { position: [6, 0, 39], yaw: Math.PI },
  boarding: { position: [0, 0, 36], radius: 6 },
  eyeOffset: [0, 0.78, -0.08],
  stationCamera: { position: [STATION_START_X + STATION_S - 4, 3.2, STATION_Z + 6.5], target: [STATION_START_X + STATION_S + SEAT_AHEAD, 1.4, STATION_Z] },
  // high and far enough to clear the four cars behind the front car
  chaseOffset: [0, 5, 11],
  cinematicShots: [
    [14, 3, 37], // leaving the station
    [25, 4, 14], // foot of the lift
    [24, 44, -18], // crest of the lift
    [2, 5, -17], // first drop, from the side
    [-8, 9, -15], // loop #1
    [-16, 3, -11], // overbanked turn / loop #2
    [-16, 4, 1], // corkscrew
    [-19, 3, 9], // tunnel entrance
    [-30, 4, 33], // tunnel exit and brake run
  ],
  idleCycleEvery: 30,
}
