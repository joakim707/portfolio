import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, Object3D, TorusGeometry, type BufferGeometry } from 'three'
import { restraintAmount } from '@/core/rides/motion'
import type { RidePhaseTimings, RideSimulation, RideState } from '@/core/rides/types'
import { ARM, GONDOLA_RADIUS, PIVOT_Y, SEAT_COUNT, SEAT_RADIUS, VORTEX, vortexPose } from './layout'

/**
 * THE VORTEX: a pendulum arm swinging around the axle (rotation about Z) and,
 * at its end, a gondola disc spinning about the arm (rotation about the arm's
 * own axis). Seats ride on the disc, so a seat's world transform — and the POV
 * camera attached to it — combines both rotations through the scene graph:
 *   world = axle · R_z(arm) · T(0, −ARM, 0) · R_y(spin) · seat
 */
export class Pendulum implements RideSimulation {
  readonly root = new Group()
  private readonly pivot = new Group()
  private readonly gondola = new Group()
  private readonly seats: Object3D[] = []
  private readonly harness: Group[] = []
  private readonly timings: RidePhaseTimings
  private readonly geometries: BufferGeometry[] = []
  private readonly materials: MeshStandardMaterial[] = []
  private readonly pose = { arm: 0, rate: 0, spin: 0 }
  private arm = 0
  private spin = 0
  private rate = 0
  private braking = false

  constructor(timings: RidePhaseTimings) {
    this.timings = timings
    this.pivot.position.y = PIVOT_Y
    this.root.add(this.pivot)
    this.gondola.position.y = -ARM
    this.pivot.add(this.gondola)
    this.build()
    this.apply()
  }

