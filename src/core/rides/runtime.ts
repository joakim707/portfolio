import { Euler, Matrix4, Object3D, Quaternion, Vector3 } from 'three'
import type { AttractionId } from '@/data/attractions'
import { useGameStore } from '@/core/store/useGameStore'
import { RideStateMachine, PASSENGER_STATES } from './stateMachine'
import { clamp01, smoothstep } from './motion'
import { DEFAULT_TIMINGS, type RideConfig, type RidePhaseTimings, type RideSimulation, type RideState } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Bridges to the player rig and the screen fader (set by those components).
// ─────────────────────────────────────────────────────────────────────────────

export interface PlayerBridge {
  /** World position of the visitor's feet and facing yaw right now. */
  getPose(outFeet: Vector3): number
  /** Take the visitor out of the physics world (no collisions, no input). */
  capture(): void
  /** Give control back, standing at `feet` facing `yaw` (world). */
  release(feet: Vector3, yaw: number): void
}
export const playerBridge: { current: PlayerBridge | null } = { current: null }

let fadeEl: HTMLElement | null = null
let fadeValue = 0
export function registerFader(el: HTMLElement | null) {
  fadeEl = el
}
function setFade(v: number) {
  if (Math.abs(v - fadeValue) < 0.002) return
  fadeValue = v
  if (fadeEl) fadeEl.style.opacity = String(v)
}

/** All mounted rides, by attraction id. */
export const rideRuntimes = new Map<AttractionId, RideRuntime>()

// ─────────────────────────────────────────────────────────────────────────────

/**
 * How far the avatar's origin sits below the seat's hip point when seated.
 * Set by the avatar component (each model has its own seated pose).
 */
export const avatarMetrics = { seatDrop: 0.9 }

/** How the avatar is driven this frame. 'free' = the player rig owns it. */
export type PassengerMode = 'free' | 'standing' | 'walking' | 'seated'

const BOARD = { fadeOut: 0.35, swap: 0.45, fadeIn: 0.8, sitStart: 0.85, end: 1.9 }
const UNBOARD = { standEnd: 0.9, fadeOut: 1.25, release: 1.25, fadeIn: 1.6 }
const INTERRUPT = { fadeOut: 0.35, reset: 0.4, fadeIn: 0.75 }

const tmpV = new Vector3()
const tmpQ = new Quaternion()
const tmpS = new Vector3()
const UP = new Vector3(0, 1, 0)

/**
 * Framework-free runtime of one attraction: state machine, empty demo cycles,
 * the boarding / unboarding choreography and the passenger transform.
 * The same class drives every ride; only the RideSimulation differs.
 */
export class RideRuntime {
  readonly sm: RideStateMachine
  readonly timings: RidePhaseTimings
  readonly id: AttractionId
  readonly config: RideConfig
  readonly sim: RideSimulation
  /** Group in the zone's local frame; world transforms of config points derive from it. */
  readonly zone: Object3D

  /** Empty cycle running while IDLE. */
  readonly ghost = { active: false, state: 'RUNNING' as RideState, t: 0 }
  private idleTime = 0
  private resetDone = false
  private released = true
  interrupted = false

  /** Avatar transform (feet origin) while the ride owns the visitor. */
  readonly passengerMatrix = new Matrix4()
  passengerMode: PassengerMode = 'free'
  /** Who drives the camera, and which shot when the ride does. */
  cameraOwner: 'player' | 'ride' = 'player'
  cameraShot: 'station' | 'onboard' = 'station'

  private readonly boardFrom = { pos: new Vector3(), quat: new Quaternion() }
  private readonly unsubscribe: () => void

  constructor(id: AttractionId, config: RideConfig, sim: RideSimulation, zone: Object3D) {
    this.id = id
    this.config = config
    this.sim = sim
    this.zone = zone
    this.timings = { ...DEFAULT_TIMINGS, ...config.timings }
    // UNBOARDING must leave time for the walk-out + fade choreography.
    this.timings.unboarding = Math.max(this.timings.unboarding, UNBOARD.fadeIn + 0.1)
    this.timings.interrupted = Math.max(this.timings.interrupted, INTERRUPT.fadeIn + 0.35)
    this.sm = new RideStateMachine(this.timings)
    this.unsubscribe = this.sm.subscribe((next) => this.onStateChange(next))
  }

  // ── queries ───────────────────────────────────────────────────────────────

