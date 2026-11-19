import { BoxGeometry, CylinderGeometry, Group, Matrix4, Mesh, MeshStandardMaterial, Object3D } from 'three'
import { hermiteStop, restraintAmount } from '@/core/rides/motion'
import type { RidePhaseTimings, RideSimulation, RideState } from '@/core/rides/types'
import { createFrame, sampleTrack, type Track, type TrackLabel } from './track'

const G = 9.81

export interface CoasterOptions {
  track: Track
  timings: RidePhaseTimings
  /** Arc length where the FRONT car stops in the station. */
  stationS: number
  cars: number
  /** Distance between car centres along the rail. */
  spacing: number
  /** Car carrying the player (0 = front). */
  playerCar: number
  colors?: { body: string; trim: string; bar: string }
  /** Chain lift speed (m/s). */
  liftSpeed?: number
  /** Speed the station tyres push the train to (m/s). */
  launchSpeed?: number
  /** Speed brake sections slow the train to (m/s). */
  brakeSpeed?: number
  /** Minimum speed kept through loops / corkscrews (keeps the kinematic model safe). */
  minInversionSpeed?: number
  /** Aerodynamic drag coefficient (a = -k v²). */
  drag?: number
}

/** Two seats per car: seat 0 = right (platform side), seat 1 = left. */
const SEAT_X = [0.38, -0.38]

/**
 * Kinematic, deterministic coaster train shared by every coaster ride.
 * The train's arc-length position s (front car) is integrated from an energy
 * model — gravity along the train's mean slope, drag, rolling resistance —
 * plus scripted sections: station tyres, chain lift, brakes. Each car is
 * placed on the rail at s − i·spacing with the track's banked frame, so cars
 * keep their spacing and follow loops / corkscrews exactly.
 */
export class CoasterTrain implements RideSimulation {
  readonly root = new Group()
  private readonly cars: Group[] = []
  private readonly seats: Object3D[][] = []
  private readonly harness: Group[] = []
  private readonly opts: Required<Omit<CoasterOptions, 'colors'>> & Pick<CoasterOptions, 'colors'>
  private s: number
  private v = 0
  private label: TrackLabel = 'station'
  private brakeFrom = 0
  private brakeV = 0
  private readonly f = createFrame()
  private readonly m = new Matrix4()
  private readonly geometries: BoxGeometry[] = []
  private readonly materials: MeshStandardMaterial[] = []

  constructor(options: CoasterOptions) {
    this.opts = {
      liftSpeed: 4,
      launchSpeed: 3,
      brakeSpeed: 4.5,
      minInversionSpeed: 6,
      drag: 0.004,
      ...options,
    }
    this.s = this.opts.stationS
    for (let i = 0; i < this.opts.cars; i++) this.buildCar(i)
    this.place()
  }

  // ── construction ─────────────────────────────────────────────────────────

