import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, Object3D, TorusGeometry, type BufferGeometry } from 'three'
import { hermiteStop, restraintAmount } from '@/core/rides/motion'
import type { RidePhaseTimings, RideSimulation, RideState } from '@/core/rides/types'
import { BRAKE_END_Y, PROFILE, SEAT_COUNT, SEAT_RADIUS, STATION_Y, TOP_Y, dropProfile, type DropPhase } from './layout'

/**
 * SKYFALL 3000 gondola: an annular car with 12 outward-facing seats that
 * slides along the mast. Kinematic and deterministic — position, speed and
 * rotation come from dropProfile(t) (real-gravity free fall, constant
 * magnetic deceleration), then a Hermite stop back to the station.
 */
export class DropTower implements RideSimulation {
  readonly root = new Group()
  private readonly gondola = new Group()
  private readonly seats: Object3D[] = []
  private readonly harness: Group[] = []
  private readonly timings: RidePhaseTimings
  private readonly p: DropPhase = { y: STATION_Y, v: 0, rot: 0, phase: 'done' }
  private readonly geometries: BufferGeometry[] = []
  private readonly materials: MeshStandardMaterial[] = []
  private y = STATION_Y
  private v = 0
  private rot = 0
  private phase: DropPhase['phase'] | 'station' = 'station'
  private lockJolt = 0

  constructor(timings: RidePhaseTimings) {
    this.timings = timings
    this.build()
    this.root.add(this.gondola)
    this.apply()
  }

  // ── construction ─────────────────────────────────────────────────────────

