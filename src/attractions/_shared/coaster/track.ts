import { CatmullRomCurve3, Vector3 } from 'three'
import { computeParallelTransportFrames } from '@/core/rides/motion'

export type TrackLabel = 'station' | 'turn' | 'lift' | 'drop' | 'flat' | 'loop' | 'twist' | 'tunnel' | 'brake'

interface Sample {
  p: Vector3
  label: TrackLabel
  /** Banking roll in radians (positive leans into a left turn). Smoothed later. */
  bank: number
  /** Extra roll for corkscrews (0 → 2π), applied around the rider's heartline. */
  twist: number
}

/**
 * "Turtle" track builder: chain straights, banked turns, vertical loops and
 * corkscrews, then close the circuit with a smooth Bézier back to the start.
 * Heading angle a: direction = (cos a, 0, -sin a); positive turns go left
 * (counter-clockwise seen from above).
 */
export class TrackBuilder {
  readonly samples: Sample[] = []
  private p: Vector3
  private a: number
  private readonly step: number
  private readonly start: Vector3
  private readonly startHeading: number

  constructor(start: Vector3, heading: number, step = 0.5, startLabel: TrackLabel = 'station') {
    this.p = start.clone()
    this.a = heading
    this.step = step
    this.start = start.clone()
    this.startHeading = heading
    // the start point itself is sample 0, so arc length s = 0 is exactly `start`
    // (stop marks such as STATION_S are measured from there)
    this.push(start, startLabel)
  }

  get position() {
    return this.p.clone()
  }

  private dir(a = this.a) {
    return new Vector3(Math.cos(a), 0, -Math.sin(a))
  }
  private left(a = this.a) {
    return new Vector3(-Math.sin(a), 0, -Math.cos(a))
  }
  private push(p: Vector3, label: TrackLabel, bank = 0, twist = 0) {
    this.samples.push({ p: p.clone(), label, bank, twist })
  }
  private last() {
    this.p.copy(this.samples[this.samples.length - 1].p)
  }

  /** Straight with an eased height change. */
  straight(len: number, dy: number, label: TrackLabel) {
    if (len <= 1e-6) return this // a zero-length piece would duplicate a point (degenerate tangent)
    const n = Math.max(1, Math.round(len / this.step))
    const d = this.dir()
    const start = this.p.clone()
    for (let i = 1; i <= n; i++) {
      const k = i / n
      const h = k * k * (3 - 2 * k)
      this.push(start.clone().addScaledVector(d, len * k).setY(start.y + dy * h), label)
    }
    this.last()
    return this
  }

  /**
   * Climb or drop built like a real coaster profile: a circular transition of
   * radius r1 into a straight slope of `angleDeg`, then a transition of radius
   * r2 back to level. Unlike an eased straight, curvature stays bounded
   * (1/r), so crests and pull-outs are as gentle as the radii say.
   * The horizontal length follows from dy, the angle and the radii.
   */
  slope(dy: number, angleDeg: number, r1: number, r2: number, label: TrackLabel) {
    const th = (angleDeg * Math.PI) / 180
    const sgn = Math.sign(dy)
    const arcV = (r1 + r2) * (1 - Math.cos(th))
    const mid = Math.max(0, (Math.abs(dy) - arcV) / Math.sin(th))
    const l1 = r1 * th
    const total = l1 + mid + r2 * th
    const pitch = (s: number) => sgn * (s < l1 ? s / r1 : s < l1 + mid ? th : th - (s - l1 - mid) / r2)
    const d = this.dir()
    const p = this.p.clone()
    const sub = 0.05
    let s = 0
    let nextSample = this.step
    while (s < total - 1e-9) {
      const h = Math.min(sub, total - s)
      const ph = pitch(s + h / 2)
      p.addScaledVector(d, Math.cos(ph) * h)
      p.y += Math.sin(ph) * h
      s += h
      if (s >= nextSample - 1e-9 || s >= total - 1e-9) {
        this.push(p, label)
        nextSample += this.step
      }
    }
    this.last()
    return this
  }

  /** Straight that dips by `depth` in the middle (cosine profile). */
  dip(len: number, depth: number, label: TrackLabel) {
    if (len <= 1e-6) return this
    const n = Math.max(1, Math.round(len / this.step))
    const d = this.dir()
    const start = this.p.clone()
    for (let i = 1; i <= n; i++) {
      const k = i / n
      this.push(start.clone().addScaledVector(d, len * k).setY(start.y - depth * 0.5 * (1 - Math.cos(2 * Math.PI * k))), label)
    }
    this.last()
    return this
  }