  private mat(color: string, extra: Partial<ConstructorParameters<typeof MeshStandardMaterial>[0]> = {}) {
    const m = new MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.2, ...extra })
    this.materials.push(m)
    return m
  }

  private box(parent: Object3D, w: number, h: number, d: number, m: MeshStandardMaterial, x: number, y: number, z: number) {
    const g = new BoxGeometry(w, h, d)
    this.geometries.push(g)
    const mesh = new Mesh(g, m)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    parent.add(mesh)
    return mesh
  }

  private palette?: { body: MeshStandardMaterial; trim: MeshStandardMaterial; seat: MeshStandardMaterial; bar: MeshStandardMaterial; light: MeshStandardMaterial; wheel: MeshStandardMaterial }

  private buildCar(index: number) {
    const c = this.opts.colors ?? { body: '#ff4d6d', trim: '#1d2b53', bar: '#f6c445' }
    this.palette ??= {
      body: this.mat(c.body),
      trim: this.mat(c.trim, { roughness: 0.6 }),
      seat: this.mat('#111827', { roughness: 0.9, metalness: 0 }),
      bar: this.mat(c.bar, { roughness: 0.4, metalness: 0.5 }),
      light: this.mat('#ffffff', { emissive: '#fff4cc', emissiveIntensity: 2 }),
      wheel: this.mat('#2d3138', { roughness: 0.5, metalness: 0.6 }),
    }
    const P = this.palette
    const car = new Group()
    this.box(car, 1.5, 0.35, 2.3, P.body, 0, 0.42, 0)
    this.box(car, 1.52, 0.08, 2.32, P.trim, 0, 0.62, 0)
    if (index === 0) {
      // front car: nose fairing with headlights
      this.box(car, 1.5, 0.55, 0.45, P.body, 0, 0.78, -1.05)
      this.box(car, 1.2, 0.3, 0.3, P.trim, 0, 0.62, -1.38)
      this.box(car, 0.25, 0.12, 0.05, P.light, 0.5, 0.82, -1.29)
      this.box(car, 0.25, 0.12, 0.05, P.light, -0.5, 0.82, -1.29)
    } else {
      this.box(car, 1.5, 0.4, 0.2, P.body, 0, 0.72, -1.05)
    }
    const wheelGeo = new CylinderGeometry(0.16, 0.16, 0.12, 12)
    this.geometries.push(wheelGeo as unknown as BoxGeometry)
    for (const z of [-0.8, 0.8])
      for (const x of [-0.55, 0.55]) {
        const w = new Mesh(wheelGeo, P.wheel)
        w.rotation.z = Math.PI / 2
        w.position.set(x, 0.12, z)
        car.add(w)
      }
    const seats: Object3D[] = []
    SEAT_X.forEach((x) => {
      this.box(car, 0.62, 0.14, 0.62, P.seat, x, 0.66, 0.15)
      this.box(car, 0.62, 0.85, 0.14, P.seat, x, 1.1, 0.5)
      this.box(car, 0.3, 0.22, 0.12, P.seat, x, 1.55, 0.5)
      const seat = new Object3D() // hip point: passenger origin
      seat.position.set(x, 0.74, 0.18)
      car.add(seat)
      seats.push(seat)
      // over-the-shoulder harness pivoting above the backrest
      const h = new Group()
      h.position.set(x, 1.45, 0.42)
      for (const bx of [-0.17, 0.17]) this.box(h, 0.07, 0.07, 0.55, P.bar, bx, -0.05, -0.27)
      for (const bx of [-0.17, 0.17]) this.box(h, 0.07, 0.6, 0.07, P.bar, bx, -0.35, -0.55)
      this.box(h, 0.42, 0.09, 0.09, P.bar, 0, -0.62, -0.55)
      car.add(h)
      this.harness.push(h)
    })
    this.cars.push(car)
    this.seats.push(seats)
    this.root.add(car)
  }

  // ── placement ────────────────────────────────────────────────────────────

  private place() {
    const f = this.f
    let slope = 0
    this.onChain = false
    this.cars.forEach((car, i) => {
      const label = sampleTrack(this.opts.track, this.s - i * this.opts.spacing, f)
      if (i === 0) this.label = label
      if (label === 'lift') this.onChain = true
      slope += f.t.y
      // basis: X = right (binormal), Y = up (normal), Z = back (−tangent)
      this.m.makeBasis(f.b, f.n, f.t.negate()).setPosition(f.p)
      this.m.decompose(car.position, car.quaternion, car.scale)
    })
    this.meanSlope = slope / this.cars.length
  }
  private meanSlope = 0
  /** True while any car is still engaged on the chain lift. */
  private onChain = false

  private setHarness(amount: number) {
    for (const h of this.harness) h.rotation.x = -1.9 * (1 - amount)
  }

  // ── simulation ───────────────────────────────────────────────────────────

  update(state: RideState, t: number, dt: number, ghost: boolean): boolean | void {
    this.setHarness(ghost ? 1 : restraintAmount(state, t, this.opts.timings))
    let finished = false
    if (state === 'RUNNING') {
      finished = this.integrate(dt)
      if (finished) {
        this.brakeFrom = this.s
        this.brakeV = this.v
      }
    } else if (state === 'BRAKING') {
      // final stop exactly on the station mark of the next lap
      // every lap (real or empty demo cycle) starts from the station mark
      const target = this.opts.stationS + this.opts.track.length
      const [ds, v] = hermiteStop(t, this.opts.timings.braking, Math.max(0.01, target - this.brakeFrom), this.brakeV)
      this.s = this.brakeFrom + ds
      this.v = v
    } else if (state === 'STARTING') {
      this.v = 0
    } else if (!ghost && state !== 'INTERRUPTED' && this.s !== this.opts.stationS) {
      // parked states: normalise "lap + station" back to the mark so canBoard() works again
      this.resetToStation()
    }
    this.place()
    return finished
  }

  /** One step of the energy model; true once the front car enters the final brake/station run. */
  private integrate(dt: number) {
    const o = this.opts
    let a = -G * this.meanSlope - o.drag * this.v * this.v - 0.12
    // past half a lap, the station straight is the final brake run
    const returning = this.s - o.stationS > o.track.length * 0.5
    // the chain holds the train (anti-rollback) until the LAST car has crested;
    // once gravity pulls faster than the chain, the dogs simply disengage
    if (this.onChain && this.label !== 'lift') a = Math.max(a, (o.liftSpeed - this.v) * 2)
    switch (returning && this.label === 'station' ? 'brake' : this.label) {
      case 'station':
        a = this.v < o.launchSpeed ? 1.5 : Math.min(a, 0)
        break
      case 'lift':
        a = (o.liftSpeed - this.v) * 2 // chain: hold the lift speed
        break
      case 'brake':
        if (this.v > o.brakeSpeed) a = -6
        else if (this.v < o.brakeSpeed * 0.6) a = 1.2 // booster wheels
        break
    }
    const min = this.label === 'loop' || this.label === 'twist' ? o.minInversionSpeed : 1.8
    this.v = Math.max(min, this.v + a * dt)
    this.s += this.v * dt
    // done when the front car is back within the station approach of the next lap
    return this.s >= o.stationS + o.track.length - 8
  }

  // ── RideSimulation API ───────────────────────────────────────────────────

  canBoard() {
    return Math.abs(this.s - this.opts.stationS) < 0.01 && this.v === 0
  }
  resetToStation() {
    this.s = this.opts.stationS
    this.v = 0
    this.setHarness(0)
    this.place()
  }
  getSeat(i: number) {
    return this.seats[this.opts.playerCar]?.[i] ?? null
  }
  getVehicle() {
    return this.cars[this.opts.playerCar]
  }
  getSpeed() {
    return this.v
  }
  /** True while any car is engaged on the chain lift (drives the click sound). */
  get chainEngaged() {
    return this.onChain
  }
  get trackLabel() {
    return this.label
  }
  /** Arc length of the front car (for synchronised effects such as tunnel lights). */
  get position() {
    return this.s
  }
  getShake() {
    if (this.label === 'lift') return 0.22 // chain clatter
    if (this.label === 'brake' && this.v > this.opts.brakeSpeed) return 0.6
    return Math.min(this.v / 25, 1) * 0.55
  }
  dispose() {
    this.geometries.forEach((g) => g.dispose())
    this.materials.forEach((m) => m.dispose())
  }
}