  private mat(color: string, extra: Partial<ConstructorParameters<typeof MeshStandardMaterial>[0]> = {}) {
    const m = new MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.25, ...extra })
    this.materials.push(m)
    return m
  }
  private mesh(parent: Object3D, geo: BufferGeometry, m: MeshStandardMaterial, x = 0, y = 0, z = 0) {
    this.geometries.push(geo)
    const mesh = new Mesh(geo, m)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    parent.add(mesh)
    return mesh
  }
  private box(parent: Object3D, w: number, h: number, d: number, m: MeshStandardMaterial, x: number, y: number, z: number) {
    return this.mesh(parent, new BoxGeometry(w, h, d), m, x, y, z)
  }

  private build() {
    const g = this.gondola
    const frame = this.mat('#e5e7eb')
    const dark = this.mat('#1f2937')
    const seatMat = this.mat('#111827', { roughness: 0.9, metalness: 0 })
    const bar = this.mat('#f6c445', { roughness: 0.4, metalness: 0.5 })
    const neon = this.mat('#22c55e', { emissive: '#22c55e', emissiveIntensity: 1.6, toneMapped: false })

    // collar around the mast, with the green "pulse" ring under the seats
    this.mesh(g, new CylinderGeometry(2.25, 2.25, 1.8, 12, 1, true), dark, 0, -0.2, 0)
    this.mesh(g, new CylinderGeometry(2.3, 2.3, 0.25, 12), frame, 0, -1.05, 0)
    this.mesh(g, new CylinderGeometry(2.3, 2.3, 0.25, 12), frame, 0, 0.65, 0)
    const ring = this.mesh(g, new TorusGeometry(SEAT_RADIUS + 0.55, 0.07, 6, 48), neon, 0, -0.55, 0)
    ring.rotation.x = Math.PI / 2

    for (let i = 0; i < SEAT_COUNT; i++) {
      const phi = (i / SEAT_COUNT) * Math.PI * 2
      // seat frame: origin = hip point, −Z = facing outward
      const seat = new Group()
      seat.position.set(Math.sin(phi) * SEAT_RADIUS, 0, Math.cos(phi) * SEAT_RADIUS)
      seat.rotation.y = phi + Math.PI
      g.add(seat)
      // support arm back to the collar
      this.box(seat, 0.18, 0.18, 1.0, frame, 0, -0.35, 0.75)
      this.box(seat, 0.62, 0.12, 0.5, seatMat, 0, -0.08, 0.02) // cushion
      this.box(seat, 0.62, 1.05, 0.14, seatMat, 0, 0.42, 0.32) // backrest
      this.box(seat, 0.36, 0.3, 0.12, seatMat, 0, 1.08, 0.32) // headrest
      for (const sx of [-0.33, 0.33]) this.box(seat, 0.06, 0.45, 0.5, frame, sx, 0.12, 0.08) // side panels
      const hip = new Object3D() // passenger origin (hip point on the cushion)
      seat.add(hip)
      this.seats.push(hip)
      // over-the-shoulder harness hinged above the headrest
      const h = new Group()
      h.position.set(0, 0.71, 0.24)
      for (const bx of [-0.17, 0.17]) this.box(h, 0.07, 0.07, 0.55, bar, bx, -0.05, -0.27)
      for (const bx of [-0.17, 0.17]) this.box(h, 0.07, 0.6, 0.07, bar, bx, -0.35, -0.55)
      this.box(h, 0.42, 0.09, 0.09, bar, 0, -0.62, -0.55)
      seat.add(h)
      this.harness.push(h)
    }
  }

  // ── motion ───────────────────────────────────────────────────────────────

  private apply() {
    this.gondola.position.y = this.y
    this.gondola.rotation.y = this.rot
  }

  private setHarness(amount: number) {
    for (const h of this.harness) h.rotation.x = -1.9 * (1 - amount)
  }

  update(state: RideState, t: number, _dt: number, ghost: boolean): boolean | void {
    this.setHarness(ghost ? 1 : restraintAmount(state, t, this.timings))
    let done = false
    if (state === 'RUNNING') {
      dropProfile(t, this.p)
      this.y = this.p.y
      this.v = this.p.v
      this.rot = this.p.rot
      this.phase = this.p.phase
      done = t >= PROFILE.total
    } else if (state === 'BRAKING') {
      // final, gentle lowering from the end of the brake fins to the station
      const [d, v] = hermiteStop(t, this.timings.braking, BRAKE_END_Y - STATION_Y, PROFILE.vEnd)
      this.y = BRAKE_END_Y - d
      this.v = -v
      this.rot = 0
      this.phase = 'brake'
      if (t >= this.timings.braking) this.resetToStation()
    } else if (state === 'STARTING') {
      this.lockJolt = Math.max(0, 0.4 - t) // the gondola locks onto the lift
    } else if (state !== 'INTERRUPTED' && !ghost && (this.y !== STATION_Y || this.rot !== 0)) {
      this.resetToStation()
    }
    this.apply()
    return done
  }

  resetToStation() {
    this.y = STATION_Y
    this.v = 0
    this.rot = 0
    this.phase = 'station'
    this.setHarness(0)
    this.apply()
  }

  canBoard() {
    return this.y === STATION_Y && this.rot === 0 && this.v === 0
  }

  // ── RideSimulation API ───────────────────────────────────────────────────

  getSeat(i: number) {
    return this.seats[i] ?? null
  }
  getAllSeats() {
    return this.seats
  }
  /** The chase / cinematic cameras frame the player's seat, not the mast axis. */
  getVehicle() {
    return this.seats[0]
  }
  getSpeed() {
    return Math.abs(this.v)
  }
  get lifting() {
    return this.phase === 'ascent'
  }
  get braking() {
    return this.phase === 'brake'
  }
  /** Normalised height 0 (station) … 1 (top), for synchronised lights. */
  get heightRatio() {
    return (this.y - STATION_Y) / (TOP_Y - STATION_Y)
  }
  get gondolaY() {
    return this.y
  }
  getShake() {
    if (this.lockJolt > 0) return 0.5
    switch (this.phase) {
      case 'ascent':
        return 0.12 // cable vibration
      case 'pause':
        return 0.05
      case 'fall':
        return 0.25 + Math.min(1, Math.abs(this.v) / 28) * 0.4
      case 'brake':
        return 0.9 // magnetic brakes bite
      default:
        return 0
    }
  }
  dispose() {
    this.geometries.forEach((g) => g.dispose())
    this.materials.forEach((m) => m.dispose())
  }
}