  get state() {
    return this.sm.state
  }
  get hasPassenger() {
    return PASSENGER_STATES.has(this.sm.state) || this.sm.state === 'UNBOARDING'
  }
  canBoard() {
    return this.sm.state === 'IDLE' && !this.ghost.active && (this.sim.canBoard?.() ?? true)
  }
  /** World position of the boarding area, if the ride defines one. */
  boardingPoint(out: Vector3) {
    const b = this.config.boarding
    if (!b) return null
    return this.zone.localToWorld(out.set(...b.position))
  }
  /** World pose (feet + yaw) of a local config point. */
  worldPose(local: { position: [number, number, number]; yaw: number }, outFeet: Vector3) {
    this.zone.updateWorldMatrix(true, false)
    this.zone.localToWorld(outFeet.set(...local.position))
    this.zone.matrixWorld.decompose(tmpV, tmpQ, tmpS)
    const zoneYaw = new Euler().setFromQuaternion(tmpQ, 'YXZ').y
    return local.yaw + zoneYaw
  }

  // ── commands ──────────────────────────────────────────────────────────────

  requestBoard(): boolean {
    const store = useGameStore.getState()
    const player = playerBridge.current
    if (!player || store.activeRide || !this.canBoard()) return false
    const yaw = player.getPose(this.boardFrom.pos)
    this.boardFrom.quat.setFromAxisAngle(UP, yaw)
    player.capture()
    this.released = false
    this.interrupted = false
    this.passengerMode = 'standing'
    this.composePassenger(this.boardFrom.pos, this.boardFrom.quat)
    this.sm.send({ type: 'BOARD' })
    store.setActiveRide({ id: this.id, state: 'BOARDING', interrupted: false })
    store.setPhase('riding')
    return true
  }

  requestInterrupt() {
    if (this.sm.state === 'BOARDING' && this.sm.stateTime < BOARD.swap) {
      // not seated yet: just cancel on the spot
      this.interrupted = true
      this.releasePlayerAt(this.boardFrom.pos, new Euler().setFromQuaternion(this.boardFrom.quat, 'YXZ').y)
      this.finish()
      return
    }
    if (this.sm.send({ type: 'INTERRUPT' })) {
      this.interrupted = true
      const store = useGameStore.getState()
      if (store.activeRide?.id === this.id) store.setActiveRide({ ...store.activeRide, interrupted: true })
    }
  }

  /** Close the end-of-ride panel; optionally board again straight away. */
  acknowledge(replay = false) {
    if (this.sm.state === 'COMPLETED') this.sm.send({ type: 'ACKNOWLEDGE' })
    this.finish()
    if (replay) this.requestBoard()
  }

  // ── per-frame update (called by <Ride> before the player rig) ─────────────

  update(dt: number) {
    const phase = useGameStore.getState().phase
    if (phase === 'paused' || phase === 'loading') return // the whole ride freezes in pause

    const sm = this.sm
    if (sm.state === 'IDLE') {
      this.updateIdle(dt)
    } else {
      sm.tick(dt)
      const st = sm.state
      const t = sm.stateTime
      if (st === 'INTERRUPTED' && !this.resetDone && t >= INTERRUPT.reset) {
        this.resetDone = true
        this.sim.resetToStation()
      }
      const done = this.sim.update(st, t, dt, false)
      if (st === 'RUNNING' && done) sm.send({ type: 'RUN_FINISHED' })
      if (st === 'BOARDING' && t >= BOARD.end) sm.send({ type: 'SEATED' })
      if (st === 'UNBOARDING' && !this.released && t >= UNBOARD.release) {
        const feet = new Vector3()
        const yaw = this.worldPose(this.config.exit, feet)
        this.releasePlayerAt(feet, yaw)
      }
    }
    this.updatePassenger()
  }

  private updateIdle(dt: number) {
    const g = this.ghost
    if (g.active) {
      g.t += dt
      const done = this.sim.update(g.state, g.t, dt, true)
      if (g.state === 'RUNNING' && done) {
        g.state = 'BRAKING'
        g.t = 0
      } else if (g.state === 'BRAKING' && g.t >= this.timings.braking) {
        g.active = false
        this.idleTime = 0
        this.sim.resetToStation()
      }
      return
    }
    this.idleTime += dt
    this.sim.update('IDLE', this.idleTime, dt, false)
    const every = this.config.idleCycleEvery ?? 0
    // only cycle while nobody is about to board
    if (every > 0 && this.idleTime > every && useGameStore.getState().nearZone !== this.id) {
      g.active = true
      g.state = 'RUNNING'
      g.t = 0
    }
  }

  // ── passenger choreography ────────────────────────────────────────────────

  private seatPose(outPos: Vector3, outQuat: Quaternion) {
    const seat = this.sim.getSeat(this.config.playerSeat)
    if (!seat) return false
    seat.updateWorldMatrix(true, false)
    seat.matrixWorld.decompose(outPos, outQuat, tmpS)
    // feet origin: drop by the hip height along the seat's up axis
    outPos.addScaledVector(tmpV.set(0, 1, 0).applyQuaternion(outQuat), -avatarMetrics.seatDrop)
    return true
  }

  private platformPose(outPos: Vector3, outQuat: Quaternion) {
    const yaw = this.worldPose(this.config.platform, outPos)
    outQuat.setFromAxisAngle(UP, yaw)
  }

