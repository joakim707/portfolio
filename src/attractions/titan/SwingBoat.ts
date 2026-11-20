import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Shape,
  type BufferGeometry,
} from 'three'
import { restraintAmount } from '@/core/rides/motion'
import type { RidePhaseTimings, RideSimulation, RideState } from '@/core/rides/types'
import { ARM, BOAT_HALF_LENGTH, BOAT_HALF_WIDTH, HIP_ABOVE_FLOOR, PIVOT_Y, ROWS, SEAT_Z, SWING, brakeAngle, swingAngle } from './layout'

/**
 * THE TITAN SWING boat: hull, stepped floors, 24 inward-facing seats and one
 * lap bar per row, hung ARM metres below the axle. Its angle is a pure
 * function of time (see layout.ts), so the motion is deterministic.
 * The player's seat (index 0) is the last row on the plaza side.
 */
export class SwingBoat implements RideSimulation {
  readonly root = new Group()
  private readonly pivot = new Group()
  private readonly boat = new Group()
  private readonly seats: Object3D[] = []
  private readonly bars: Group[] = []
  private readonly timings: RidePhaseTimings
  private readonly geometries: BufferGeometry[] = []
  private readonly materials: MeshStandardMaterial[] = []
  private angle = 0
  private speed = 0
  private braking = false

  constructor(timings: RidePhaseTimings, signTexture: CanvasTexture) {
    this.timings = timings
    this.pivot.position.y = PIVOT_Y
    this.pivot.add(this.boat)
    this.root.add(this.pivot)
    this.build(signTexture)
    this.apply()
  }

