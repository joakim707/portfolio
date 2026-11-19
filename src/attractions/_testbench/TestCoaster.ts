import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from 'three'
import { hermiteStop, restraintAmount } from '@/core/rides/motion'
import type { RidePhaseTimings, RideSimulation, RideState } from '@/core/rides/types'
import { sampleTrack, type Track } from './track'

const G = 9.81
const STATION_S = 6 // arc length where the car parks
const SEAT_X = [0.38, -0.38] // seat 0 on the right (platform side)

const mat = {
  body: new MeshStandardMaterial({ color: '#ff4d6d', roughness: 0.45, metalness: 0.2 }),
  trim: new MeshStandardMaterial({ color: '#1d2b53', roughness: 0.6 }),
  seat: new MeshStandardMaterial({ color: '#111827', roughness: 0.9 }),
  bar: new MeshStandardMaterial({ color: '#f6c445', roughness: 0.4, metalness: 0.5 }),
  light: new MeshStandardMaterial({ color: '#ffffff', emissive: '#fff4cc', emissiveIntensity: 2 }),
  wheel: new MeshStandardMaterial({ color: '#2d3138', roughness: 0.5, metalness: 0.6 }),
}

function box(w: number, h: number, d: number, m: MeshStandardMaterial, x: number, y: number, z: number) {
  const mesh = new Mesh(new BoxGeometry(w, h, d), m)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  return mesh
}

/**
 * Test-bench coaster used to validate the generic ride system (étape 4).
 * Kinematic and deterministic: the car's arc-length position s is integrated
 * from a simple energy model (gravity along the tangent, drag, rolling
 * resistance) plus scripted sections (station tyres, chain lift, brakes).
 */
export class TestCoaster implements RideSimulation {
  readonly root = new Group()
  private readonly car = new Group()
  private readonly seats: Object3D[] = []
  private readonly harness: Group[] = []
  private readonly track: Track
  private readonly timings: RidePhaseTimings
  private s = STATION_S
  private v = 0
  private label = 'station'
  private brakeFrom = 0
  private brakeV = 0
  private lapEnd: number
  private readonly f = { p: new Vector3(), t: new Vector3(), n: new Vector3(), b: new Vector3() }
  private readonly m = new Matrix4()

  constructor(track: Track, timings: RidePhaseTimings) {
    this.track = track
    this.timings = timings
    this.lapEnd = track.length
    this.buildCar()
    this.root.add(this.car)
    this.place()
  }

  private buildCar() {
    const c = this.car
    c.add(box(1.5, 0.35, 2.3, mat.body, 0, 0.42, 0)) // chassis
    c.add(box(1.5, 0.5, 0.35, mat.body, 0, 0.75, -1.0)) // front fairing
    c.add(box(1.52, 0.08, 2.32, mat.trim, 0, 0.62, 0))
    c.add(box(0.25, 0.12, 0.05, mat.light, 0.5, 0.75, -1.18))
    c.add(box(0.25, 0.12, 0.05, mat.light, -0.5, 0.75, -1.18))
    for (const z of [-0.8, 0.8])
      for (const x of [-0.55, 0.55]) {
        const w = new Mesh(new CylinderGeometry(0.16, 0.16, 0.12, 12), mat.wheel)
        w.rotation.z = Math.PI / 2
        w.position.set(x, 0.12, z)
        c.add(w)
      }
    SEAT_X.forEach((x) => {
      c.add(box(0.62, 0.14, 0.62, mat.seat, x, 0.66, 0.15)) // cushion
      c.add(box(0.62, 0.85, 0.14, mat.seat, x, 1.1, 0.5)) // backrest
      c.add(box(0.3, 0.22, 0.12, mat.seat, x, 1.55, 0.5)) // headrest
      // hip point: origin of the passenger
      const seat = new Object3D()
      seat.position.set(x, 0.74, 0.18)
      c.add(seat)
      this.seats.push(seat)
      // over-the-shoulder harness, pivoting above the backrest
      const h = new Group()
      h.position.set(x, 1.45, 0.42)
      for (const bx of [-0.17, 0.17]) h.add(box(0.07, 0.07, 0.55, mat.bar, bx, -0.05, -0.27))
      for (const bx of [-0.17, 0.17]) h.add(box(0.07, 0.6, 0.07, mat.bar, bx, -0.35, -0.55))
      h.add(box(0.42, 0.09, 0.09, mat.bar, 0, -0.62, -0.55))
      c.add(h)
      this.harness.push(h)
    })
  }

  /** Place the car at the current arc length using the track frame. */
  private place() {
    const f = this.f
    this.label = sampleTrack(this.track, this.s, f)
    // basis: X = right (binormal), Y = up (normal), Z = back (-tangent)
    this.m.makeBasis(f.b, f.n, f.t.clone().negate()).setPosition(f.p)
    this.car.matrix.copy(this.m)
    this.car.matrix.decompose(this.car.position, this.car.quaternion, this.car.scale)
  }

  private setHarness(amount: number) {
    // 0 = raised above the head, 1 = locked on the shoulders
    for (const h of this.harness) h.rotation.x = -1.9 * (1 - amount)
  }

  update(state: RideState, t: number, dt: number, ghost: boolean): boolean | void {
    this.setHarness(ghost ? 1 : restraintAmount(state, t, this.timings))
    let finished = false
    if (state === 'RUNNING') {
      finished = this.integrate(dt)
      if (finished) {
        this.brakeFrom = this.s
        this.brakeV = this.v
      }
    } else if (state === 'BRAKING') {
      // stop exactly at the station mark of the next lap
      const target = this.lapEnd + STATION_S
      const [ds, v] = hermiteStop(t, this.timings.braking, target - this.brakeFrom, this.brakeV)
      this.s = this.brakeFrom + ds
      this.v = v
      if (t >= this.timings.braking) this.resetToStation()
    } else if (state === 'STARTING') {
      this.v = 0
    } else if (!ghost && state !== 'INTERRUPTED' && this.s !== STATION_S) {
      // parked states: normalise "one lap + station" back to the station mark,
      // otherwise canBoard() would never be true again (replayability).
      this.resetToStation()
    }
    this.place()
    return finished
  }

  /** One integration step; returns true when the lap is complete. */
  private integrate(dt: number) {
    const slope = this.f.t.y // sine of the track pitch
    let a = -G * slope - 0.008 * this.v * this.v - 0.15
    switch (this.label) {
      case 'station':
        a = this.v < 3 ? 1.6 : 0 // drive tyres
        break
      case 'lift':
        a = (3 - this.v) * 2 // chain: hold 3 m/s
        break
      case 'brake':
        if (this.v > 4) a = -5
        break
    }
    this.v = Math.max(this.label === 'loop' ? 5 : 1.8, this.v + a * dt)
    this.s += this.v * dt
    return this.s >= this.lapEnd
  }

  canBoard() {
    return Math.abs(this.s - STATION_S) < 0.01 && this.v === 0
  }

  resetToStation() {
    this.s = STATION_S
    this.v = 0
    this.setHarness(0)
    this.place()
  }

  getSeat(i: number) {
    return this.seats[i] ?? null
  }
  getVehicle() {
    return this.car
  }
  getSpeed() {
    return this.v
  }
  getShake() {
    if (this.label === 'lift') return 0.25 // chain clatter
    return Math.min(this.v / 14, 1) * 0.5
  }

  dispose() {
    this.car.traverse((o) => {
      if (o instanceof Mesh) o.geometry.dispose()
    })
  }
}
