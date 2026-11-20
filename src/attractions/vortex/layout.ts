import { smoothstep } from '@/core/rides/motion'
import type { RideConfig } from '@/core/rides/types'

/**
 * THE VORTEX — layout in the zone's local frame:
 * origin = plot centre, +Z = towards the central plaza (entrance arch at z = 28).
 * The arm swings in the XY plane around an axle along Z carried by two
 * A-frames at z = ±FRAME_Z; the gondola disc at its end spins about the arm.
 */

export const PIVOT_Y = 17.5
export const ARM = 16
export const FRAME_Z = 5.6
export const FRAME_SPREAD = 10
export const GONDOLA_RADIUS = 4
export const SEAT_COUNT = 12
export const SEAT_RADIUS = 3.6
export const DECK_RADIUS = 7
export const FENCE_RADIUS = 5.4
export const FENCE_HEIGHT = 0.85

// ── motion ────────────────────────────────────────────────────────────────────

/** Pendulum constant g / L_eff (period ≈ 8 s for small swings). */
const K = 9.81 / 16
const E_TOP = 2 * K // energy needed to go over the top
const energyOfAmplitude = (deg: number) => K * (1 - Math.cos((deg * Math.PI) / 180))

export const VORTEX = {
  run: 44,
  brake: 4.5,
  /** Gondola spin rate at full speed (rad/s), normalised so it ends where it started. */
  spin: 1.2,
  spinUp: 6,
  spinDown: 9,
  dt: 1 / 240,
}

/**
 * Energy programme of the arm: gentle swings → big swings → over the top
 * (full revolutions) → back to swings → rest.
 */
function targetEnergy(t: number) {
  if (t < 4) return energyOfAmplitude(20) * smoothstep(0, 4, t)
  if (t < 16) return energyOfAmplitude(20) + (energyOfAmplitude(110) - energyOfAmplitude(20)) * smoothstep(4, 16, t)
  if (t < 20) return energyOfAmplitude(110) + (E_TOP * 1.12 - energyOfAmplitude(110)) * smoothstep(16, 20, t)
  if (t < 28) return E_TOP * 1.12 // over the top: full revolutions
  if (t < 40) return E_TOP * 1.12 + (energyOfAmplitude(10) - E_TOP * 1.12) * smoothstep(28, 40, t)
  return energyOfAmplitude(10) + (energyOfAmplitude(5) - energyOfAmplitude(10)) * smoothstep(40, VORTEX.run, t)
}

export interface VortexTable {
  /** Arm angle (rad, unwrapped: a full revolution adds 2π). */
  arm: Float32Array
  armRate: Float32Array
  spin: Float32Array
  samples: number
}

/**
 * Integrates the driven pendulum once (fixed step, semi-implicit Euler) over
 * RUNNING + BRAKING, so the ride is identical every time:
 *   θ'' = −K sin θ + τ,  τ = clamp(c·(E* − E), ±τmax) · θ'/(|θ'| + w0)
 * i.e. the motor pushes along the motion (or against it) with a bounded
 * torque, even when the arm is nearly still.
 * During BRAKING the brakes add damping and the angle is eased to exactly 0.
 * The spin is a smooth rate profile, scaled so the gondola ends where it began.
 */
export const TABLE: VortexTable = (() => {
  const { run, brake, dt } = VORTEX
  const n = Math.ceil((run + brake) / dt) + 2
  const arm = new Float32Array(n)
  const armRate = new Float32Array(n)
  const spinRate = new Float64Array(n)
  let th = 0
  let w = 0.06 // the drive tyres give the first nudge
  for (let i = 0; i < n; i++) {
    const t = i * dt
    arm[i] = th
    armRate[i] = w
    const E = 0.5 * w * w + K * (1 - Math.cos(th))
    let acc = -K * Math.sin(th)
    if (t < run) {
      // the motor brakes harder than it pumps
      const torque = Math.max(-1.4, Math.min(0.8, 3 * (targetEnergy(t) - E)))
      acc += (torque * w) / (Math.abs(w) + 0.25)
    }
    else acc += -2.2 * w - 1.2 * K * Math.sin(th) // brakes + strong centring
    w += acc * dt
    th += w * dt
    const r = VORTEX.spin * Math.min(smoothstep(0, VORTEX.spinUp, t), 1 - smoothstep(run - VORTEX.spinDown, run, t))
    spinRate[i] = t < run ? r : 0
  }
  // ease the arm to exactly hang straight down (nearest multiple of 2π) at the very end
  const end = Math.round(arm[n - 1] / (2 * Math.PI)) * 2 * Math.PI
  const t0 = run + brake - 1.5
  for (let i = 0; i < n; i++) {
    const k = smoothstep(t0, run + brake, i * dt)
    arm[i] = arm[i] * (1 - k) + end * k
  }
  // integrate the spin and scale it to a whole number of turns
  let total = 0
  for (let i = 0; i < n; i++) total += spinRate[i] * dt
  const turns = Math.max(1, Math.round(total / (2 * Math.PI)))
  const scale = (turns * 2 * Math.PI) / total
  const spin = new Float32Array(n)
  let acc = 0
  for (let i = 0; i < n; i++) {
    spin[i] = acc
    acc += spinRate[i] * scale * dt
  }
  return { arm, armRate, spin, samples: n }
})()

/** Pose at time t since RUNNING began (BRAKING continues the same table). */
export function vortexPose(t: number, out: { arm: number; rate: number; spin: number }) {
  const f = Math.max(0, t) / VORTEX.dt
  const i = Math.min(Math.floor(f), TABLE.samples - 2)
  const k = Math.min(1, f - i)
  out.arm = TABLE.arm[i] + (TABLE.arm[i + 1] - TABLE.arm[i]) * k
  out.rate = TABLE.armRate[i] + (TABLE.armRate[i + 1] - TABLE.armRate[i]) * k
  out.spin = TABLE.spin[i] + (TABLE.spin[i + 1] - TABLE.spin[i]) * k
  return out
}

export const VORTEX_CONFIG: RideConfig = {
  timings: { restraints: 2.8, starting: 3.5, braking: VORTEX.brake, unboarding: 2, interrupted: 1.2 },
  playerSeat: 0,
  // outside the glass ring, in front of seat 0 which faces the plaza (+Z) when parked
  platform: { position: [0, 0.05, FENCE_RADIUS + 0.7], yaw: 0 },
  exit: { position: [5, 0, 12], yaw: Math.PI },
  boarding: { position: [0, 0, 10], radius: 5 },
  eyeOffset: [0, 0.78, -0.08],
  stationCamera: { position: [6, 3, 11], target: [0, 1.6, SEAT_RADIUS] },
  // vehicle = the player's seat: film the rider from the front, the arm behind
  chaseOffset: [0, 1.8, -8],
  cinematicShots: [
    [0, 5, 25], // broadside from the plaza
    [23, 16, 9], // level with the swing, east
    [-23, 16, 9], // west
    [0, 38, 12], // above the axle
    [10, 2, 13], // low, by the deck
  ],
  idleCycleEvery: 30,
}