  private mat(color: string, extra: Partial<ConstructorParameters<typeof MeshStandardMaterial>[0]> = {}) {
    const m = new MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.15, ...extra })
    this.materials.push(m)
    return m
  }
  private add(parent: Object3D, geo: BufferGeometry, m: MeshStandardMaterial, x = 0, y = 0, z = 0) {
    this.geometries.push(geo)
    const mesh = new Mesh(geo, m)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }
  private box(parent: Object3D, w: number, h: number, d: number, m: MeshStandardMaterial, x: number, y: number, z: number) {
    return this.add(parent, new BoxGeometry(w, h, d), m, x, y, z)
  }

  private build(sign: CanvasTexture) {
    const b = this.boat
    const hull = this.mat('#f59e0b')
    const trim = this.mat('#7c2d12')
    const wood = this.mat('#8a5a33', { roughness: 0.9, metalness: 0 })
    const seatMat = this.mat('#111827', { roughness: 0.9, metalness: 0 })
    const steel = this.mat('#d1d5db', { roughness: 0.35, metalness: 0.7 })
    const bar = this.mat('#f6c445', { roughness: 0.4, metalness: 0.5 })
    const signMat = this.mat('#ffffff', { map: sign, emissiveMap: sign, emissive: '#ffffff', emissiveIntensity: 0.35, side: DoubleSide, metalness: 0 })

    // side silhouette: raised bow and stern, gunwale dipping amidships
    const L = BOAT_HALF_LENGTH
    const s = new Shape()
    s.moveTo(-L, -11.8)
    s.quadraticCurveTo(-L + 0.3, -15.2, -6.4, -15.6)
    s.lineTo(6.4, -15.6)
    s.quadraticCurveTo(L - 0.3, -15.2, L, -11.8)
    s.quadraticCurveTo(5.5, -13.2, 0, -13.6)
    s.quadraticCurveTo(-5.5, -13.2, -L, -11.8)
    const side = new ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: false, curveSegments: 16 })
    for (const z of [BOAT_HALF_WIDTH, -BOAT_HALF_WIDTH - 0.16]) this.add(b, side, hull, 0, 0, z)
    // keel / bottom and bow + stern caps
    this.box(b, 12.8, 0.25, BOAT_HALF_WIDTH * 2, trim, 0, -15.5, 0)
    for (const x of [-1, 1]) this.box(b, 0.2, 3.4, BOAT_HALF_WIDTH * 2, trim, x * 8.4, -13.6, 0)
    // gunwale rails
    for (const z of [BOAT_HALF_WIDTH + 0.08, -BOAT_HALF_WIDTH - 0.08]) this.box(b, 15, 0.12, 0.12, steel, 0, -13.45, z)
    // name boards on both sides
    for (const z of [BOAT_HALF_WIDTH + 0.2, -BOAT_HALF_WIDTH - 0.2]) {
      const p = this.add(b, new PlaneGeometry(8, 1), signMat, 0, -14.6, z)
      if (z < 0) p.rotation.y = Math.PI
    }
    // stepped floors: centre, middle and end rows
    this.box(b, 7, 0.2, BOAT_HALF_WIDTH * 2, wood, 0, -15.1, 0)
    for (const sx of [-1, 1]) {
      this.box(b, 2, 0.9, BOAT_HALF_WIDTH * 2, wood, sx * 4.4, -14.75, 0)
      this.box(b, 2.2, 1.8, BOAT_HALF_WIDTH * 2, wood, sx * 6.5, -14.3, 0)
    }

    // seats: riders on the +X half face −X (towards the centre) and vice versa
    ROWS.forEach((row, r) => {
      const facing = row.x > 0 ? Math.PI / 2 : -Math.PI / 2
      const dir = row.x > 0 ? 1 : -1 // towards the boat end, i.e. behind the riders
      const rowGroup = new Group()
      rowGroup.position.set(row.x, row.floor, 0)
      b.add(rowGroup)
      this.box(rowGroup, 0.5, 0.45, BOAT_HALF_WIDTH * 2 - 0.4, seatMat, 0, 0.22, 0) // bench
      this.box(rowGroup, 0.14, 1.0, BOAT_HALF_WIDTH * 2 - 0.4, seatMat, dir * 0.32, 0.9, 0) // backrest
      // lap bar across the row, hinged in front of the riders
      const lap = new Group()
      lap.position.set(-dir * 0.45, 0.62, 0)
      this.box(lap, 0.08, 0.08, BOAT_HALF_WIDTH * 2 - 0.5, bar, -dir * 0.12, 0.12, 0)
      for (const z of [-1.9, 1.9]) this.box(lap, 0.06, 0.3, 0.06, bar, 0, 0, z)
      rowGroup.add(lap)
      this.bars.push(lap)
      lap.userData.dir = dir
      for (const z of SEAT_Z) {
        const hip = new Object3D()
        hip.position.set(0, HIP_ABOVE_FLOOR, z)
        hip.rotation.y = facing
        rowGroup.add(hip)
        // the player's seat must be index 0: last row (+X), plaza side (+Z)
        if (r === 0 && z === SEAT_Z[0]) this.seats.unshift(hip)
        else this.seats.push(hip)
      }
    })

    // swing arms: V struts from the axle to both ends of each gunwale, plus the axle hub
    for (const z of [BOAT_HALF_WIDTH + 0.3, -BOAT_HALF_WIDTH - 0.3]) {
      for (const x of [-6.2, 6.2]) {
        const len = Math.hypot(x, ARM - 1.8)
        const arm = this.add(this.pivot, new CylinderGeometry(0.16, 0.2, len, 8), steel, x / 2, -(ARM - 1.8) / 2, z)
        arm.rotation.z = Math.atan2(x, ARM - 1.8)
      }
    }
    const hub = this.add(this.pivot, new CylinderGeometry(0.55, 0.55, BOAT_HALF_WIDTH * 2 + 1, 16), trim)
    hub.rotation.x = Math.PI / 2
  }

  private apply() {
    this.pivot.rotation.z = this.angle
  }

  private setBars(amount: number) {
    // open: swung up towards the riders' faces (≈ 100°); closed: across the laps
    for (const lap of this.bars) lap.rotation.z = (lap.userData.dir as number) * -1.75 * (1 - amount)
  }

  update(state: RideState, t: number, dt: number, ghost: boolean): boolean | void {
    this.setBars(ghost ? 1 : restraintAmount(state, t, this.timings))
    const prev = this.angle
    let done = false
    this.braking = false
    if (state === 'RUNNING') {
      this.angle = swingAngle(t)
      done = t >= SWING.run
    } else if (state === 'BRAKING') {
      this.angle = brakeAngle(t)
      this.braking = true
      if (t >= SWING.brake) this.angle = 0
    } else if (state === 'STARTING') {
      // the drive tyres engage: a small rock before the swing builds up
      this.angle = 0.03 * Math.sin(t * 5) * Math.max(0, 1 - t / this.timings.starting)
    } else if (state !== 'INTERRUPTED' && !ghost && this.angle !== 0) {
      this.resetToStation()
    }
    // tangential speed at the boat floor, for FOV / wind
    this.speed = dt > 0 ? (Math.abs(this.angle - prev) / dt) * ARM : 0
    this.apply()
    return done
  }

  resetToStation() {
    this.angle = 0
    this.speed = 0
    this.setBars(0)
    this.apply()
  }
  canBoard() {
    return this.angle === 0
  }
  getSeat(i: number) {
    return this.seats[i] ?? null
  }
  /** The chase / cinematic cameras frame the player's seat. */
  getVehicle() {
    return this.seats[0]
  }
  getSpeed() {
    return this.speed
  }
  get isBraking() {
    return this.braking
  }
  /** Current boat angle (rad), for lights and tests. */
  get boatAngle() {
    return this.angle
  }
  getShake() {
    // creaks at the extremes, rumble of the drive tyres near the bottom
    return Math.min(0.35, 0.05 + this.speed / 60) + (this.braking ? 0.25 : 0)
  }
  dispose() {
    this.geometries.forEach((g) => g.dispose())
    this.materials.forEach((m) => m.dispose())
  }
}
