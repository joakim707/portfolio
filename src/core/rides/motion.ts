import { Vector3, type Curve } from 'three'
import type { RidePhaseTimings, RideState } from './types'

/** Shared motion maths for ride simulations (deterministic, no physics engine). */

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

/**
 * Amplitude envelope: ramps up over `rampUp`, holds, then decays over `rampDown`.
 * Pendulum / swing-boat rides use angle = maxAngle * envelope(t) * sin(ωt).
 */
export function amplitudeEnvelope(t: number, total: number, rampUp: number, rampDown: number) {
  if (t <= 0 || t >= total) return 0
  return Math.min(smoothstep(0, rampUp, t), 1 - smoothstep(total - rampDown, total, t))
}

export interface TrackFrames {
  tangents: Vector3[]
  normals: Vector3[]
  binormals: Vector3[]
}

/**
 * Rotation-minimising frames along a curve (parallel transport). The coaster's
 * orientation stays continuous through loops and corkscrews, unlike Frenet
 * frames which flip at inflection points. Banking/twists are added on top as
 * a roll around the tangent.
 */
export function computeParallelTransportFrames(
  curve: Curve<Vector3>,
  segments: number,
  closed: boolean,
  initialUp = new Vector3(0, 1, 0),
): TrackFrames {
  const tangents: Vector3[] = []
  const normals: Vector3[] = []
  const binormals: Vector3[] = []
  for (let i = 0; i <= segments; i++) tangents.push(curve.getTangentAt(i / segments).normalize())

  const n0 = initialUp.clone().sub(tangents[0].clone().multiplyScalar(initialUp.dot(tangents[0])))
  if (n0.lengthSq() < 1e-6) n0.set(1, 0, 0)
  normals.push(n0.normalize())
  binormals.push(new Vector3().crossVectors(tangents[0], normals[0]))

  const axis = new Vector3()
  for (let i = 1; i <= segments; i++) {
    const n = normals[i - 1].clone()
    axis.crossVectors(tangents[i - 1], tangents[i])
    const len = axis.length()
    if (len > 1e-8) {
      axis.divideScalar(len)
      const angle = Math.acos(Math.min(1, Math.max(-1, tangents[i - 1].dot(tangents[i]))))
      n.applyAxisAngle(axis, angle)
    }
    normals.push(n.normalize())
    binormals.push(new Vector3().crossVectors(tangents[i], n))
  }

  // Closed tracks: spread the residual twist so the last frame matches the first.
  if (closed) {
    const first = normals[0]
    const last = normals[segments]
    let theta = Math.acos(Math.min(1, Math.max(-1, first.dot(last)))) / segments
    if (tangents[0].dot(new Vector3().crossVectors(last, first)) < 0) theta = -theta
    for (let i = 1; i <= segments; i++) {
      normals[i].applyAxisAngle(tangents[i], theta * i)
      binormals[i].crossVectors(tangents[i], normals[i])
    }
  }
  return { tangents, normals, binormals }
}

/**
 * How closed the restraints are (0 = open, 1 = locked) for the current state.
 * Every ride animates its harness/lap bars from this single value.
 */
export function restraintAmount(state: RideState, t: number, timings: RidePhaseTimings) {
  switch (state) {
    case 'RESTRAINTS':
      return easeInOutCubic(clamp01(t / (timings.restraints * 0.8)))
    case 'STARTING':
    case 'RUNNING':
    case 'BRAKING':
    case 'INTERRUPTED':
      return 1
    case 'UNBOARDING':
      return 1 - easeInOutCubic(clamp01(t / 0.6))
    default:
      return 0
  }
}

/**
 * Cubic Hermite stop: travel `distance` in `duration`, starting at `v0` and
 * ending at rest exactly on the mark. Returns [position, speed] at time t.
 */
export function hermiteStop(t: number, duration: number, distance: number, v0: number): [number, number] {
  const k = clamp01(t / duration)
  const m0 = Math.min(v0 * duration, distance * 2.5) // keep it monotonic
  const h01 = -2 * k ** 3 + 3 * k ** 2
  const h10 = k ** 3 - 2 * k ** 2 + k
  const d01 = (-6 * k ** 2 + 6 * k) / duration
  const d10 = (3 * k ** 2 - 4 * k + 1) / duration
  return [h01 * distance + h10 * m0, d01 * distance + d10 * m0]
}
