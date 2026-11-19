import { Euler, MathUtils, PerspectiveCamera, Quaternion, Vector3 } from 'three'
import type { ComfortSettings } from '@/core/store/useGameStore'
import type { RideRuntime } from './runtime'
import type { CameraMode } from './types'

const BASE_FOV = 55
const BASE_NEAR = 0.5
const POV_NEAR = 0.05
const DEFAULT_EYE: [number, number, number] = [0, 0.78, -0.08]
const DEFAULT_CHASE: [number, number, number] = [0, 2.6, 7.5]
const LOOK_LIMIT = { yaw: 1.75, pitchUp: 0.85, pitchDown: -1.0 }
const RECENTER_AFTER = 2.5 // s without mouse input

const damp = (a: number, b: number, lambda: number, dt: number) => MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt))
const WORLD_UP = new Vector3(0, 1, 0)

/**
 * On-board camera system shared by every ride:
 * - pov: rigidly attached to the seat (follows every translation/rotation,
 *   loops included), with limited free-look and slow auto-recentering;
 * - chase: follows the vehicle from behind in its own frame, smoothed;
 * - cinematic: cuts between fixed vantage points, always framing the vehicle;
 * - station: fixed shot used while (un)boarding.
 */
export class RideCameraRig {
  private lookYaw = 0
  private lookPitch = 0
  private idleLook = 0
  private shotIndex = -1
  private shotTime = 0
  private fov = BASE_FOV
  private t = 0
  private active = false
  private lastMode: CameraMode | 'station' | null = null
  private readonly pos = new Vector3()
  private readonly lookAt = new Vector3()
  private readonly up = new Vector3(0, 1, 0)
  private readonly v = new Vector3()
  private readonly q = new Quaternion()
  private readonly e = new Euler(0, 0, 0, 'YXZ')

  get isActive() {
    return this.active
  }

  /** Mouse free-look (POV only). */
  look(dx: number, dy: number, sensitivity: number) {
    this.lookYaw = MathUtils.clamp(this.lookYaw - dx * sensitivity, -LOOK_LIMIT.yaw, LOOK_LIMIT.yaw)
    this.lookPitch = MathUtils.clamp(this.lookPitch - dy * sensitivity, LOOK_LIMIT.pitchDown, LOOK_LIMIT.pitchUp)
    this.idleLook = 0
  }

