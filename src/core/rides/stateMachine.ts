import type { RidePhaseTimings, RideState } from './types'

export type RideEvent =
  | { type: 'BOARD' } // player pressed E at the boarding zone
  | { type: 'SEATED' } // boarding animation finished
  | { type: 'RUN_FINISHED' } // simulation reports end of the ride sequence
  | { type: 'INTERRUPT' } // player asked to leave
  | { type: 'ACKNOWLEDGE' } // player closed the end-of-ride panel

type Listener = (next: RideState, prev: RideState) => void

/** States in which the player is aboard (movement controls are taken over). */
export const PASSENGER_STATES: ReadonlySet<RideState> = new Set<RideState>([
  'BOARDING',
  'RESTRAINTS',
  'STARTING',
  'RUNNING',
  'BRAKING',
  'INTERRUPTED',
])

/**
 * Framework-free ride state machine. Timed phases advance in tick(),
 * the others advance on events. Every path leads back to IDLE, so a ride
 * can always be replayed and never leaves the player stuck.
 */
export class RideStateMachine {
  private _state: RideState = 'IDLE'
  private _time = 0
  private readonly listeners = new Set<Listener>()
  private readonly timings: RidePhaseTimings

  constructor(timings: RidePhaseTimings) {
    this.timings = timings
  }

  get state() {
    return this._state
  }
  /** Seconds since the current state was entered. */
  get stateTime() {
    return this._time
  }
  get hasPassenger() {
    return PASSENGER_STATES.has(this._state)
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  send(event: RideEvent): boolean {
    const s = this._state
    switch (event.type) {
      case 'BOARD':
        return s === 'IDLE' ? this.go('BOARDING') : false
      case 'SEATED':
        return s === 'BOARDING' ? this.go('RESTRAINTS') : false
      case 'RUN_FINISHED':
        return s === 'RUNNING' ? this.go('BRAKING') : false
      case 'INTERRUPT':
        return this.hasPassenger && s !== 'INTERRUPTED' ? this.go('INTERRUPTED') : false
      case 'ACKNOWLEDGE':
        return s === 'COMPLETED' ? this.go('IDLE') : false
    }
  }

  tick(dt: number) {
    this._time += dt
    const t = this.timings
    switch (this._state) {
      case 'RESTRAINTS':
        if (this._time >= t.restraints) this.go('STARTING')
        break
      case 'STARTING':
        if (this._time >= t.starting) this.go('RUNNING')
        break
      case 'BRAKING':
        if (this._time >= t.braking) this.go('UNBOARDING')
        break
      case 'INTERRUPTED':
        if (this._time >= t.interrupted) this.go('UNBOARDING')
        break
      case 'UNBOARDING':
        if (this._time >= t.unboarding) this.go('COMPLETED')
        break
      default:
        break
    }
  }

  /** Hard reset (e.g. when the ride unmounts mid-run). */
  reset() {
    if (this._state !== 'IDLE') this.go('IDLE')
  }

  private go(next: RideState) {
    const prev = this._state
    this._state = next
    this._time = 0
    this.listeners.forEach((fn) => fn(next, prev))
    return true
  }
}
