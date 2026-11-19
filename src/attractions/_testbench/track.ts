import { CatmullRomCurve3, Vector3 } from 'three'
import { computeParallelTransportFrames } from '@/core/rides/motion'

export type TrackLabel = 'station' | 'turn' | 'lift' | 'drop' | 'flat' | 'loop' | 'brake'

interface Sample {
  p: Vector3
  label: TrackLabel
  /** Banking roll in radians (positive leans into a left turn). */
  bank: number
}

/**
 * "Turtle" track builder: chain straights, banked turns and vertical loops.
 * Heading angle a: direction = (cos a, 0, -sin a); positive turns go left
 * (counter-clockwise seen from above).
 */
export class TrackBuilder {
  readonly samples: Sample[] = []
  private p: Vector3
  private a: number
  private readonly step: number

  constructor(start: Vector3, heading: number, step = 0.5) {
    this.p = start.clone()
    this.a = heading
    this.step = step
  }

  private dir(a = this.a) {
    return new Vector3(Math.cos(a), 0, -Math.sin(a))
  }
  private left(a = this.a) {
    return new Vector3(-Math.sin(a), 0, -Math.cos(a))
  }
  private push(p: Vector3, label: TrackLabel, bank = 0) {
    this.samples.push({ p: p.clone(), label, bank })
  }

  straight(len: number, dy: number, label: TrackLabel) {
    const n = Math.max(1, Math.round(len / this.step))
    const d = this.dir()
    const start = this.p.clone()
    for (let i = 1; i <= n; i++) {
      const k = i / n
      // smoothstep on the height so slopes ease in/out
      const h = k * k * (3 - 2 * k)
      this.push(start.clone().addScaledVector(d, len * k).setY(start.y + dy * h), label)
    }
    this.p.copy(this.samples[this.samples.length - 1].p)
    return this
  }

  turn(radius: number, angle: number, dy: number, label: TrackLabel, bank: number) {
    const centre = this.p.clone().addScaledVector(this.left(), radius)
    const n = Math.max(2, Math.round((radius * Math.abs(angle)) / this.step))
    const y0 = this.p.y
    for (let i = 1; i <= n; i++) {
      const k = i / n
      const a = this.a + angle * k
      const p = centre.clone().addScaledVector(this.left(a), -radius)
      p.y = y0 + dy * k
      this.push(p, label, bank * Math.sin(Math.PI * k))
    }
    this.a += angle
    this.p.copy(this.samples[this.samples.length - 1].p)
    return this
  }

  /** Vertical loop in the heading plane, drifting sideways by `lateral` (to the left). */
  loop(radius: number, lateral: number, label: TrackLabel) {
    const d = this.dir()
    const l = this.left()
    const start = this.p.clone()
    const n = Math.round((2 * Math.PI * radius) / this.step)
    for (let i = 1; i <= n; i++) {
      const th = (i / n) * Math.PI * 2
      const p = start
        .clone()
        .addScaledVector(d, radius * Math.sin(th))
        .add(new Vector3(0, radius * (1 - Math.cos(th)), 0))
        .addScaledVector(l, lateral * (th / (Math.PI * 2)))
      this.push(p, label)
    }
    this.p.copy(this.samples[this.samples.length - 1].p)
    return this
  }
}

export interface Track {
  curve: CatmullRomCurve3
  length: number
  /** Sampled frames along the arc length (index = s / length * segments). */
  segments: number
  points: Vector3[]
  tangents: Vector3[]
  normals: Vector3[]
  binormals: Vector3[]
  labels: TrackLabel[]
}

/** Closed, arc-length sampled track with banked rotation-minimising frames. */
export function buildTrack(samples: Sample[], segments = 900): Track {
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
  // map each frame back to the nearest builder sample for its label / bank
  let j = 0
  for (let i = 0; i <= segments; i++) {
    const p = curve.getPointAt(Math.min(i / segments, 1))
    points.push(p)
    let best = Infinity
    let bestJ = j
    for (let k = -6; k <= 30; k++) {
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
  }
  // smooth the bank so roll changes are gradual, then apply it around the tangent
  const smooth = banks.map((_, i) => {
    let acc = 0
    for (let k = -8; k <= 8; k++) acc += banks[(i + k + banks.length) % banks.length]
    return acc / 17
  })
  frames.normals.forEach((n, i) => {
    // A positive rotation about the forward tangent tilts "up" to the RIGHT
    // (right-hand rule), so a left-turn bank uses the negative angle.
    n.applyAxisAngle(frames.tangents[i], -smooth[i])
    frames.binormals[i].crossVectors(frames.tangents[i], n)
  })
  return { curve, length, segments, points, labels, ...frames }
}

/** Interpolated frame at arc length s (wraps around the closed track). */
export function sampleTrack(track: Track, s: number, out: { p: Vector3; t: Vector3; n: Vector3; b: Vector3 }) {
  const L = track.length
  const u = (((s % L) + L) % L) / L
  const f = u * track.segments
  const i = Math.min(Math.floor(f), track.segments - 1)
  const k = f - i
  out.p.lerpVectors(track.points[i], track.points[i + 1], k)
  out.t.lerpVectors(track.tangents[i], track.tangents[i + 1], k).normalize()
  out.n.lerpVectors(track.normals[i], track.normals[i + 1], k)
  // re-orthogonalise the interpolated frame
  out.n.addScaledVector(out.t, -out.n.dot(out.t)).normalize()
  out.b.crossVectors(out.t, out.n)
  return track.labels[i]
}