  update(camera: PerspectiveCamera, ride: RideRuntime, mode: CameraMode, comfort: ComfortSettings, dt: number) {
    this.t += dt
    const shot = ride.cameraShot === 'station' ? 'station' : mode
    const cut = !this.active || shot !== this.lastMode
    this.active = true
    this.lastMode = shot
    const reduceFx = comfort.reduceCameraFx
    const speed = ride.sim.getSpeed?.() ?? 0
    const shake = (ride.sim.getShake?.() ?? 0) * (comfort.reduceShake ? 0.15 : 1) * (reduceFx ? 0.5 : 1)
    let targetFov = BASE_FOV
    let near = BASE_NEAR

    if (shot === 'station') {
      const c = ride.config.stationCamera
      ride.zone.localToWorld(camera.position.set(...c.position))
      camera.up.copy(WORLD_UP)
      camera.lookAt(ride.zone.localToWorld(this.v.set(...c.target)))
    } else if (shot === 'pov') {
      const seat = ride.sim.getSeat(ride.config.playerSeat)
      if (seat) {
        seat.updateWorldMatrix(true, false)
        seat.localToWorld(camera.position.set(...(ride.config.eyeOffset ?? DEFAULT_EYE)))
        // slowly bring the gaze back forward when the mouse is idle
        this.idleLook += dt
        if (this.idleLook > RECENTER_AFTER) {
          this.lookYaw = damp(this.lookYaw, 0, 1.2, dt)
          this.lookPitch = damp(this.lookPitch, 0, 1.2, dt)
        }
        seat.getWorldQuaternion(this.q)
        camera.quaternion.copy(this.q).multiply(new Quaternion().setFromEuler(this.e.set(this.lookPitch, this.lookYaw, 0)))
        camera.up.set(0, 1, 0).applyQuaternion(this.q)
        this.applyShake(camera, shake, 0.025)
        near = POV_NEAR
        if (!reduceFx) targetFov += Math.min(speed * 0.55, 14)
      }
    } else if (shot === 'chase') {
      const vehicle = ride.sim.getVehicle()
      vehicle.updateWorldMatrix(true, false)
      const desired = vehicle.localToWorld(this.v.set(...(ride.config.chaseOffset ?? DEFAULT_CHASE)))
      vehicle.getWorldQuaternion(this.q)
      const vehicleUp = new Vector3(0, 1, 0).applyQuaternion(this.q)
      if (cut) {
        this.pos.copy(desired)
        this.up.copy(WORLD_UP)
      }
      const k = reduceFx ? 14 : 6
      this.pos.set(damp(this.pos.x, desired.x, k, dt), damp(this.pos.y, desired.y, k, dt), damp(this.pos.z, desired.z, k, dt))
      if (this.pos.y < 0.6) this.pos.y = 0.6
      // lean with the vehicle a little, but stay readable upside-down
      this.up.lerp(vehicleUp.lerp(WORLD_UP, 0.6), 1 - Math.exp(-4 * dt)).normalize()
      camera.position.copy(this.pos)
      camera.up.copy(this.up)
      vehicle.getWorldPosition(this.lookAt).addScaledVector(vehicleUp, 0.8)
      camera.lookAt(this.lookAt)
      this.applyShake(camera, shake, 0.04)
      if (!reduceFx) targetFov += Math.min(speed * 0.35, 9)
    } else {
      // cinematic: nearest vantage point, with hysteresis to avoid flicker
      const vehicle = ride.sim.getVehicle()
      vehicle.updateWorldMatrix(true, false)
      const vp = vehicle.getWorldPosition(new Vector3())
      const shots = ride.config.cinematicShots
      this.shotTime += dt
      let best = 0
      let bestD = Infinity
      shots.forEach((s, i) => {
        const d = ride.zone.localToWorld(this.v.set(...s)).distanceTo(vp)
        if (d < bestD) {
          bestD = d
          best = i
        }
      })
      const curD = this.shotIndex >= 0 ? ride.zone.localToWorld(this.v.set(...shots[this.shotIndex])).distanceTo(vp) : Infinity
      if (cut || this.shotIndex < 0 || (best !== this.shotIndex && bestD < curD * 0.7 && this.shotTime > 2.2)) {
        this.shotIndex = best
        this.shotTime = 0
        this.lookAt.copy(vp)
      }
      ride.zone.localToWorld(camera.position.set(...shots[this.shotIndex]))
      this.lookAt.set(damp(this.lookAt.x, vp.x, 7, dt), damp(this.lookAt.y, vp.y, 7, dt), damp(this.lookAt.z, vp.z, 7, dt))
      camera.up.copy(WORLD_UP)
      camera.lookAt(this.lookAt)
      const dist = camera.position.distanceTo(vp)
      if (!reduceFx) targetFov = MathUtils.clamp(MathUtils.radToDeg(2 * Math.atan(7 / dist)), 22, 62)
    }

    this.fov = cut ? targetFov : damp(this.fov, targetFov, 3, dt)
    if (Math.abs(camera.fov - this.fov) > 0.01 || camera.near !== near) {
      camera.fov = this.fov
      camera.near = near
      camera.updateProjectionMatrix()
    }
  }

  private applyShake(camera: PerspectiveCamera, intensity: number, amplitude: number) {
    if (intensity <= 0.001) return
    const t = this.t
    const a = amplitude * intensity
    // smooth pseudo-noise (sum of incommensurate sines): no harsh jitter
    camera.position.x += (Math.sin(t * 31.7) + Math.sin(t * 17.3) * 0.6) * a
    camera.position.y += (Math.sin(t * 27.1 + 1.3) + Math.sin(t * 13.9) * 0.6) * a
  }

  /** Restore the default camera when control returns to the player rig. */
  release(camera: PerspectiveCamera) {
    if (!this.active) return
    this.active = false
    this.lastMode = null
    this.shotIndex = -1
    this.lookYaw = this.lookPitch = 0
    camera.up.copy(WORLD_UP)
    camera.fov = this.fov = BASE_FOV
    camera.near = BASE_NEAR
    camera.updateProjectionMatrix()
  }
}
