import type { Object3D } from 'three'

/**
 * Universal ride lifecycle, shared by every attraction.
 *
 * IDLE → BOARDING → RESTRAINTS → STARTING → RUNNING → BRAKING → UNBOARDING → COMPLETED → IDLE
 *
 * INTERRUPTED can be entered from any state while a passenger is aboard; it
 * always resolves to UNBOARDING so the player is restored cleanly.
 */
export const RIDE_STATES = [
  'IDLE',
  'BOARDING',
  'RESTRAINTS',
  'STARTING',
  'RUNNING',
  'BRAKING',
  'UNBOARDING',
  'COMPLETED',
  'INTERRUPTED',
] as const
export type RideState = (typeof RIDE_STATES)[number]

/** open = rideable once its module exists, construction = visible but closed. */
export type RideStatus = 'open' | 'construction'

export type RideKind =
  | 'coaster'
  | 'pendulum'
  | 'dark-ride'
  | 'drop-tower'
  | 'laser-ride'
  | 'swing-boat'
  | 'flying-coaster'
  | 'water-ride'

export type CameraMode = 'pov' | 'chase' | 'cinematic'

/**
 * Seconds spent in each timed phase. RUNNING is owned by the simulation
 * (it reports when the sequence is finished); BOARDING and COMPLETED wait
 * for events, so they are not listed here.
 */
export interface RidePhaseTimings {
  restraints: number
  starting: number
  braking: number
  unboarding: number
  interrupted: number
}

export const DEFAULT_TIMINGS: RidePhaseTimings = {
  restraints: 2.5,
  starting: 3.5,
  braking: 3.5,
  unboarding: 2,
  interrupted: 1.2,
}

/**
 * Contract every ride simulation implements.
 * Simulations are deterministic and kinematic: given the state and the time
 * spent in it they compute vehicle transforms — no physics engine involved.
 * `root` holds everything the simulation moves; the generic <Ride> adds it to
 * the zone, so its transforms are in the zone's local frame.
 */
export interface RideSimulation {
  readonly root: Object3D
  /**
   * Advance mechanics. `ghost` is true for automatic empty cycles in IDLE.
   * Return true from RUNNING once the ride sequence is over (→ BRAKING).
   */
  update(state: RideState, stateTime: number, dt: number, ghost: boolean): boolean | void
  /**
   * Seat the passenger rides in. Convention: origin = hip point on the seat
   * cushion, -Z = where the passenger faces, +Y = the passenger's up.
   */
  getSeat(index: number): Object3D | null
  /** Every passenger seat of the ride (all cars / rows), for NPC riders. */
  getAllSeats?(): Object3D[]
  /** Main vehicle body, framed by the chase and cinematic cameras. */
  getVehicle(): Object3D
  /** False while the vehicle is away from the station (e.g. an empty cycle). */
  canBoard?(): boolean
  /** Instantly park the vehicles back in the station (after an interruption). */
  resetToStation(): void
  /** Current vehicle speed in m/s (drives FOV / speed effects). */
  getSpeed?(): number
  /** 0..1 vibration intensity; the camera rig scales it with the comfort settings. */
  getShake?(): number
  dispose?(): void
}

/** Static description of a ride's boarding layout and cameras, in the zone's local frame. */
export interface RideConfig {
  timings?: Partial<RidePhaseTimings>
  /** Seat index used by the player. */
  playerSeat: number
  /** Where the visitor stands on the platform right before sitting down (feet). */
  platform: { position: [number, number, number]; yaw: number }
  /** Where the visitor is released after the ride (feet, on walkable ground). */
  exit: { position: [number, number, number]; yaw: number }
  /** Extra E-prompt area at the queue / platform (the entrance arch always works). */
  boarding?: { position: [number, number, number]; radius: number }
  /** Eye position in seat space for the POV camera. */
  eyeOffset?: [number, number, number]
  /** Fixed shot used while boarding / unboarding. */
  stationCamera: { position: [number, number, number]; target: [number, number, number] }
  /** Chase camera offset in the vehicle frame (+Z = behind, +Y = above). */
  chaseOffset?: [number, number, number]
  /** Candidate positions for the cinematic camera. */
  cinematicShots: [number, number, number][]
  /** Run an empty demo cycle after this many idle seconds (0 = never). */
  idleCycleEvery?: number
}