  /** Horizontal arc (left if angle > 0) with a height change and a bank peaking mid-turn. */
  turn(radius: number, angle: number, dy: number, label: TrackLabel, bank: number) {
    const side = Math.sign(angle) || 1
    const centre = this.p.clone().addScaledVector(this.left(), radius * side)
    const n = Math.max(2, Math.round((radius * Math.abs(angle)) / this.step))
    const y0 = this.p.y
    for (let i = 1; i <= n; i++) {
      const k = i / n
      const a = this.a + angle * k
      const p = centre.clone().addScaledVector(this.left(a), -radius * side)
      p.y = y0 + dy * (k * k * (3 - 2 * k))
      this.push(p, label, bank * side * Math.sin(Math.PI * k))
    }
    this.a += angle
    this.last()
    return this
  }

  /** Vertical loop in the heading plane, drifting sideways by `lateral` (to the left). */
  loop(radius: number, lateral: number, label: TrackLabel = 'loop') {
    const d = this.dir()
    const l = this.left()
    const start = this.p.clone()
    const n = Math.round((2 * Math.PI * radius) / this.step)
    for (let i = 1; i <= n; i++) {
      const th = (i / n) * Math.PI * 2
      // ease the lateral drift so entry and exit stay straight
      const drift = lateral * (th / (2 * Math.PI) - Math.sin(th) / (2 * Math.PI))
      const p = start
        .clone()
        .addScaledVector(d, radius * Math.sin(th))
        .add(new Vector3(0, radius * (1 - Math.cos(th)), 0))
        .addScaledVector(l, drift)
      this.push(p, label)
    }
    this.last()
    return this
  }

  /** Corkscrew: a full roll over `len` metres (the heartline offset is applied in buildTrack). */
  corkscrew(len: number, dy: number, label: TrackLabel = 'twist') {
    const n = Math.max(1, Math.round(len / this.step))
    const d = this.dir()
    const start = this.p.clone()
    for (let i = 1; i <= n; i++) {
      const k = i / n
      const e = k * k * (3 - 2 * k)
      this.push(start.clone().addScaledVector(d, len * k).setY(start.y + dy * e), label, 0, 2 * Math.PI * e)
    }
    this.last()
    return this
  }

  /** Cubic Bézier back to the starting point and heading: guarantees a closed, smooth circuit. */
  close(label: TrackLabel, tangentScale = 0.4) {
    const p0 = this.p.clone()
    const p3 = this.start.clone()
    const dist = p0.distanceTo(p3)
    const p1 = p0.clone().addScaledVector(this.dir(), dist * tangentScale)
    const p2 = p3.clone().addScaledVector(this.dir(this.startHeading), -dist * tangentScale)
    const n = Math.max(2, Math.round(dist / this.step))
    for (let i = 1; i < n; i++) {
      const t = i / n
      const u = 1 - t
      const p = p0
        .clone()
        .multiplyScalar(u * u * u)
        .addScaledVector(p1, 3 * u * u * t)
        .addScaledVector(p2, 3 * u * t * t)
        .addScaledVector(p3, t * t * t)
      this.push(p, label)
    }
    return this
  }
}

export interface Track {
  length: number
  /** Number of frame intervals; frame i sits at arc length i / segments * length. */
  segments: number
  points: Vector3[]
  tangents: Vector3[]
  normals: Vector3[]
  binormals: Vector3[]
  labels: TrackLabel[]
}

/** Height of the rider's heart above the rail: corkscrews roll around this line. */
const HEARTLINE = 1.1