  private mat(color: string, extra: Partial<ConstructorParameters<typeof MeshStandardMaterial>[0]> = {}) {
    const m = new MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.3, ...extra })
    this.materials.push(m)
    return m
  }
  private add(parent: Object3D, geo: BufferGeometry, m: MeshStandardMaterial, x = 0, y = 0, z = 0) {
    this.geometries.push(geo)
    const mesh = new Mesh(geo, m)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    parent.add(mesh)
    return mesh
  }
  private box(parent: Object3D, w: number, h: number, d: number, m: MeshStandardMaterial, x: number, y: number, z: number) {
    return this.add(parent, new BoxGeometry(w, h, d), m, x, y, z)
  }

  private build() {
    const pink = this.mat('#ec4899')
    const dark = this.mat('#1f2937')
    const steel = this.mat('#e5e7eb', { roughness: 0.35, metalness: 0.7 })
    const seatMat = this.mat('#111827', { roughness: 0.9, metalness: 0 })
    const bar = this.mat('#f6c445', { roughness: 0.4, metalness: 0.5 })
    const neon = this.mat('#f472b6', { emissive: '#ec4899', emissiveIntensity: 1.8, toneMapped: false })

    // arm: a tapered box girder from the axle hub to the gondola, with a light strip
    const hub = this.add(this.pivot, new CylinderGeometry(1.1, 1.1, 2.2, 20), dark)
    hub.rotation.x = Math.PI / 2
    this.box(this.pivot, 1.2, ARM - 1, 0.9, pink, 0, -(ARM - 1) / 2, 0)
    for (const x of [-0.62, 0.62]) this.box(this.pivot, 0.08, ARM - 2, 0.12, neon, x, -(ARM - 1) / 2, 0)
    // counterweight above the axle
    this.box(this.pivot, 2.4, 2.6, 1.6, dark, 0, 2, 0)

    // gondola: motor housing, disc, rim light and outward-facing seats
    const g = this.gondola
    this.add(g, new CylinderGeometry(1.3, 1.6, 2.2, 16), dark, 0, 0.9, 0)
    this.add(g, new CylinderGeometry(GONDOLA_RADIUS, GONDOLA_RADIUS - 0.3, 0.35, 32), steel, 0, -0.45, 0)
    const rim = this.add(g, new TorusGeometry(GONDOLA_RADIUS + 0.05, 0.09, 6, 48), neon, 0, -0.45, 0)
    rim.rotation.x = Math.PI / 2
    for (let i = 0; i < SEAT_COUNT; i++) {
      const phi = (i / SEAT_COUNT) * Math.PI * 2
      // seat frame: origin = hip point, −Z = facing outward, +Y = towards the axle
      const seat = new Group()
      seat.position.set(Math.sin(phi) * SEAT_RADIUS, 0, Math.cos(phi) * SEAT_RADIUS)
      seat.rotation.y = phi + Math.PI
      g.add(seat)
      this.box(seat, 0.62, 0.12, 0.5, seatMat, 0, -0.08, 0.02)
      this.box(seat, 0.62, 1.05, 0.14, seatMat, 0, 0.42, 0.32)
      this.box(seat, 0.36, 0.3, 0.12, seatMat, 0, 1.08, 0.32)
      for (const sx of [-0.33, 0.33]) this.box(seat, 0.06, 0.45, 0.5, pink, sx, 0.12, 0.08)
      const hip = new Object3D()
      seat.add(hip)
      this.seats.push(hip)
      const h = new Group()
      h.position.set(0, 0.71, 0.24)
      for (const bx of [-0.17, 0.17]) this.box(h, 0.07, 0.07, 0.55, bar, bx, -0.05, -0.27)
      for (const bx of [-0.17, 0.17]) this.box(h, 0.07, 0.6, 0.07, bar, bx, -0.35, -0.55)
      this.box(h, 0.42, 0.09, 0.09, bar, 0, -0.62, -0.55)
      seat.add(h)
      this.harness.push(h)
    }
  }

  private apply() {
    this.pivot.rotation.z = this.arm
    this.gondola.rotation.y = this.spin
  }

  private setHarness(amount: number) {
    for (const h of this.harness) h.rotation.x = -1.9 * (1 - amount)
  }

  update(state: RideState, t: number, _dt: number, ghost: boolean): boolean | void {
    this.setHarness(ghost ? 1 : restraintAmount(state, t, this.timings))
    let done = false
    this.braking = false
    if (state === 'RUNNING' || state === 'BRAKING') {
      // BRAKING continues the same precomputed table after RUNNING
      vortexPose(state === 'RUNNING' ? t : VORTEX.run + t, this.pose)
      this.arm = this.pose.arm
      this.spin = this.pose.spin
      this.rate = this.pose.rate
      this.braking = state === 'BRAKING'
      if (state === 'RUNNING') done = t >= VORTEX.run
      else if (t >= VORTEX.brake) this.resetToStation()
    } else if (state === 'STARTING') {
      this.rate = 0
    } else if (state !== 'INTERRUPTED' && !ghost && (this.arm !== 0 || this.spin !== 0)) {
      this.resetToStation()
    }
    this.apply()
    return done
  }

  resetToStation() {
    // whole turns are equivalent: park at exactly 0 so canBoard() is reliable
    this.arm = 0
    this.spin = 0
    this.rate = 0
    this.setHarness(0)
    this.apply()
  }
  canBoard() {
    return this.arm === 0 && this.spin === 0
  }
  getSeat(i: number) {
    return this.seats[i] ?? null
  }
  getAllSeats() {
    return this.seats
  }
  /** The chase / cinematic cameras frame the player's seat. */
  getVehicle() {
    return this.seats[0]
  }
  getSpeed() {
    return Math.abs(this.rate) * ARM
  }
  get isBraking() {
    return this.braking
  }
  /** Arm angle (rad, unwrapped) and gondola spin, for lights and tests. */
  get armAngle() {
    return this.arm
  }
  get spinAngle() {
    return this.spin
  }
  getShake() {
    return Math.min(0.4, 0.06 + this.getSpeed() / 70) + (this.braking ? 0.2 : 0)
  }
  dispose() {
    this.geometries.forEach((g) => g.dispose())
    this.materials.forEach((m) => m.dispose())
  }
}