  private composePassenger(pos: Vector3, quat: Quaternion) {
    this.passengerMatrix.compose(pos, quat, tmpS.set(1, 1, 1))
  }

  private readonly a = { pos: new Vector3(), quat: new Quaternion() }
  private readonly b = { pos: new Vector3(), quat: new Quaternion() }

  /** Blend between the platform and the seat (k = 0 platform, 1 seated). */
  private blendPlatformSeat(k: number) {
    this.platformPose(this.a.pos, this.a.quat)
    this.seatPose(this.b.pos, this.b.quat)
    this.composePassenger(this.a.pos.lerp(this.b.pos, k), this.a.quat.slerp(this.b.quat, k))
    this.passengerMode = k > 0.75 ? 'seated' : 'walking'
  }

  private updatePassenger() {
    const st = this.sm.state
    const t = this.sm.stateTime
    let fade = 0
    if (this.released || st === 'IDLE' || st === 'COMPLETED') {
      this.passengerMode = 'free'
      this.cameraOwner = 'player'
      // after the hand-off, finish fading the park back in
      if (st === 'UNBOARDING') setFade(1 - clamp01((t - UNBOARD.release) / (UNBOARD.fadeIn - UNBOARD.release)))
      return
    }
    switch (st) {
      case 'BOARDING':
        if (t < BOARD.swap) {
          fade = clamp01(t / BOARD.fadeOut)
          this.passengerMode = 'standing'
          this.cameraOwner = 'player'
        } else {
          fade = 1 - clamp01((t - BOARD.swap) / (BOARD.fadeIn - BOARD.swap))
          this.blendPlatformSeat(smoothstep(BOARD.sitStart, BOARD.end - 0.1, t))
          this.cameraOwner = 'ride'
          this.cameraShot = 'station'
        }
        break
      case 'INTERRUPTED':
        fade = t < INTERRUPT.reset ? clamp01(t / INTERRUPT.fadeOut) : 1 - clamp01((t - INTERRUPT.reset) / (INTERRUPT.fadeIn - INTERRUPT.reset))
        this.blendPlatformSeat(1)
        this.cameraOwner = 'ride'
        this.cameraShot = t < INTERRUPT.reset ? 'onboard' : 'station'
        break
      case 'UNBOARDING':
        fade = clamp01((t - UNBOARD.standEnd) / (UNBOARD.fadeOut - UNBOARD.standEnd))
        this.blendPlatformSeat(1 - smoothstep(0.15, UNBOARD.standEnd, t))
        this.cameraOwner = 'ride'
        this.cameraShot = 'station'
        break
      default: // RESTRAINTS, STARTING, RUNNING, BRAKING
        this.blendPlatformSeat(1)
        this.cameraOwner = 'ride'
        this.cameraShot = st === 'RESTRAINTS' && t < 0.6 ? 'station' : 'onboard'
    }
    setFade(fade)
  }

  private releasePlayerAt(feet: Vector3, yaw: number) {
    if (this.released) return
    this.released = true
    this.passengerMode = 'free'
    this.cameraOwner = 'player'
    playerBridge.current?.release(feet, yaw)
  }

  // ── state bookkeeping ─────────────────────────────────────────────────────

  private onStateChange(next: RideState) {
    if (next === 'INTERRUPTED') this.resetDone = false
    const store = useGameStore.getState()
    if (store.activeRide?.id !== this.id) return
    store.setActiveRide({ ...store.activeRide, state: next })
    if (next === 'COMPLETED') {
      setFade(0)
      if (this.interrupted) {
        // leaving early: no panel, straight back to the park
        this.sm.send({ type: 'ACKNOWLEDGE' })
        this.finish()
      } else {
        store.markVisited(this.id)
        document.exitPointerLock?.() // the end-of-ride panel needs the cursor
      }
    }
  }

  /** Back to exploration; safe to call more than once. */
  private finish() {
    const store = useGameStore.getState()
    if (store.activeRide?.id === this.id) {
      store.setActiveRide(null)
      if (store.phase === 'riding' || (store.phase === 'paused' && store.pausedFrom === 'riding')) store.setPhase('explore')
    }
    if (this.sm.state !== 'IDLE') this.sm.reset()
    this.passengerMode = 'free'
    this.cameraOwner = 'player'
    this.idleTime = 0
    setFade(0)
  }

  /** Unmount: never leave the visitor stuck inside a ride that no longer exists. */
  dispose() {
    if (!this.released && this.sm.state !== 'IDLE') {
      const feet = new Vector3()
      const yaw = this.worldPose(this.config.exit, feet)
      this.releasePlayerAt(feet, yaw)
    }
    this.finish()
    this.unsubscribe()
    this.sim.dispose?.()
  }
}

// Dev-only handle for automated browser tests.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { __rides?: typeof rideRuntimes }).__rides = rideRuntimes
}