/** Closed, arc-length sampled track with banked rotation-minimising frames. */
export function buildTrack(samples: Sample[], segments = 1200): Track {
  const curve = new CatmullRomCurve3(
    samples.map((s) => s.p),
    true,
    'centripetal',
  )
  const length = curve.getLength()
  const frames = computeParallelTransportFrames(curve, segments, true)
  const points: Vector3[] = []
  const labels: TrackLabel[] = []
  const banks: number[] = []
  const twists: number[] = []
  // map each frame to its nearest builder sample (walking forward) for label / bank / twist
  let j = 0
  for (let i = 0; i <= segments; i++) {
    const p = curve.getPointAt(Math.min(i / segments, 1))
    points.push(p)
    let best = Infinity
    let bestJ = j
    for (let k = -6; k <= 40; k++) {
      const idx = (j + k + samples.length) % samples.length
      const d = samples[idx].p.distanceToSquared(p)
      if (d < best) {
        best = d
        bestJ = idx
      }
    }
    j = bestJ
    labels.push(samples[j].label)
    banks.push(samples[j].bank)
    twists.push(samples[j].twist)
  }
  // corkscrew roll from the frame's position inside its run (exact and smooth;
  // nearest-sample values would step by ~17° every 0.5 m)
  for (let i = 0; i <= segments; ) {
    if (labels[i] !== 'twist') {
      twists[i] = 0
      i++
      continue
    }
    let e = i
    while (e + 1 <= segments && labels[e + 1] === 'twist') e++
    for (let k = i; k <= e; k++) {
      const u = e > i ? (k - i) / (e - i) : 1
      twists[k] = 2 * Math.PI * u * u * (3 - 2 * u)
    }
    i = e + 1
  }
  // smooth the bank so roll changes stay gradual
  const smooth = banks.map((_, i) => {
    let acc = 0
    for (let k = -10; k <= 10; k++) acc += banks[(i + k + banks.length) % banks.length]
    return acc / 21
  })
  const base = new Vector3()
  frames.normals.forEach((n, i) => {
    // A positive rotation about the forward tangent tilts "up" to the RIGHT
    // (right-hand rule), so a left-turn bank uses the negative angle.
    n.applyAxisAngle(frames.tangents[i], -smooth[i])
    if (twists[i] !== 0 && twists[i] < 2 * Math.PI - 1e-6) {
      // corkscrew: roll around the heartline, so the rider's heart moves on the
      // builder's line while the rail spirals around it
      base.copy(n)
      n.applyAxisAngle(frames.tangents[i], -twists[i])
      points[i].addScaledVector(base, HEARTLINE).addScaledVector(n, -HEARTLINE)
    }
    frames.binormals[i].crossVectors(frames.tangents[i], n)
  })
  // Corkscrews make the rail longer than the heartline it spirals around.
  // Re-parametrise everything by RAIL arc length, so cars placed at fixed
  // intervals keep their spacing along the rails (couplings never stretch).
  return resampleByRailLength({ length, segments, points, labels, ...frames })
}

function resampleByRailLength(src: Track): Track {
  const n = src.segments
  const cum = [0]
  for (let i = 1; i <= n; i++) cum.push(cum[i - 1] + src.points[i].distanceTo(src.points[i - 1]))
  const railLength = cum[n]
  const out: Track = { length: railLength, segments: n, points: [], tangents: [], normals: [], binormals: [], labels: [] }
  let i = 0
  for (let k = 0; k <= n; k++) {
    const target = (k / n) * railLength
    while (i < n - 1 && cum[i + 1] < target) i++
    const span = cum[i + 1] - cum[i]
    const u = span > 1e-9 ? Math.min(1, Math.max(0, (target - cum[i]) / span)) : 0
    const t = new Vector3().lerpVectors(src.tangents[i], src.tangents[i + 1], u).normalize()
    const nn = new Vector3().lerpVectors(src.normals[i], src.normals[i + 1], u)
    nn.addScaledVector(t, -nn.dot(t)).normalize()
    out.points.push(new Vector3().lerpVectors(src.points[i], src.points[i + 1], u))
    out.tangents.push(t)
    out.normals.push(nn)
    out.binormals.push(new Vector3().crossVectors(t, nn))
    out.labels.push(src.labels[u < 0.5 ? i : i + 1])
  }
  return out
}

export interface TrackFrame {
  p: Vector3
  t: Vector3
  n: Vector3
  b: Vector3
}
export const createFrame = (): TrackFrame => ({ p: new Vector3(), t: new Vector3(), n: new Vector3(), b: new Vector3() })

/** Interpolated frame at arc length s (wraps around the closed track). Returns the label. */
export function sampleTrack(track: Track, s: number, out: TrackFrame) {
  const L = track.length
  const u = (((s % L) + L) % L) / L
  const f = u * track.segments
  const i = Math.min(Math.floor(f), track.segments - 1)
  const k = f - i
  out.p.lerpVectors(track.points[i], track.points[i + 1], k)
  out.t.lerpVectors(track.tangents[i], track.tangents[i + 1], k).normalize()
  out.n.lerpVectors(track.normals[i], track.normals[i + 1], k)
  out.n.addScaledVector(out.t, -out.n.dot(out.t)).normalize()
  out.b.crossVectors(out.t, out.n)
  return track.labels[i]
}

/** Arc-length ranges [start, end] of every contiguous run of a label. */
export function labelRanges(track: Track, label: TrackLabel): [number, number][] {
  const out: [number, number][] = []
  let start = -1
  for (let i = 0; i <= track.segments; i++) {
    const on = track.labels[i] === label
    if (on && start < 0) start = i
    if ((!on || i === track.segments) && start >= 0) {
      out.push([(start / track.segments) * track.length, (i / track.segments) * track.length])
      start = -1
    }
  }
  return out
}
